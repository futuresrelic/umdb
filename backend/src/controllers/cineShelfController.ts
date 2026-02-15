import { Request, Response, NextFunction } from 'express';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import prisma from '../utils/prisma';
import { EntryStatus, MediaType } from '@prisma/client';

/**
 * CineShelf API — TMDB-compatible endpoints at /api/v1/
 *
 * UMDB movie IDs are prefixed with "umdb-" to avoid collision with TMDB numeric IDs.
 * CineShelf routes to the correct source:
 *   if (tmdb_id.startsWith('umdb-')) → call UMDB
 *   else → call TMDB
 */

const toUmdbId = (id: string) => `umdb-${id}`;
const fromUmdbId = (umdbId: string) => umdbId.replace(/^umdb-/, '');

// ─── TMDB format helpers ───────────────────────────────────────────────────────

function formatSearchResult(movie: any) {
  const isTV = movie.mediaType === MediaType.TV_SHOW;
  return {
    id: toUmdbId(movie.id),
    media_type: isTV ? 'tv' : 'movie',
    ...(isTV
      ? {
          name: movie.title,
          original_name: movie.originalTitle || movie.title,
          first_air_date: movie.year ? `${movie.year}-01-01` : null,
        }
      : {
          title: movie.title,
          original_title: movie.originalTitle || movie.title,
          release_date: movie.year ? `${movie.year}-01-01` : null,
        }),
    poster_path: movie.posterUrl || null,
    backdrop_path: movie.backdropUrl || null,
    overview: movie.plot || '',
    vote_average: movie.rating || 0,
    popularity: 10.0,
    genre_ids: (movie.movieGenres || [])
      .map((mg: any) => mg.genre?.tmdbId)
      .filter(Boolean),
    original_language: movie.language?.substring(0, 2).toLowerCase() || 'en',
    adult: false,
  };
}

function formatMovieDetails(movie: any, append: string[]) {
  const isTV = movie.mediaType === MediaType.TV_SHOW;

  const genres = (movie.movieGenres || []).map((mg: any) => ({
    id: mg.genre?.tmdbId || 0,
    name: mg.genre?.name || '',
  }));

  const cast = (movie.moviePeople || [])
    .filter((mp: any) => mp.role === 'ACTOR')
    .sort((a: any, b: any) => (a.order ?? 999) - (b.order ?? 999))
    .slice(0, 20)
    .map((mp: any, idx: number) => ({
      name: mp.person?.name || '',
      character: mp.character || '',
      order: mp.order ?? idx,
      profile_path: mp.person?.photoUrl || null,
    }));

  const crew = (movie.moviePeople || [])
    .filter((mp: any) => mp.role !== 'ACTOR')
    .map((mp: any) => ({
      name: mp.person?.name || '',
      job: mp.job || mp.role,
      profile_path: mp.person?.photoUrl || null,
    }));

  const imdbMatch = (movie.externalMatches || []).find((m: any) => m.source === 'IMDB');

  const base: any = {
    id: toUmdbId(movie.id),
    imdb_id: imdbMatch?.externalId || null,
    overview: movie.plot || '',
    poster_path: movie.posterUrl || null,
    backdrop_path: movie.backdropUrl || null,
    vote_average: movie.rating || 0,
    genres,
    original_language: movie.language?.substring(0, 2).toLowerCase() || 'en',
    production_companies: movie.distributor
      ? [{ id: 1, name: movie.distributor }]
      : [],
    tagline: movie.tagline || '',
  };

  if (isTV) {
    Object.assign(base, {
      name: movie.title,
      original_name: movie.originalTitle || movie.title,
      first_air_date: movie.year ? `${movie.year}-01-01` : null,
      episode_run_time: movie.runtime ? [movie.runtime] : [],
      number_of_seasons: 1,
      seasons: [],
      created_by: crew
        .filter((c: any) => c.job === 'DIRECTOR' || c.job === 'DIRECTOR')
        .slice(0, 3)
        .map((c: any) => ({ name: c.name })),
    });
  } else {
    Object.assign(base, {
      title: movie.title,
      original_title: movie.originalTitle || movie.title,
      release_date: movie.year ? `${movie.year}-01-01` : null,
      runtime: movie.runtime || null,
    });
  }

  if (append.includes('credits')) {
    base.credits = { cast, crew };
  }
  if (append.includes('release_dates')) {
    base.release_dates = { results: [] };
  }
  if (append.includes('content_ratings')) {
    base.content_ratings = { results: [] };
  }

  return base;
}

const FORMAT_DISPLAY: Record<string, string> = {
  BLU_RAY: 'Blu-ray',
  BLU_RAY_4K: '4K UHD Blu-ray',
  HD_DVD: 'HD DVD',
  EIGHT_TRACK: '8-Track',
  MINI_DISC: 'MiniDisc',
  LASERDISC: 'LaserDisc',
};

function formatRelease(copy: any, movie?: any) {
  const displayFormat = FORMAT_DISPLAY[copy.format] || copy.format;

  // Derive components from format
  const components: any[] = [];
  if (['VHS', 'BETAMAX', 'CASSETTE', 'EIGHT_TRACK'].includes(copy.format)) {
    components.push({
      id: `comp-${copy.id}-1`,
      component_type: 'tape',
      component_name: `${displayFormat} Tape`,
    });
  } else if (['DVD', 'BLU_RAY', 'BLU_RAY_4K', 'HD_DVD', 'CD', 'MINI_DISC'].includes(copy.format)) {
    components.push({
      id: `comp-${copy.id}-1`,
      component_type: 'disc',
      component_name: `${displayFormat} Disc`,
    });
  } else if (copy.format === 'LASERDISC') {
    components.push({
      id: `comp-${copy.id}-1`,
      component_type: 'disc',
      component_name: 'LaserDisc',
    });
  } else {
    components.push({
      id: `comp-${copy.id}-1`,
      component_type: 'other',
      component_name: displayFormat,
    });
  }

  const nameParts = [
    movie?.title,
    copy.edition,
    displayFormat,
    copy.distributor ? `(${copy.distributor})` : null,
  ].filter(Boolean);

  const result: any = {
    id: `rel-${copy.id}`,
    movie_id: movie ? toUmdbId(movie.id) : null,
    name: nameParts.join(' '),
    format: displayFormat,
    language: copy.language || null,
    package_type: copy.edition || 'Standard',
    region: copy.region || null,
    barcode: copy.upc || copy.ean || null,
    upc: copy.upc || null,
    ean: copy.ean || null,
    asin: copy.asin || null,
    release_date: copy.releaseDate
      ? copy.releaseDate.toISOString().split('T')[0]
      : null,
    distributor: copy.distributor || null,
    disc_count: 1,
    notes: copy.notes || null,
    cover_image: copy.coverImageUrl || null,
    components,
  };

  if (movie) {
    result.movie = {
      id: toUmdbId(movie.id),
      title: movie.title,
      year: movie.year || null,
      poster_path: movie.posterUrl || null,
    };
  }

  return result;
}

// ─── API key middleware ────────────────────────────────────────────────────────

export function apiKeyAuth(req: Request, res: Response, next: NextFunction): void {
  const requiredKey = process.env.UMDB_API_KEY;
  // If no key configured, API is fully open
  if (!requiredKey) { next(); return; }

  const provided =
    (req.headers['x-api-key'] as string) ||
    (req.query.api_key as string);

  if (provided !== requiredKey) {
    res.status(401).json({ status: 401, error: 'Invalid or missing API key' });
    return;
  }
  next();
}

// ─── Role 1: Search ───────────────────────────────────────────────────────────

// GET /v1/search/multi?query={query}&page={page}
export const searchMulti = asyncHandler(async (req: Request, res: Response) => {
  const { query, page = '1' } = req.query;
  if (!query) throw new AppError('query parameter is required', 400);

  const take = 20;
  const skip = (parseInt(page as string, 10) - 1) * take;

  const titleFilter = {
    OR: [
      { title: { contains: query as string, mode: 'insensitive' as const } },
      { originalTitle: { contains: query as string, mode: 'insensitive' as const } },
    ],
  };

  const [movies, total] = await Promise.all([
    prisma.movie.findMany({
      where: { status: EntryStatus.VERIFIED, ...titleFilter },
      include: {
        movieGenres: { include: { genre: { select: { name: true, tmdbId: true } } } },
        externalMatches: { select: { source: true, externalId: true } },
      },
      take,
      skip,
      orderBy: [{ year: 'desc' }, { title: 'asc' }],
    }),
    prisma.movie.count({ where: { status: EntryStatus.VERIFIED, ...titleFilter } }),
  ]);

  res.json({
    results: movies.map(formatSearchResult),
    total_results: total,
    total_pages: Math.ceil(total / take),
    page: parseInt(page as string, 10),
  });
});

// GET /v1/search/releases?query={query}&format={format}&page={page}
export const searchReleases = asyncHandler(async (req: Request, res: Response) => {
  const { query, format, page = '1' } = req.query;

  const take = 20;
  const skip = (parseInt(page as string, 10) - 1) * take;

  const where: any = { status: EntryStatus.VERIFIED };

  if (format) {
    const fmtMap: Record<string, string> = {
      'vhs': 'VHS',
      'dvd': 'DVD',
      'blu-ray': 'BLU_RAY',
      'bluray': 'BLU_RAY',
      'blu_ray': 'BLU_RAY',
      '4k': 'BLU_RAY_4K',
      '4k uhd': 'BLU_RAY_4K',
      'laserdisc': 'LASERDISC',
      'laser disc': 'LASERDISC',
      'betamax': 'BETAMAX',
      'hd dvd': 'HD_DVD',
      'hddvd': 'HD_DVD',
    };
    const mapped = fmtMap[(format as string).toLowerCase()] || (format as string).toUpperCase();
    where.format = mapped;
  }

  if (query) {
    where.movie = {
      status: EntryStatus.VERIFIED,
      OR: [
        { title: { contains: query as string, mode: 'insensitive' } },
        { originalTitle: { contains: query as string, mode: 'insensitive' } },
      ],
    };
  }

  const [copies, total] = await Promise.all([
    prisma.physicalCopy.findMany({
      where,
      include: {
        movie: { select: { id: true, title: true, year: true, posterUrl: true } },
      },
      take,
      skip,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.physicalCopy.count({ where }),
  ]);

  res.json({
    results: copies.map(copy => formatRelease(copy, copy.movie)),
    total_results: total,
    total_pages: Math.ceil(total / take),
    page: parseInt(page as string, 10),
  });
});

// ─── Role 1: Movie / TV details ───────────────────────────────────────────────

// GET /v1/movie/:id[?append_to_response=credits,release_dates]
export const getMovieCineShelf = asyncHandler(async (req: Request, res: Response) => {
  const rawId = fromUmdbId(req.params.id);
  const append = ((req.query.append_to_response as string) || '')
    .split(',').map(s => s.trim()).filter(Boolean);

  const movie = await prisma.movie.findUnique({
    where: { id: rawId, status: EntryStatus.VERIFIED },
    include: {
      movieGenres: { include: { genre: { select: { name: true, tmdbId: true } } } },
      moviePeople: {
        include: { person: { select: { name: true, photoUrl: true } } },
        orderBy: [{ role: 'asc' }, { order: 'asc' }],
      },
      externalMatches: {
        select: { source: true, externalId: true, url: true, rating: true },
      },
    },
  });

  if (!movie) throw new AppError('Movie not found', 404);
  res.json(formatMovieDetails(movie, append));
});

// GET /v1/tv/:id[?append_to_response=credits,content_ratings]
export const getTVShow = asyncHandler(async (req: Request, res: Response) => {
  const rawId = fromUmdbId(req.params.id);
  const append = ((req.query.append_to_response as string) || '')
    .split(',').map(s => s.trim()).filter(Boolean);

  const movie = await prisma.movie.findUnique({
    where: { id: rawId, status: EntryStatus.VERIFIED, mediaType: MediaType.TV_SHOW },
    include: {
      movieGenres: { include: { genre: { select: { name: true, tmdbId: true } } } },
      moviePeople: {
        include: { person: { select: { name: true, photoUrl: true } } },
        orderBy: [{ role: 'asc' }, { order: 'asc' }],
      },
      externalMatches: {
        select: { source: true, externalId: true, url: true, rating: true },
      },
    },
  });

  if (!movie) throw new AppError('TV show not found', 404);
  res.json(formatMovieDetails(movie, append));
});

// GET /v1/movie/:id/images
export const getMovieImages = asyncHandler(async (req: Request, res: Response) => {
  const rawId = fromUmdbId(req.params.id);

  const movie = await prisma.movie.findUnique({
    where: { id: rawId, status: EntryStatus.VERIFIED },
    select: { posterUrl: true, backdropUrl: true, language: true },
  });

  if (!movie) throw new AppError('Movie not found', 404);

  const langCode = movie.language?.substring(0, 2).toLowerCase() || 'en';

  res.json({
    posters: movie.posterUrl
      ? [{ file_path: movie.posterUrl, vote_average: 0, width: 500, height: 750, iso_639_1: langCode }]
      : [],
    backdrops: movie.backdropUrl
      ? [{ file_path: movie.backdropUrl, vote_average: 0, width: 1280, height: 720, iso_639_1: langCode }]
      : [],
  });
});

// GET /v1/movie/:id/credits
export const getMovieCredits = asyncHandler(async (req: Request, res: Response) => {
  const rawId = fromUmdbId(req.params.id);

  const movie = await prisma.movie.findUnique({
    where: { id: rawId, status: EntryStatus.VERIFIED },
    include: {
      moviePeople: {
        include: { person: { select: { name: true, photoUrl: true } } },
        orderBy: [{ role: 'asc' }, { order: 'asc' }],
      },
    },
  });

  if (!movie) throw new AppError('Movie not found', 404);

  const cast = movie.moviePeople
    .filter(mp => mp.role === 'ACTOR')
    .map((mp, idx) => ({
      name: mp.person.name,
      character: mp.character || '',
      order: mp.order ?? idx,
      profile_path: mp.person.photoUrl || null,
    }));

  const crew = movie.moviePeople
    .filter(mp => mp.role !== 'ACTOR')
    .map(mp => ({
      name: mp.person.name,
      job: mp.job || mp.role,
      profile_path: mp.person.photoUrl || null,
    }));

  res.json({ cast, crew });
});

// GET /v1/find/:externalId?external_source=imdb_id
export const findByExternalId = asyncHandler(async (req: Request, res: Response) => {
  const { externalId } = req.params;
  const { external_source = 'imdb_id' } = req.query;

  const sourceMap: Record<string, string> = {
    imdb_id: 'IMDB',
    tmdb_id: 'TMDB',
  };
  const source = sourceMap[external_source as string];
  if (!source) throw new AppError('Unsupported external_source. Use: imdb_id, tmdb_id', 400);

  const match = await prisma.externalMatch.findFirst({
    where: {
      externalId,
      source: source as any,
      movie: { status: EntryStatus.VERIFIED },
    },
    include: {
      movie: {
        include: {
          movieGenres: { include: { genre: { select: { name: true, tmdbId: true } } } },
        },
      },
    },
  });

  if (!match) {
    return res.json({ movie_results: [], tv_results: [] });
  }

  const result = formatSearchResult(match.movie);
  const isTV = match.movie.mediaType === MediaType.TV_SHOW;

  res.json({
    movie_results: isTV ? [] : [result],
    tv_results: isTV ? [result] : [],
  });
});

// ─── Role 2: Physical releases ────────────────────────────────────────────────

// GET /v1/movie/:id/releases
export const getMovieReleases = asyncHandler(async (req: Request, res: Response) => {
  const rawId = fromUmdbId(req.params.id);

  const movie = await prisma.movie.findUnique({
    where: { id: rawId, status: EntryStatus.VERIFIED },
    select: { id: true, title: true, year: true, posterUrl: true },
  });

  if (!movie) throw new AppError('Movie not found', 404);

  const copies = await prisma.physicalCopy.findMany({
    where: { movieId: rawId, status: EntryStatus.VERIFIED },
    orderBy: { releaseDate: 'asc' },
  });

  res.json({
    movie_id: toUmdbId(movie.id),
    results: copies.map(copy => formatRelease(copy, movie)),
  });
});

// GET /v1/releases/:releaseId
export const getRelease = asyncHandler(async (req: Request, res: Response) => {
  const rawId = req.params.releaseId.replace(/^rel-/, '');

  const copy = await prisma.physicalCopy.findUnique({
    where: { id: rawId, status: EntryStatus.VERIFIED },
    include: {
      movie: { select: { id: true, title: true, year: true, posterUrl: true } },
    },
  });

  if (!copy) throw new AppError('Release not found', 404);
  res.json(formatRelease(copy, copy.movie));
});
