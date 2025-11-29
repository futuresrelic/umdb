import { Request, Response } from 'express';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import prisma from '../utils/prisma';
import { Prisma } from '@prisma/client';

export const getAllMovies = asyncHandler(async (req: Request, res: Response) => {
  const { search, year, sourceType, limit = 50, offset = 0 } = req.query;

  const where: Prisma.MovieWhereInput = {};

  if (search) {
    where.OR = [
      { title: { contains: String(search), mode: 'insensitive' } },
      { originalTitle: { contains: String(search), mode: 'insensitive' } }
    ];
  }

  if (year) {
    where.year = parseInt(String(year));
  }

  if (sourceType) {
    where.sourceType = String(sourceType) as any;
  }

  const [movies, total] = await Promise.all([
    prisma.movie.findMany({
      where,
      include: {
        externalMatches: true,
        movieGenres: {
          include: {
            genre: true
          }
        },
        moviePeople: {
          include: {
            person: true
          },
          where: {
            role: { in: ['DIRECTOR', 'ACTOR'] }
          },
          take: 5
        }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(String(limit)),
      skip: parseInt(String(offset))
    }),
    prisma.movie.count({ where })
  ]);

  res.json({
    movies,
    total,
    limit: parseInt(String(limit)),
    offset: parseInt(String(offset))
  });
});

export const getMovieById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const movie = await prisma.movie.findUnique({
    where: { id },
    include: {
      externalMatches: true,
      movieGenres: {
        include: {
          genre: true
        }
      },
      moviePeople: {
        include: {
          person: true
        },
        orderBy: { order: 'asc' }
      }
    }
  });

  if (!movie) {
    throw new AppError('Movie not found', 404);
  }

  res.json(movie);
});

export const createMovie = asyncHandler(async (req: Request, res: Response) => {
  const {
    title,
    originalTitle,
    year,
    runtime,
    plot,
    tagline,
    language,
    country,
    posterUrl,
    backdropUrl,
    sourceType = 'MANUAL',
    physicalFormat,
    distributor,
    upc,
    notes,
    rating,
    genres,
    people
  } = req.body;

  if (!title) {
    throw new AppError('Title is required', 400);
  }

  const movie = await prisma.movie.create({
    data: {
      title,
      originalTitle,
      year: year ? parseInt(year) : null,
      runtime: runtime ? parseInt(runtime) : null,
      plot,
      tagline,
      language,
      country,
      posterUrl,
      backdropUrl,
      sourceType,
      physicalFormat,
      distributor,
      upc,
      notes,
      rating: rating ? parseFloat(rating) : null,
      movieGenres: genres
        ? {
            create: genres.map((genreId: string) => ({
              genre: { connect: { id: genreId } }
            }))
          }
        : undefined,
      moviePeople: people
        ? {
            create: people.map((p: any) => ({
              person: { connect: { id: p.personId } },
              role: p.role,
              character: p.character,
              order: p.order
            }))
          }
        : undefined
    },
    include: {
      externalMatches: true,
      movieGenres: {
        include: {
          genre: true
        }
      },
      moviePeople: {
        include: {
          person: true
        }
      }
    }
  });

  res.status(201).json(movie);
});

export const updateMovie = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData = req.body;

  // Remove relationships from update data (handle separately if needed)
  delete updateData.genres;
  delete updateData.people;
  delete updateData.externalMatches;

  // Convert numeric fields
  if (updateData.year) updateData.year = parseInt(updateData.year);
  if (updateData.runtime) updateData.runtime = parseInt(updateData.runtime);
  if (updateData.rating) updateData.rating = parseFloat(updateData.rating);

  const movie = await prisma.movie.update({
    where: { id },
    data: updateData,
    include: {
      externalMatches: true,
      movieGenres: {
        include: {
          genre: true
        }
      },
      moviePeople: {
        include: {
          person: true
        }
      }
    }
  });

  res.json(movie);
});

export const deleteMovie = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  await prisma.movie.delete({
    where: { id }
  });

  res.status(204).send();
});

export const addExternalMatch = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { source, externalId, url, rating, voteCount } = req.body;

  if (!source || !externalId) {
    throw new AppError('Source and externalId are required', 400);
  }

  const externalMatch = await prisma.externalMatch.create({
    data: {
      movieId: id,
      source,
      externalId,
      url,
      rating: rating ? parseFloat(rating) : null,
      voteCount: voteCount ? parseInt(voteCount) : null
    }
  });

  res.status(201).json(externalMatch);
});
