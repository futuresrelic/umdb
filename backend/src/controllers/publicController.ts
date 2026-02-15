import { Request, Response } from 'express';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import prisma from '../utils/prisma';
import { EntryStatus } from '@prisma/client';

/**
 * UMDB Public API
 * Read-only endpoints for external services (CineShelf, etc.) to consume UMDB data.
 * No authentication required for GET endpoints.
 */

// Search movies by title, year, or UPC
export const searchMovies = asyncHandler(async (req: Request, res: Response) => {
  const { q, year, upc, limit = '20', offset = '0' } = req.query;

  if (!q && !upc) {
    throw new AppError('Provide q (title search) or upc (barcode lookup)', 400);
  }

  const take = Math.min(parseInt(limit as string) || 20, 100);
  const skip = parseInt(offset as string) || 0;

  if (upc) {
    // Barcode/UPC lookup - find movie via physical copy (VERIFIED only)
    const copies = await prisma.physicalCopy.findMany({
      where: {
        status: EntryStatus.VERIFIED,
        OR: [
          { upc: { equals: upc as string } },
          { ean: { equals: upc as string } },
          { asin: { equals: upc as string } }
        ]
      },
      include: {
        movie: {
          include: {
            movieGenres: { include: { genre: true } },
            externalMatches: {
              select: { source: true, externalId: true, url: true, rating: true }
            }
          }
        }
      },
      take,
      skip
    });

    const movies = copies.map(copy => ({
      ...copy.movie,
      matchedCopy: {
        id: copy.id,
        format: copy.format,
        upc: copy.upc,
        ean: copy.ean,
        asin: copy.asin,
        edition: copy.edition,
        region: copy.region,
        distributor: copy.distributor,
        releaseDate: copy.releaseDate
      }
    }));

    return res.json({ movies, total: movies.length, query: { upc } });
  }

  // Title search - VERIFIED only for public API
  const where: any = {
    status: EntryStatus.VERIFIED,
    title: { contains: q as string, mode: 'insensitive' }
  };
  if (year) {
    where.year = parseInt(year as string);
  }

  const [movies, total] = await Promise.all([
    prisma.movie.findMany({
      where,
      select: {
        id: true,
        title: true,
        originalTitle: true,
        year: true,
        runtime: true,
        plot: true,
        posterUrl: true,
        rating: true,
        language: true,
        country: true,
        sourceType: true,
        mediaType: true,
        movieGenres: { include: { genre: { select: { name: true } } } },
        externalMatches: {
          select: { source: true, externalId: true, url: true }
        },
        physicalCopies: {
          select: {
            id: true,
            format: true,
            upc: true,
            ean: true,
            asin: true,
            edition: true,
            region: true,
            distributor: true,
            releaseDate: true
          }
        }
      },
      orderBy: [
        { year: 'desc' },
        { title: 'asc' }
      ],
      take,
      skip
    }),
    prisma.movie.count({ where })
  ]);

  res.json({
    movies,
    total,
    limit: take,
    offset: skip,
    query: { q, year }
  });
});

// Get full movie details by UMDB ID
export const getMovie = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const movie = await prisma.movie.findUnique({
    where: { id, status: EntryStatus.VERIFIED },
    include: {
      movieGenres: { include: { genre: true } },
      moviePeople: {
        include: { person: true },
        orderBy: [{ role: 'asc' }, { order: 'asc' }]
      },
      externalMatches: {
        select: {
          source: true,
          externalId: true,
          url: true,
          title: true,
          rating: true,
          voteCount: true,
          releaseDate: true
        }
      },
      physicalCopies: {
        orderBy: { createdAt: 'desc' }
      },
      alternativeTitles: {
        select: { title: true, region: true, type: true }
      }
    }
  });

  if (!movie) {
    throw new AppError('Movie not found', 404);
  }

  res.json(movie);
});

// Lookup a physical copy by barcode (UPC, EAN, or ASIN)
export const lookupBarcode = asyncHandler(async (req: Request, res: Response) => {
  const { code } = req.params;

  const copies = await prisma.physicalCopy.findMany({
    where: {
      status: EntryStatus.VERIFIED,
      OR: [
        { upc: code },
        { ean: code },
        { asin: code }
      ]
    },
    include: {
      movie: {
        include: {
          movieGenres: { include: { genre: { select: { name: true } } } },
          moviePeople: {
            where: { role: { in: ['DIRECTOR', 'ACTOR'] } },
            include: { person: { select: { id: true, name: true } } },
            take: 10
          },
          externalMatches: {
            select: { source: true, externalId: true, url: true }
          }
        }
      }
    }
  });

  if (copies.length === 0) {
    return res.status(404).json({
      found: false,
      code,
      message: 'No physical copy found with this barcode'
    });
  }

  res.json({
    found: true,
    code,
    copies: copies.map(copy => ({
      copyId: copy.id,
      format: copy.format,
      edition: copy.edition,
      region: copy.region,
      distributor: copy.distributor,
      releaseDate: copy.releaseDate,
      upc: copy.upc,
      ean: copy.ean,
      asin: copy.asin,
      movie: copy.movie
    }))
  });
});

// Get all physical copies for a movie (public endpoint)
export const getMoviePhysicalCopies = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const movie = await prisma.movie.findUnique({
    where: { id, status: EntryStatus.VERIFIED },
    select: { id: true, title: true, year: true, posterUrl: true }
  });

  if (!movie) {
    throw new AppError('Movie not found', 404);
  }

  const copies = await prisma.physicalCopy.findMany({
    where: { movieId: id, status: EntryStatus.VERIFIED },
    orderBy: { createdAt: 'desc' }
  });

  res.json({ movie, copies });
});

// Submit a physical copy to UMDB (requires API key)
export const submitPhysicalCopy = asyncHandler(async (req: Request, res: Response) => {
  const apiKey = req.headers['x-api-key'] as string;
  const validApiKey = process.env.UMDB_API_KEY;

  if (!validApiKey || apiKey !== validApiKey) {
    throw new AppError('Valid API key required', 401);
  }

  const {
    movieId,
    format,
    upc,
    ean,
    asin,
    edition,
    region,
    distributor,
    releaseDate,
    condition,
    notes,
    coverImageUrl
  } = req.body;

  if (!movieId || !format) {
    throw new AppError('movieId and format are required', 400);
  }

  // Check movie exists
  const movie = await prisma.movie.findUnique({ where: { id: movieId } });
  if (!movie) {
    throw new AppError('Movie not found', 404);
  }

  // Check for duplicate UPC
  if (upc) {
    const existing = await prisma.physicalCopy.findFirst({
      where: { upc, movieId }
    });
    if (existing) {
      return res.status(200).json({
        message: 'Physical copy with this UPC already exists for this movie',
        copy: existing,
        duplicate: true
      });
    }
  }

  const copy = await prisma.physicalCopy.create({
    data: {
      movieId,
      format,
      upc: upc || null,
      ean: ean || null,
      asin: asin || null,
      edition: edition || null,
      region: region || null,
      distributor: distributor || null,
      releaseDate: releaseDate ? new Date(releaseDate) : null,
      condition: condition || null,
      notes: notes || null,
      coverImageUrl: coverImageUrl || null,
      status: EntryStatus.PENDING,
    }
  });

  res.status(201).json({ copy, duplicate: false });
});

// Get UMDB stats (for partner integrations)
export const getStats = asyncHandler(async (_req: Request, res: Response) => {
  const [movieCount, physicalCopyCount, personCount] = await Promise.all([
    prisma.movie.count({ where: { status: EntryStatus.VERIFIED } }),
    prisma.physicalCopy.count({ where: { status: EntryStatus.VERIFIED } }),
    prisma.person.count()
  ]);

  res.json({
    movies: movieCount,
    physicalCopies: physicalCopyCount,
    people: personCount,
    version: '1.0',
    attribution: 'This product uses the TMDB API but is not endorsed or certified by TMDB.'
  });
});
