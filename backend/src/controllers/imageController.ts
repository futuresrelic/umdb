import { Request, Response } from 'express';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import prisma from '../utils/prisma';
import { ImageType } from '@prisma/client';

const MAX_SIZE_BYTES = 3 * 1024 * 1024; // 3 MB base64 limit

// ─── Upload image ─────────────────────────────────────────────────────────────
// POST /api/images
// Body: { dataUrl, imageType, altText, movieId?, physicalCopyId?, isPrimary?, width?, height? }
export const uploadImage = asyncHandler(async (req: Request, res: Response) => {
  const {
    dataUrl, imageType = 'SNAPSHOT', altText,
    movieId, physicalCopyId, isPrimary = false,
    width, height,
  } = req.body;

  if (!dataUrl) throw new AppError('dataUrl is required', 400);
  if (!dataUrl.startsWith('data:image/')) throw new AppError('dataUrl must be a valid image data URL', 400);
  if (!movieId && !physicalCopyId) throw new AppError('Provide movieId or physicalCopyId', 400);

  const sizeBytes = Math.ceil((dataUrl.length * 3) / 4);
  if (sizeBytes > MAX_SIZE_BYTES) {
    throw new AppError(`Image too large (max 3 MB). Current size: ${(sizeBytes / 1024 / 1024).toFixed(1)} MB`, 413);
  }

  const mimeMatch = dataUrl.match(/^data:(image\/[a-z]+);base64,/);
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';

  // Validate target exists
  if (movieId) {
    const movie = await prisma.movie.findUnique({ where: { id: movieId }, select: { id: true } });
    if (!movie) throw new AppError('Movie not found', 404);
  }
  if (physicalCopyId) {
    const copy = await prisma.physicalCopy.findUnique({ where: { id: physicalCopyId }, select: { id: true } });
    if (!copy) throw new AppError('Physical copy not found', 404);
  }

  // If setting as primary, unset other primaries for that target
  if (isPrimary && movieId) {
    await prisma.mediaImage.updateMany({
      where: { movieId, imageType: imageType as ImageType },
      data: { isPrimary: false },
    });
  }
  if (isPrimary && physicalCopyId) {
    await prisma.mediaImage.updateMany({
      where: { physicalCopyId, imageType: imageType as ImageType },
      data: { isPrimary: false },
    });
  }

  const image = await prisma.mediaImage.create({
    data: {
      dataUrl,
      mimeType,
      imageType: imageType as ImageType,
      altText: altText || null,
      movieId: movieId || null,
      physicalCopyId: physicalCopyId || null,
      isPrimary,
      sizeBytes,
      width: width ? parseInt(width) : null,
      height: height ? parseInt(height) : null,
      uploadedById: req.user?.id || null,
    },
  });

  // Don't return the full dataUrl in the create response — just metadata + src URL
  const { dataUrl: _omit, ...meta } = image;
  res.status(201).json({ ...meta, src: `/api/images/${image.id}` });
});

// ─── Serve image ──────────────────────────────────────────────────────────────
// GET /api/images/:id  →  returns raw image bytes with proper Content-Type
export const serveImage = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const image = await prisma.mediaImage.findUnique({
    where: { id },
    select: { dataUrl: true, mimeType: true },
  });

  if (!image) throw new AppError('Image not found', 404);

  const base64Data = image.dataUrl.replace(/^data:image\/[a-z]+;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');

  res.set('Content-Type', image.mimeType);
  res.set('Cache-Control', 'public, max-age=31536000, immutable');
  res.send(buffer);
});

// ─── List images for a movie ──────────────────────────────────────────────────
// GET /api/images/movie/:movieId
export const getMovieImages = asyncHandler(async (req: Request, res: Response) => {
  const { movieId } = req.params;

  const images = await prisma.mediaImage.findMany({
    where: { movieId },
    select: {
      id: true, imageType: true, altText: true, isPrimary: true,
      width: true, height: true, sizeBytes: true, createdAt: true,
      uploadedById: true,
      uploadedBy: { select: { id: true, name: true } },
    },
    orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
  });

  res.json(images.map(img => ({ ...img, src: `/api/images/${img.id}` })));
});

// ─── List images for a physical copy ─────────────────────────────────────────
// GET /api/images/copy/:copyId
export const getCopyImages = asyncHandler(async (req: Request, res: Response) => {
  const { copyId } = req.params;

  const images = await prisma.mediaImage.findMany({
    where: { physicalCopyId: copyId },
    select: {
      id: true, imageType: true, altText: true, isPrimary: true,
      width: true, height: true, sizeBytes: true, createdAt: true,
      uploadedById: true,
      uploadedBy: { select: { id: true, name: true } },
    },
    orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
  });

  res.json(images.map(img => ({ ...img, src: `/api/images/${img.id}` })));
});

// ─── Update image metadata ────────────────────────────────────────────────────
// PUT /api/images/:id
export const updateImage = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { altText, isPrimary, imageType } = req.body;

  const image = await prisma.mediaImage.findUnique({ where: { id } });
  if (!image) throw new AppError('Image not found', 404);

  // Only uploader or admin can edit
  if (image.uploadedById && image.uploadedById !== req.user?.id && req.user?.role !== 'ADMIN') {
    throw new AppError('Not authorised to edit this image', 403);
  }

  if (isPrimary && (image.movieId || image.physicalCopyId)) {
    await prisma.mediaImage.updateMany({
      where: {
        ...(image.movieId ? { movieId: image.movieId } : { physicalCopyId: image.physicalCopyId! }),
        imageType: (imageType || image.imageType) as ImageType,
        id: { not: id },
      },
      data: { isPrimary: false },
    });
  }

  const updated = await prisma.mediaImage.update({
    where: { id },
    data: {
      ...(altText !== undefined && { altText: altText || null }),
      ...(isPrimary !== undefined && { isPrimary }),
      ...(imageType !== undefined && { imageType: imageType as ImageType }),
    },
    select: {
      id: true, imageType: true, altText: true, isPrimary: true,
      width: true, height: true, sizeBytes: true, createdAt: true, uploadedById: true,
    },
  });

  res.json({ ...updated, src: `/api/images/${id}` });
});

// ─── Delete image ─────────────────────────────────────────────────────────────
// DELETE /api/images/:id
export const deleteImage = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const image = await prisma.mediaImage.findUnique({ where: { id } });
  if (!image) throw new AppError('Image not found', 404);

  if (image.uploadedById && image.uploadedById !== req.user?.id && req.user?.role !== 'ADMIN') {
    throw new AppError('Not authorised to delete this image', 403);
  }

  await prisma.mediaImage.delete({ where: { id } });
  res.json({ message: 'Image deleted' });
});
