import { Request, Response } from 'express';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import prisma from '../utils/prisma';
import { PhysicalFormat } from '@prisma/client';

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
    region,
    edition,
    distributor,
    releaseDate,
    upc,
    ean,
    asin,
    condition,
    location,
    purchaseDate,
    purchasePrice,
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

  const copy = await prisma.physicalCopy.create({
    data: {
      movieId,
      format,
      region,
      edition,
      distributor,
      releaseDate: releaseDate ? new Date(releaseDate) : null,
      upc,
      ean,
      asin,
      condition,
      location,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
      purchasePrice: purchasePrice ? parseFloat(purchasePrice) : null,
      notes
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
    region,
    edition,
    distributor,
    releaseDate,
    upc,
    ean,
    asin,
    condition,
    location,
    purchaseDate,
    purchasePrice,
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
      ...(region !== undefined && { region }),
      ...(edition !== undefined && { edition }),
      ...(distributor !== undefined && { distributor }),
      ...(releaseDate !== undefined && { releaseDate: releaseDate ? new Date(releaseDate) : null }),
      ...(upc !== undefined && { upc }),
      ...(ean !== undefined && { ean }),
      ...(asin !== undefined && { asin }),
      ...(condition !== undefined && { condition }),
      ...(location !== undefined && { location }),
      ...(purchaseDate !== undefined && { purchaseDate: purchaseDate ? new Date(purchaseDate) : null }),
      ...(purchasePrice !== undefined && { purchasePrice: purchasePrice ? parseFloat(purchasePrice) : null }),
      ...(notes !== undefined && { notes })
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
