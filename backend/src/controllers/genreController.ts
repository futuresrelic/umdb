import { Request, Response } from 'express';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import prisma from '../utils/prisma';

export const getAllGenres = asyncHandler(async (req: Request, res: Response) => {
  const genres = await prisma.genre.findMany({
    include: {
      _count: {
        select: { movieGenres: true }
      }
    },
    orderBy: { name: 'asc' }
  });

  res.json(genres);
});

export const getGenreById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const genre = await prisma.genre.findUnique({
    where: { id },
    include: {
      movieGenres: {
        include: {
          movie: {
            select: {
              id: true,
              title: true,
              year: true,
              posterUrl: true,
              rating: true
            }
          }
        }
      },
      _count: {
        select: { movieGenres: true }
      }
    }
  });

  if (!genre) {
    throw new AppError('Genre not found', 404);
  }

  res.json(genre);
});

export const createGenre = asyncHandler(async (req: Request, res: Response) => {
  const { name, tmdbId } = req.body;

  if (!name) {
    throw new AppError('Name is required', 400);
  }

  const genre = await prisma.genre.create({
    data: {
      name,
      tmdbId: tmdbId ? parseInt(tmdbId) : null
    }
  });

  res.status(201).json(genre);
});

export const updateGenre = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, tmdbId } = req.body;

  const genre = await prisma.genre.update({
    where: { id },
    data: {
      name,
      tmdbId: tmdbId ? parseInt(tmdbId) : null
    }
  });

  res.json(genre);
});

export const deleteGenre = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  await prisma.genre.delete({
    where: { id }
  });

  res.status(204).send();
});
