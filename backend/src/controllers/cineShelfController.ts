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

function deriveComponents(copy: any, displayFormat: string): any[] {
  if (copy.format === 'LASERDISC' || ['DVD', 'BLU_RAY', 'BLU_RAY_4K', 'HD_DVD', 'CD', 'MINI_DISC'].includes(copy.format)) {
    return [{ id: `comp-${copy.id}-1`, component_type: 'disc', component_name: `${displayFormat} Disc` }];
  }
  if (['VHS', 'BETAMAX', 'CASSETTE', 'EIGHT_TRACK'].includes(copy.format)) {
    return [{ id: `comp-${copy.id}-1`, component_type: 'tape', component_name: `${displayFormat} Tape` }];
  }
  return [{ id: `comp-${copy.id}-1`, component_type: 'other', component_name: displayFormat }];
}

function formatRelease(copy: any, movie?: any) {
  const displayFormat = FORMAT_DISPLAY[copy.format] || copy.format;

  // Use stored components if present, otherwise derive from format
  const storedComponents = Array.isArray(copy.components) ? copy.components : null;
  const components = storedComponents || deriveComponents(copy, displayFormat);

  const name = copy.editionName || [
    movie?.title,
    copy.edition,
    displayFormat,
    copy.distributor ? `(${copy.distributor})` : null,
  ].filter(Boolean).join(' ');

  const result: any = {
    id: `rel-${copy.id}`,
    movie_id: movie ? toUmdbId(movie.id) : null,
    name,
    format: displayFormat,
    language: copy.language || null,
    package_type: copy.packageType || copy.edition || 'Standard',
    region: copy.region || null,
    country: copy.country || null,
    barcode: copy.upc || copy.ean || null,
    upc: copy.upc || null,
    ean: copy.ean || null,
    asin: copy.asin || null,
    release_date: copy.releaseDate
      ? copy.releaseDate.toISOString().split('T')[0]
      : null,
    distributor: copy.distributor || null,
    disc_count: copy.discCount || 1,
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

/** Optional: allows through if UMDB_API_KEY is not configured (open API) */
export function apiKeyAuth(req: Request, res: Response, next: NextFunction): void {
  const requiredKey = process.env.UMDB_API_KEY;
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

/** Required: always demands a valid API key (for write endpoints) */
export function requireApiKey(req: Request, res: Response, next: NextFunction): void {
  const requiredKey = process.env.UMDB_API_KEY;
  if (!requiredKey) {
    res.status(503).json({ status: 503, error: 'UMDB_API_KEY is not configured on this server' });
    return;
  }

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

// ─── Edition endpoints (CineShelf write API) ──────────────────────────────────

// Format map for inbound CineShelf format strings → Prisma enum
const FORMAT_INBOUND: Record<string, string> = {
  'vhs': 'VHS',
  'dvd': 'DVD',
  'blu-ray': 'BLU_RAY',
  'blu_ray': 'BLU_RAY',
  'bluray': 'BLU_RAY',
  '4k': 'BLU_RAY_4K',
  '4k uhd': 'BLU_RAY_4K',
  '4k uhd blu-ray': 'BLU_RAY_4K',
  'hd dvd': 'HD_DVD',
  'laserdisc': 'LASERDISC',
  'laser disc': 'LASERDISC',
  'betamax': 'BETAMAX',
  'cd': 'CD',
  'vinyl': 'VINYL',
  'cassette': 'CASSETTE',
  '8-track': 'EIGHT_TRACK',
  'minidisc': 'MINI_DISC',
  'digital': 'DIGITAL',
  'streaming': 'STREAMING',
};

function resolveFormat(rawFormat: string): string {
  return FORMAT_INBOUND[rawFormat.toLowerCase()] || rawFormat.toUpperCase().replace(/[- ]/g, '_');
}

// POST /v1/editions (and /v1/releases alias) — CineShelf pushes a new edition to UMDB
export const createEdition = asyncHandler(async (req: Request, res: Response) => {
  const {
    movie_id,      // umdb-{id}
    tmdb_id,       // fallback: look up by TMDB ID
    imdb_id,       // fallback: look up by IMDb ID
    name,
    format,
    package_type,
    region,
    country,
    barcode,
    upc,
    ean,
    release_date,
    distributor,
    disc_count,
    language,
    notes,
    cover_image,
    components,    // array of { component_type/type, component_name/name, description?, position? }
  } = req.body;

  if (!format) throw new AppError('format is required', 400);

  // Normalize components: accept both { type, name } and { component_type, component_name }
  const normalizedComponents = Array.isArray(components)
    ? components.map((c: any) => ({
        component_type: c.component_type || c.type || 'other',
        component_name: c.component_name || c.name || '',
        ...(c.description && { description: c.description }),
        ...(c.position !== undefined && { position: c.position }),
      }))
    : null;

  // Resolve movie — try movie_id, then tmdb_id, then imdb_id
  let movieId: string | null = null;

  if (movie_id) {
    movieId = fromUmdbId(movie_id);
  } else if (tmdb_id) {
    const match = await prisma.externalMatch.findFirst({
      where: { externalId: String(tmdb_id), source: 'TMDB' },
      select: { movieId: true },
    });
    if (match) movieId = match.movieId;
  } else if (imdb_id) {
    const match = await prisma.externalMatch.findFirst({
      where: { externalId: String(imdb_id), source: 'IMDB' },
      select: { movieId: true },
    });
    if (match) movieId = match.movieId;
  }

  if (!movieId) {
    throw new AppError(
      'Could not resolve movie. Provide movie_id (umdb-{id}), tmdb_id, or imdb_id that exists in UMDB.',
      422
    );
  }

  const movie = await prisma.movie.findUnique({
    where: { id: movieId, status: EntryStatus.VERIFIED },
    select: { id: true, title: true, year: true, posterUrl: true },
  });
  if (!movie) throw new AppError('Movie not found or not yet verified in UMDB', 404);

  // Deduplicate by barcode if provided
  const barcodeValue = upc || barcode || ean || null;
  if (barcodeValue) {
    const existing = await prisma.physicalCopy.findFirst({
      where: {
        movieId,
        OR: [
          { upc: barcodeValue },
          { ean: barcodeValue },
        ],
      },
    });
    if (existing) {
      return res.status(200).json({
        duplicate: true,
        message: 'An edition with this barcode already exists for this movie',
        edition: formatRelease(existing, movie),
      });
    }
  }

  const resolvedFormat = resolveFormat(format);

  const copy = await prisma.physicalCopy.create({
    data: {
      movieId,
      format: resolvedFormat as any,
      editionName: name || null,
      packageType: package_type || null,
      language: language || null,
      region: region || null,
      country: country || null,
      discCount: disc_count ? parseInt(String(disc_count), 10) : null,
      upc: upc || barcode || null,
      ean: ean || null,
      distributor: distributor || null,
      releaseDate: release_date ? new Date(release_date) : null,
      notes: notes || null,
      coverImageUrl: cover_image || null,
      components: normalizedComponents ?? undefined,
      // API-submitted editions go straight to VERIFIED (trusted source)
      status: EntryStatus.VERIFIED,
    },
  });

  res.status(201).json({
    duplicate: false,
    edition: formatRelease(copy, movie),
  });
});

// GET /v1/movie/:id/editions — list all editions for a movie (alias for /releases)
export const getMovieEditions = asyncHandler(async (req: Request, res: Response) => {
  const rawId = fromUmdbId(req.params.id);

  const movie = await prisma.movie.findUnique({
    where: { id: rawId, status: EntryStatus.VERIFIED },
    select: { id: true, title: true, year: true, posterUrl: true },
  });
  if (!movie) throw new AppError('Movie not found', 404);

  const copies = await prisma.physicalCopy.findMany({
    where: { movieId: rawId, status: EntryStatus.VERIFIED },
    orderBy: [{ releaseDate: 'asc' }, { createdAt: 'asc' }],
  });

  res.json({
    movie_id: toUmdbId(movie.id),
    results: copies.map(copy => formatRelease(copy, movie)),
  });
});

// GET /v1/editions/:id — single edition detail
export const getEdition = asyncHandler(async (req: Request, res: Response) => {
  const rawId = req.params.id.replace(/^rel-/, '');

  const copy = await prisma.physicalCopy.findUnique({
    where: { id: rawId, status: EntryStatus.VERIFIED },
    include: {
      movie: { select: { id: true, title: true, year: true, posterUrl: true } },
    },
  });
  if (!copy) throw new AppError('Edition not found', 404);
  res.json(formatRelease(copy, copy.movie));
});

// PUT /v1/editions/:id — update an edition (requires API key)
export const updateEdition = asyncHandler(async (req: Request, res: Response) => {
  const rawId = req.params.id.replace(/^rel-/, '');

  const existing = await prisma.physicalCopy.findUnique({
    where: { id: rawId, status: EntryStatus.VERIFIED },
    include: {
      movie: { select: { id: true, title: true, year: true, posterUrl: true } },
    },
  });
  if (!existing) throw new AppError('Edition not found', 404);

  const {
    name, format, package_type, region, country, barcode, upc, ean,
    release_date, distributor, disc_count, language, notes, cover_image, components,
  } = req.body;

  const updated = await prisma.physicalCopy.update({
    where: { id: rawId },
    data: {
      ...(name !== undefined && { editionName: name || null }),
      ...(format !== undefined && { format: resolveFormat(format) as any }),
      ...(package_type !== undefined && { packageType: package_type || null }),
      ...(language !== undefined && { language: language || null }),
      ...(region !== undefined && { region: region || null }),
      ...(country !== undefined && { country: country || null }),
      ...(disc_count !== undefined && { discCount: disc_count ? parseInt(String(disc_count), 10) : null }),
      ...(upc !== undefined && { upc: upc || null }),
      ...(barcode !== undefined && !upc && { upc: barcode || null }),
      ...(ean !== undefined && { ean: ean || null }),
      ...(distributor !== undefined && { distributor: distributor || null }),
      ...(release_date !== undefined && { releaseDate: release_date ? new Date(release_date) : null }),
      ...(notes !== undefined && { notes: notes || null }),
      ...(cover_image !== undefined && { coverImageUrl: cover_image || null }),
      ...(Array.isArray(components) && {
        components: components.map((c: any) => ({
          component_type: c.component_type || c.type || 'other',
          component_name: c.component_name || c.name || '',
          ...(c.description && { description: c.description }),
          ...(c.position !== undefined && { position: c.position }),
        })),
      }),
    },
  });

  res.json(formatRelease(updated, existing.movie));
});
