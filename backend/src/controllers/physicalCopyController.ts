import { Request, Response } from 'express';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import prisma from '../utils/prisma';
import { PhysicalFormat, EntryStatus } from '@prisma/client';

// Get all physical copies for a movie
export const getMoviePhysicalCopies = asyncHandler(async (req: Request, res: Response) => {
  const { movieId } = req.params;

  const copies = await prisma.physicalCopy.findMany({
    where: { movieId },
    orderBy: { createdAt: 'desc' }
  });

  res.json(copies);
});

// Get a specific physical copy
export const getPhysicalCopy = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const copy = await prisma.physicalCopy.findUnique({
    where: { id },
    include: {
      movie: {
        select: {
          id: true,
          title: true,
          year: true,
          posterUrl: true
        }
      }
    }
  });

  if (!copy) {
    throw new AppError('Physical copy not found', 404);
  }

  res.json(copy);
});

// Create a physical copy
export const createPhysicalCopy = asyncHandler(async (req: Request, res: Response) => {
  const { movieId } = req.params;
  const {
    format,
    editionName,
    packageType,
    language,
    region,
    country,
    edition,
    discCount,
    distributor,
    releaseDate,
    upc,
    ean,
    asin,
    condition,
    location,
    purchaseDate,
    purchasePrice,
    coverImageUrl,
    notes
  } = req.body;

  // Validate format
  if (!format || !Object.values(PhysicalFormat).includes(format)) {
    throw new AppError('Valid format is required', 400);
  }

  // Check if movie exists
  const movie = await prisma.movie.findUnique({
    where: { id: movieId }
  });

  if (!movie) {
    throw new AppError('Movie not found', 404);
  }

  const submittedById = req.user?.id;
  const isAdmin = req.user?.role === 'ADMIN';

  const copy = await prisma.physicalCopy.create({
    data: {
      movieId,
      format,
      editionName: editionName || null,
      packageType: packageType || null,
      language: language || null,
      region: region || null,
      country: country || null,
      edition: edition || null,
      discCount: discCount ? parseInt(discCount) : null,
      distributor: distributor || null,
      releaseDate: releaseDate ? new Date(releaseDate) : null,
      upc: upc || null,
      ean: ean || null,
      asin: asin || null,
      condition: condition || null,
      location: location || null,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
      purchasePrice: purchasePrice ? parseFloat(purchasePrice) : null,
      coverImageUrl: coverImageUrl || null,
      notes: notes || null,
      status: isAdmin ? EntryStatus.VERIFIED : EntryStatus.PENDING,
      submittedById: submittedById || null,
      verifiedAt: isAdmin ? new Date() : null,
    },
    include: {
      movie: {
        select: {
          id: true,
          title: true,
          year: true,
          posterUrl: true
        }
      }
    }
  });

  res.status(201).json(copy);
});

// Update a physical copy
export const updatePhysicalCopy = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    format,
    editionName,
    packageType,
    language,
    region,
    country,
    edition,
    discCount,
    distributor,
    releaseDate,
    upc,
    ean,
    asin,
    condition,
    location,
    purchaseDate,
    purchasePrice,
    coverImageUrl,
    notes
  } = req.body;

  // Check if copy exists
  const existing = await prisma.physicalCopy.findUnique({
    where: { id }
  });

  if (!existing) {
    throw new AppError('Physical copy not found', 404);
  }

  // Validate format if provided
  if (format && !Object.values(PhysicalFormat).includes(format)) {
    throw new AppError('Invalid format', 400);
  }

  const copy = await prisma.physicalCopy.update({
    where: { id },
    data: {
      ...(format && { format }),
      ...(editionName !== undefined && { editionName: editionName || null }),
      ...(packageType !== undefined && { packageType: packageType || null }),
      ...(language !== undefined && { language: language || null }),
      ...(region !== undefined && { region: region || null }),
      ...(country !== undefined && { country: country || null }),
      ...(edition !== undefined && { edition: edition || null }),
      ...(discCount !== undefined && { discCount: discCount ? parseInt(discCount) : null }),
      ...(distributor !== undefined && { distributor: distributor || null }),
      ...(releaseDate !== undefined && { releaseDate: releaseDate ? new Date(releaseDate) : null }),
      ...(upc !== undefined && { upc: upc || null }),
      ...(ean !== undefined && { ean: ean || null }),
      ...(asin !== undefined && { asin: asin || null }),
      ...(condition !== undefined && { condition: condition || null }),
      ...(location !== undefined && { location: location || null }),
      ...(purchaseDate !== undefined && { purchaseDate: purchaseDate ? new Date(purchaseDate) : null }),
      ...(purchasePrice !== undefined && { purchasePrice: purchasePrice ? parseFloat(purchasePrice) : null }),
      ...(coverImageUrl !== undefined && { coverImageUrl: coverImageUrl || null }),
      ...(notes !== undefined && { notes: notes || null }),
    },
    include: {
      movie: {
        select: {
          id: true,
          title: true,
          year: true,
          posterUrl: true
        }
      }
    }
  });

  res.json(copy);
});

// Delete a physical copy
export const deletePhysicalCopy = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const existing = await prisma.physicalCopy.findUnique({
    where: { id }
  });

  if (!existing) {
    throw new AppError('Physical copy not found', 404);
  }

  await prisma.physicalCopy.delete({
    where: { id }
  });

  res.json({ message: 'Physical copy deleted successfully' });
});

// Get all physical copies (for inventory/collection view)
export const getAllPhysicalCopies = asyncHandler(async (req: Request, res: Response) => {
  const { format, location, condition, limit, offset } = req.query;

  const where: any = {};

  if (format) {
    where.format = format;
  }
  if (location) {
    where.location = location;
  }
  if (condition) {
    where.condition = condition;
  }

  const [copies, total] = await Promise.all([
    prisma.physicalCopy.findMany({
      where,
      include: {
        movie: {
          select: {
            id: true,
            title: true,
            year: true,
            posterUrl: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit ? parseInt(limit as string) : 50,
      skip: offset ? parseInt(offset as string) : 0
    }),
    prisma.physicalCopy.count({ where })
  ]);

  res.json({
    copies,
    total,
    limit: limit ? parseInt(limit as string) : 50,
    offset: offset ? parseInt(offset as string) : 0
  });
});
