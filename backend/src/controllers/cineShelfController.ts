import { Request, Response, NextFunction } from 'express';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import prisma from '../utils/prisma';
import { EntryStatus, MediaType } from '@prisma/client';
import tmdbService from '../services/tmdbService';

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
    edition: copy.edition || null,
    region: copy.region || null,
    video_standard: copy.videoStandard || null,
    country: copy.country || null,
    barcode: copy.upc || copy.ean || null,
    upc: copy.upc || null,
    ean: copy.ean || null,
    asin: copy.asin || null,
    release_date: copy.releaseDate
      ? copy.releaseDate.toISOString().split('T')[0]
      : null,
    distributor: copy.distributor || null,
    studio: copy.studio || null,
    edition_publisher: copy.editionPublisher || null,
    disc_count: copy.discCount || 1,
    audio_formats: copy.audioFormats || [],
    subtitles: copy.subtitles || [],
    copy_protected: copy.copyProtected || null,
    bonus_content: copy.bonusContent || null,
    notes: copy.notes || null,
    cover_image: copy.coverImageUrl || null,
    components,
    is_box_set: copy.isBoxSet || false,
    box_set_id: copy.boxSetId ? `boxset-${copy.boxSetId}` : null,
  };

  // If this is a box set release, include all movies in the box set
  if (copy.isBoxSet && copy.boxSet) {
    result.box_set_movies = (copy.boxSet.items || [])
      .sort((a: any, b: any) => a.position - b.position)
      .map((item: any) => ({
        umdb_movie_id: item.movie ? toUmdbId(item.movie.id) : null,
        title: item.movie?.title || null,
        year: item.movie?.year || null,
        disc_number: item.discNumber || null,
        disc_label: item.discLabel || null,
        is_present: item.isPresent ?? true,
        position: item.position,
      }));
  }

  // Include additional images if present
  if (copy.images && Array.isArray(copy.images)) {
    result.images = copy.images.map((img: any) => ({
      id: img.id,
      type: img.imageType?.toLowerCase() || 'snapshot',
      url: img.dataUrl,
      alt_text: img.altText || null,
      is_primary: img.isPrimary || false,
      width: img.width || null,
      height: img.height || null,
      mime_type: img.mimeType || 'image/jpeg',
    }));
  }

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
    include: {
      images: {
        orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
      },
      boxSet: {
        include: {
          items: {
            include: {
              movie: { select: { id: true, title: true, year: true, posterUrl: true } },
            },
            orderBy: { position: 'asc' },
          },
        },
      },
    },
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
      images: {
        orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
      },
      boxSet: {
        include: {
          items: {
            include: {
              movie: { select: { id: true, title: true, year: true, posterUrl: true } },
            },
            orderBy: { position: 'asc' },
          },
        },
      },
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
    tmdb_id,       // fallback: look up / create by TMDB ID
    imdb_id,       // fallback: look up / create by IMDb ID
    // Inline movie metadata — used to auto-create movie if not found
    title, year, overview, runtime, director, genre, rating,
    media_type, certification, poster_url, backdrop_url,
    movie_language, movie_country,
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

  // Resolve movie — try movie_id, then tmdb_id, then imdb_id.
  // If not found AND title is provided, auto-create it.
  let movieRow: any = null;

  if (movie_id) {
    movieRow = await prisma.movie.findUnique({
      where: { id: fromUmdbId(movie_id) },
      select: { id: true, title: true, year: true, posterUrl: true },
    });
  } else if (tmdb_id || imdb_id) {
    if (tmdb_id) {
      const match = await prisma.externalMatch.findFirst({
        where: { externalId: String(tmdb_id), source: 'TMDB' },
        include: { movie: { select: { id: true, title: true, year: true, posterUrl: true } } },
      });
      if (match) movieRow = match.movie;
    }
    if (!movieRow && imdb_id) {
      const match = await prisma.externalMatch.findFirst({
        where: { externalId: String(imdb_id), source: 'IMDB' },
        include: { movie: { select: { id: true, title: true, year: true, posterUrl: true } } },
      });
      if (match) movieRow = match.movie;
    }
    // Auto-create if we have a title and still no match
    if (!movieRow && title) {
      const { movie: created } = await findOrCreateMovie({
        title, year, overview, runtime, director, genre, rating,
        media_type, certification, poster_url, backdrop_url,
        tmdb_id, imdb_id,
        language: movie_language ?? null,
        country: movie_country ?? null,
      });
      movieRow = { id: created.id, title: created.title, year: created.year, posterUrl: created.posterUrl };
    }
  }

  if (!movieRow) {
    throw new AppError(
      'Could not resolve movie. Provide movie_id (umdb-{id}), tmdb_id, or imdb_id. ' +
      'To auto-create, also include title in the payload.',
      422
    );
  }

  const movie = movieRow;
  const resolvedMovieId: string = movie.id;

  // Deduplicate by barcode if provided
  const barcodeValue = upc || barcode || ean || null;
  if (barcodeValue) {
    const existing = await prisma.physicalCopy.findFirst({
      where: {
        movieId: resolvedMovieId,
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
      movieId: resolvedMovieId,
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
    include: {
      images: {
        orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
      },
      boxSet: {
        include: {
          items: {
            include: {
              movie: { select: { id: true, title: true, year: true, posterUrl: true } },
            },
            orderBy: { position: 'asc' },
          },
        },
      },
    },
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
      images: {
        orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
      },
      boxSet: {
        include: {
          items: {
            include: {
              movie: { select: { id: true, title: true, year: true, posterUrl: true } },
            },
            orderBy: { position: 'asc' },
          },
        },
      },
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

// ─── Movie creation (CineShelf auto-create) ───────────────────────────────────

const MEDIA_TYPE_MAP: Record<string, MediaType> = {
  movie: MediaType.MOVIE,
  tv: MediaType.TV_SHOW,
  tv_show: MediaType.TV_SHOW,
  music: MediaType.MUSIC_ALBUM,
};

/**
 * Find an existing UMDB movie by tmdb_id or imdb_id, or create it from the
 * provided metadata. Returns the movie row and whether it was newly created.
 */
async function findOrCreateMovie(payload: {
  title: string;
  year?: number | null;
  overview?: string | null;
  runtime?: number | null;
  director?: string | null;
  genre?: string | null;
  rating?: number | null;
  media_type?: string | null;
  certification?: string | null;
  poster_url?: string | null;
  backdrop_url?: string | null;
  tmdb_id?: string | null;
  imdb_id?: string | null;
  language?: string | null;
  country?: string | null;
}): Promise<{ movie: any; created: boolean }> {
  // 1. Try to find by tmdb_id
  if (payload.tmdb_id) {
    const match = await prisma.externalMatch.findFirst({
      where: { externalId: String(payload.tmdb_id), source: 'TMDB' },
      include: { movie: true },
    });
    if (match) return { movie: match.movie, created: false };
  }

  // 2. Try to find by imdb_id
  if (payload.imdb_id) {
    const match = await prisma.externalMatch.findFirst({
      where: { externalId: String(payload.imdb_id), source: 'IMDB' },
      include: { movie: true },
    });
    if (match) return { movie: match.movie, created: false };
  }

  // 3. Try to find by title + year (fuzzy match to catch CSV imports)
  if (payload.title && payload.year) {
    const match = await prisma.movie.findFirst({
      where: {
        title: { equals: payload.title, mode: 'insensitive' },
        year: payload.year,
      },
    });
    if (match) {
      console.log(`  🔗 Found existing movie by title+year: "${match.title}" (${match.year}) - ID: ${match.id}`);

      // Link the TMDB/IMDB IDs if provided and not already linked
      const externalMatchData: any[] = [];
      if (payload.tmdb_id) {
        const existingTmdb = await prisma.externalMatch.findFirst({
          where: { movieId: match.id, source: 'TMDB' },
        });
        if (!existingTmdb) {
          externalMatchData.push({ movieId: match.id, source: 'TMDB', externalId: String(payload.tmdb_id) });
          console.log(`    ✅ Linking TMDB ID ${payload.tmdb_id} to existing movie`);
        }
      }
      if (payload.imdb_id) {
        const existingImdb = await prisma.externalMatch.findFirst({
          where: { movieId: match.id, source: 'IMDB' },
        });
        if (!existingImdb) {
          externalMatchData.push({ movieId: match.id, source: 'IMDB', externalId: String(payload.imdb_id) });
          console.log(`    ✅ Linking IMDB ID ${payload.imdb_id} to existing movie`);
        }
      }
      if (externalMatchData.length > 0) {
        await prisma.externalMatch.createMany({ data: externalMatchData });
      }

      return { movie: match, created: false };
    }
  }

  // 4. Create the movie
  // If tmdb_id is provided but metadata is missing, fetch full TMDB data
  let enrichedPayload = { ...payload };
  if (payload.tmdb_id && (!payload.poster_url || !payload.overview || !payload.runtime)) {
    try {
      const tmdbData = await tmdbService.getMovieDetails(Number(payload.tmdb_id));
      console.log(`Enriching movie "${payload.title}" with TMDB data (ID: ${payload.tmdb_id})`);

      // Merge TMDB data (payload takes precedence if already set)
      enrichedPayload = {
        ...payload,
        poster_url: payload.poster_url || tmdbService.getPosterUrl(tmdbData.poster_path),
        backdrop_url: payload.backdrop_url || tmdbService.getBackdropUrl(tmdbData.backdrop_path),
        overview: payload.overview || tmdbData.overview,
        runtime: payload.runtime || tmdbData.runtime,
        rating: payload.rating || tmdbData.vote_average,
        language: payload.language || tmdbData.original_language,
        year: payload.year || (tmdbData.release_date ? new Date(tmdbData.release_date).getFullYear() : null),
        // Extract director from credits if not provided
        director: payload.director || tmdbData.credits?.crew?.find(c => c.job === 'Director')?.name,
        // Extract genres as comma-separated string
        genre: payload.genre || tmdbData.genres?.map(g => g.name).join(', '),
      };
    } catch (tmdbError) {
      // TMDB fetch failed - continue with original payload
      console.warn(`Failed to fetch TMDB data for ${payload.title} (${payload.tmdb_id}):`, tmdbError);
    }
  }

  const resolvedMediaType = MEDIA_TYPE_MAP[(enrichedPayload.media_type || 'movie').toLowerCase()] ?? MediaType.MOVIE;

  const movie = await prisma.movie.create({
    data: {
      title: enrichedPayload.title,
      year: enrichedPayload.year ?? null,
      plot: enrichedPayload.overview ?? null,
      runtime: enrichedPayload.runtime ?? null,
      rating: enrichedPayload.rating ?? null,
      language: enrichedPayload.language ?? null,
      country: enrichedPayload.country ?? null,
      posterUrl: enrichedPayload.poster_url ?? null,
      backdropUrl: enrichedPayload.backdrop_url ?? null,
      mediaType: resolvedMediaType,
      sourceType: 'HYBRID',
      // API-submitted movies from a trusted source go straight to VERIFIED
      status: EntryStatus.VERIFIED,
    },
  });

  // Create external ID links
  const externalMatchData: any[] = [];
  if (payload.tmdb_id) {
    externalMatchData.push({ movieId: movie.id, source: 'TMDB', externalId: String(payload.tmdb_id) });
  }
  if (payload.imdb_id) {
    externalMatchData.push({ movieId: movie.id, source: 'IMDB', externalId: String(payload.imdb_id) });
  }
  if (externalMatchData.length > 0) {
    await prisma.externalMatch.createMany({ data: externalMatchData });
  }

  // Create director person + link if provided
  if (enrichedPayload.director) {
    const directorName = enrichedPayload.director.trim();
    const person = await prisma.person.upsert({
      where: { imdbId: `umdb-dir-${directorName.toLowerCase().replace(/\s+/g, '-')}` },
      update: {},
      create: {
        name: directorName,
        imdbId: `umdb-dir-${directorName.toLowerCase().replace(/\s+/g, '-')}`,
      },
    });
    await prisma.moviePerson.create({
      data: { movieId: movie.id, personId: person.id, role: 'DIRECTOR', order: 0 },
    });
  }

  // Create genre links if provided (comma-separated string)
  if (enrichedPayload.genre) {
    const genreNames = enrichedPayload.genre.split(',').map((g: string) => g.trim()).filter(Boolean);
    for (const name of genreNames) {
      const genre = await prisma.genre.upsert({
        where: { name },
        update: {},
        create: { name },
      });
      await prisma.movieGenre.upsert({
        where: { movieId_genreId: { movieId: movie.id, genreId: genre.id } },
        update: {},
        create: { movieId: movie.id, genreId: genre.id },
      });
    }
  }

  return { movie, created: true };
}

// POST /v1/movies — CineShelf creates (or finds) a movie in UMDB
// Idempotent: returns existing movie if tmdb_id or imdb_id already known
export const createMovieCineShelf = asyncHandler(async (req: Request, res: Response) => {
  const {
    title, year, overview, runtime, director, genre, rating,
    media_type, certification, poster_url, backdrop_url,
    tmdb_id, imdb_id, language, country,
  } = req.body;

  if (!title) throw new AppError('title is required', 400);

  const { movie, created } = await findOrCreateMovie({
    title, year, overview, runtime, director, genre, rating,
    media_type, certification, poster_url, backdrop_url,
    tmdb_id, imdb_id, language, country,
  });

  const status = created ? 201 : 200;

  // Re-fetch with relations for full response
  const full = await prisma.movie.findUnique({
    where: { id: movie.id },
    include: {
      movieGenres: { include: { genre: { select: { name: true, tmdbId: true } } } },
      moviePeople: {
        include: { person: { select: { name: true, photoUrl: true } } },
        orderBy: [{ role: 'asc' }, { order: 'asc' }],
      },
      externalMatches: { select: { source: true, externalId: true } },
    },
  });

  res.status(status).json({
    created,
    movie: formatMovieDetails(full, []),
  });
});

// ─── Box Sets ──────────────────────────────────────────────────────────────────

function formatBoxSet(boxSet: any) {
  return {
    id: `boxset-${boxSet.id}`,
    name: boxSet.name,
    format: boxSet.format || null,
    edition: boxSet.edition || null,
    region: boxSet.region || null,
    package_type: boxSet.packageType || null,
    notes: boxSet.notes || null,
    has_slipcover: boxSet.hasSlipcover || false,
    has_booklet: boxSet.hasBooklet || false,
    has_bonus_disc: boxSet.hasBonusDisc || false,
    bonus_disc_count: boxSet.bonusDiscCount || null,
    has_digital_copy: boxSet.hasDigitalCopy || false,
    has_3d: boxSet.has3d || false,
    cover_image: boxSet.coverImageUrl || null,
    spine_image: boxSet.spineImageUrl || null,
    movies: (boxSet.items || [])
      .sort((a: any, b: any) => a.position - b.position)
      .map((item: any) => {
        // Extract TMDB ID from ExternalMatch
        const tmdbMatch = item.movie?.externalMatches?.find((m: any) => m.source === 'TMDB');
        const tmdbId = tmdbMatch?.externalId || null;

        return {
          tmdb_id: tmdbId,
          umdb_movie_id: item.movie ? toUmdbId(item.movie.id) : null,
          disc_number: item.discNumber || null,
          disc_label: item.discLabel || null,
          is_present: item.isPresent ?? true,
          position: item.position,
          umdb_release_id: item.physicalCopyId ? `rel-${item.physicalCopyId}` : null,
          id: item.movie ? toUmdbId(item.movie.id) : null,
          title: item.movie?.title || null,
          year: item.movie?.year || null,
          poster_path: item.movie?.posterUrl || null,
        };
      }),
  };
}

// POST /v1/box-sets — Create a new box set
export const createBoxSet = asyncHandler(async (req: Request, res: Response) => {
  // 🔍 DEBUG: Log full incoming request
  console.log('\n🎬 === POST /box-sets REQUEST ===');
  console.log('📦 Box Set Name:', req.body.name);
  console.log('📀 Format:', req.body.format);
  console.log('🎥 Movies Count:', req.body.movies?.length || 0);
  console.log('📋 Full Request Body:', JSON.stringify(req.body, null, 2));

  const {
    name,
    format,
    edition,
    region,
    package_type,
    notes,
    has_slipcover,
    has_booklet,
    has_bonus_disc,
    bonus_disc_count,
    has_digital_copy,
    has_3d,
    cover_image,
    spine_image,
    movies = [],
  } = req.body;

  if (!name) throw new AppError('name is required', 400);

  // Deduplication: check if box set with same name + format already exists
  const existing = await prisma.boxSet.findFirst({
    where: {
      name,
      format: format || null,
      status: EntryStatus.VERIFIED,
    },
    include: {
      items: {
        include: {
          movie: { select: { id: true, title: true, year: true, posterUrl: true } },
        },
        orderBy: { position: 'asc' },
      },
    },
  });

  if (existing) {
    return res.status(200).json({
      duplicate: true,
      message: 'A box set with this name and format already exists',
      box_set: formatBoxSet(existing),
    });
  }

  // Create box set
  const boxSet = await prisma.boxSet.create({
    data: {
      name,
      format: format || null,
      edition: edition || null,
      region: region || null,
      packageType: package_type || null,
      notes: notes || null,
      hasSlipcover: has_slipcover ?? false,
      hasBooklet: has_booklet ?? false,
      hasBonusDisc: has_bonus_disc ?? false,
      bonusDiscCount: bonus_disc_count || null,
      hasDigitalCopy: has_digital_copy ?? false,
      has3d: has_3d ?? false,
      coverImageUrl: cover_image || null,
      spineImageUrl: spine_image || null,
      status: EntryStatus.VERIFIED,
    },
  });

  // Create box set items (movies)
  const itemsData = [];
  console.log('\n🎬 === PROCESSING MOVIES ===');
  for (let i = 0; i < movies.length; i++) {
    const movieData = movies[i];
    console.log(`\n📽️  Movie ${i + 1}/${movies.length}:`, movieData.title);
    console.log('  - TMDB ID:', movieData.tmdb_id || 'none');
    console.log('  - Disc #:', movieData.disc_number);
    console.log('  - Disc Label:', movieData.disc_label);

    let resolvedMovieId: string | null = null;
    let resolvedPhysicalCopyId: string | null = null;

    // If umdb_release_id provided, use it
    if (movieData.umdb_release_id) {
      resolvedPhysicalCopyId = movieData.umdb_release_id.replace(/^rel-/, '');
      console.log('  ✅ Using existing PhysicalCopy ID:', resolvedPhysicalCopyId);
    }

    // Resolve or create movie
    if (movieData.tmdb_id || movieData.imdb_id || movieData.title) {
      const { movie } = await findOrCreateMovie({
        title: movieData.title,
        year: movieData.year,
        tmdb_id: movieData.tmdb_id,
        imdb_id: movieData.imdb_id,
        overview: movieData.overview,
        poster_url: movieData.poster_url,
        backdrop_url: movieData.backdrop_url,
        runtime: movieData.runtime,
        director: movieData.director,
        genre: movieData.genre,
        rating: movieData.rating,
        media_type: movieData.media_type,
        language: movieData.language,
        country: movieData.country,
      });
      resolvedMovieId = movie.id;
      console.log('  ✅ Movie created/found:', resolvedMovieId);
    }

    if (!resolvedMovieId && !resolvedPhysicalCopyId) {
      throw new AppError(
        `Movie at position ${i} must have either umdb_release_id, tmdb_id, imdb_id, or title`,
        400
      );
    }

    itemsData.push({
      boxSetId: boxSet.id,
      movieId: resolvedMovieId || null,
      physicalCopyId: resolvedPhysicalCopyId || null,
      discNumber: movieData.disc_number || null,
      discLabel: movieData.disc_label || null,
      isPresent: movieData.is_present ?? true,
      position: movieData.position ?? i,
    });
  }

  if (itemsData.length > 0) {
    await prisma.boxSetItem.createMany({ data: itemsData });
  }

  // Create PhysicalCopy records for each movie in the box set
  // This makes the box set appear in each movie's releases list
  // Wrapped in try-catch for backwards compatibility (schema may not be migrated yet)
  console.log('\n💿 === CREATING PHYSICAL COPIES ===');
  try {
    const releasesData = [];
    for (const item of itemsData) {
      if (item.movieId) {
        const releaseData = {
          movieId: item.movieId,
          format: (format ? resolveFormat(format) : 'OTHER') as any,
          editionName: name,
          edition: edition || null,
          packageType: package_type || null,
          region: region || null,
          notes: notes || null,
          coverImageUrl: cover_image || null,
          isBoxSet: true,
          boxSetId: boxSet.id,
          boxSetPosition: item.position,
          // Box set specific features
          hasSlipcover: has_slipcover ?? false,
          hasBooklet: has_booklet ?? false,
          hasBonusDisc: has_bonus_disc ?? false,
          bonusDiscCount: bonus_disc_count || null,
          hasDigitalCopy: has_digital_copy ?? false,
          has3d: has_3d ?? false,
          discNumber: item.discNumber || null,
          discLabel: item.discLabel || null,
          status: EntryStatus.VERIFIED,
        };
        console.log(`  📀 Preparing PhysicalCopy for ${item.movieId}:`, {
          discNumber: releaseData.discNumber,
          discLabel: releaseData.discLabel,
          isBoxSet: releaseData.isBoxSet,
        });
        releasesData.push(releaseData);
      }
    }

    console.log(`\n🔨 Calling PhysicalCopy.createMany with ${releasesData.length} records...`);
    console.log('📋 Full releasesData:', JSON.stringify(releasesData, null, 2));

    if (releasesData.length > 0) {
      const result = await prisma.physicalCopy.createMany({ data: releasesData as any });
      console.log('✅ PhysicalCopy.createMany SUCCESS:', result);
      console.log(`✅ Created ${result.count} PhysicalCopy records`);

      // CRITICAL: Re-query to get the IDs of created records
      const createdCopies = await prisma.physicalCopy.findMany({
        where: { boxSetId: boxSet.id },
        select: { id: true, movieId: true },
      });
      console.log('✅ Created PhysicalCopy IDs:', createdCopies);

      // CRITICAL: Update BoxSetItems with physicalCopyId so they link back
      console.log('🔗 Linking PhysicalCopy records back to BoxSetItems...');
      for (const copy of createdCopies) {
        const item = itemsData.find(i => i.movieId === copy.movieId);
        if (item) {
          await prisma.boxSetItem.updateMany({
            where: {
              boxSetId: boxSet.id,
              movieId: copy.movieId,
              physicalCopyId: null, // Only update items that don't already have a physicalCopyId
            },
            data: { physicalCopyId: copy.id },
          });
          console.log(`  ✅ Linked PhysicalCopy ${copy.id} to BoxSetItem for movie ${copy.movieId}`);
        }
      }
    } else {
      console.log('⚠️  No PhysicalCopy records to create (no movieIds)');
    }
  } catch (releaseError) {
    // Migration not yet run - box set created but releases not linked
    // This is OK, can be backfilled later with POST /box-sets/:id/create-releases
    console.error('\n❌ === PHYSICAL COPY CREATION FAILED ===');
    console.error('Error Type:', releaseError instanceof Error ? releaseError.constructor.name : typeof releaseError);
    console.error('Error Message:', releaseError instanceof Error ? releaseError.message : String(releaseError));
    console.error('Error Stack:', releaseError instanceof Error ? releaseError.stack : 'No stack trace');
    console.error('Box Set ID:', boxSet.id);
    console.error('Box Set Name:', name);
    console.error('Movies to link:', itemsData.filter(i => i.movieId).length);
    console.error('Backfill URL:', `POST /api/v1/box-sets/${boxSet.id}/create-releases`);
    console.error('=================================\n');
  }

  // Re-fetch with items and releases
  const created = await prisma.boxSet.findUnique({
    where: { id: boxSet.id },
    include: {
      items: {
        include: {
          movie: {
            select: {
              id: true,
              title: true,
              year: true,
              posterUrl: true,
              externalMatches: { select: { source: true, externalId: true } },
            },
          },
        },
        orderBy: { position: 'asc' },
      },
      releases: {
        select: { id: true, movieId: true },
      },
    },
  });

  const response: any = formatBoxSet(created);

  // Add release_id (use first release since they all share the same box set)
  if (created && created.releases && created.releases.length > 0) {
    response.release_id = `rel-${created.releases[0].id}`;
  }

  // Add per-movie release IDs to the movies array
  if (created && 'items' in created && 'releases' in created && response.movies) {
    response.movies = response.movies.map((movie: any) => {
      // Find the matching release for this movie
      const matchingRelease = (created as any).releases?.find((r: any) => r.movieId === movie.id?.replace(/^movie-/, ''));
      return {
        ...movie,
        release_id: matchingRelease ? `rel-${matchingRelease.id}` : undefined,
      };
    });
  }

  res.status(201).json({
    duplicate: false,
    box_set: response,
  });
});

// GET /v1/box-sets/:boxsetId — Get a specific box set
export const getBoxSet = asyncHandler(async (req: Request, res: Response) => {
  const rawId = req.params.boxsetId.replace(/^boxset-/, '');

  const boxSet = await prisma.boxSet.findUnique({
    where: { id: rawId, status: EntryStatus.VERIFIED },
    include: {
      items: {
        include: {
          movie: { select: { id: true, title: true, year: true, posterUrl: true } },
        },
        orderBy: { position: 'asc' },
      },
      releases: {
        select: { id: true },
        take: 1,
      },
    },
  });

  if (!boxSet) throw new AppError('Box set not found', 404);

  const response: any = formatBoxSet(boxSet);
  // Add release_id
  if (boxSet.releases && boxSet.releases.length > 0) {
    response.release_id = `rel-${boxSet.releases[0].id}`;
  }

  res.json(response);
});

// GET /v1/box-sets — List all box sets
export const listBoxSets = asyncHandler(async (req: Request, res: Response) => {
  const { page = '1', limit = '20' } = req.query;

  const take = Math.min(parseInt(limit as string, 10), 100);
  const skip = (parseInt(page as string, 10) - 1) * take;

  const [boxSets, total] = await Promise.all([
    prisma.boxSet.findMany({
      where: { status: EntryStatus.VERIFIED },
      include: {
        items: {
          include: {
            movie: { select: { id: true, title: true, year: true, posterUrl: true } },
          },
          orderBy: { position: 'asc' },
        },
        releases: {
          select: { id: true },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
      take,
      skip,
    }),
    prisma.boxSet.count({ where: { status: EntryStatus.VERIFIED } }),
  ]);

  res.json({
    results: boxSets.map((bs) => {
      const formatted: any = formatBoxSet(bs);
      if (bs.releases && bs.releases.length > 0) {
        formatted.release_id = `rel-${bs.releases[0].id}`;
      }
      return formatted;
    }),
    total_results: total,
    total_pages: Math.ceil(total / take),
    page: parseInt(page as string, 10),
  });
});

// POST /v1/box-sets/:boxsetId/create-releases — Backfill releases for existing box set
export const createBoxSetReleases = asyncHandler(async (req: Request, res: Response) => {
  const rawId = req.params.boxsetId.replace(/^boxset-/, '');

  const boxSet = await prisma.boxSet.findUnique({
    where: { id: rawId },
    include: {
      items: {
        include: {
          movie: { select: { id: true } },
        },
        orderBy: { position: 'asc' },
      },
      releases: {
        select: { id: true },
      },
    },
  });

  if (!boxSet) throw new AppError('Box set not found', 404);

  // Check if releases already exist
  if (boxSet.releases && boxSet.releases.length > 0) {
    return res.status(200).json({
      message: 'Releases already exist for this box set',
      release_ids: boxSet.releases.map(r => `rel-${r.id}`),
    });
  }

  // Create PhysicalCopy records for each movie
  const releasesData = [];
  for (const item of boxSet.items) {
    if (item.movieId) {
      releasesData.push({
        movieId: item.movieId,
        format: (boxSet.format ? resolveFormat(boxSet.format) : 'OTHER') as any,
        editionName: boxSet.name,
        edition: boxSet.edition || null,
        packageType: boxSet.packageType || null,
        region: boxSet.region || null,
        notes: boxSet.notes || null,
        coverImageUrl: boxSet.coverImageUrl || null,
        isBoxSet: true,
        boxSetId: boxSet.id,
        boxSetPosition: item.position,
        // Box set specific features
        hasSlipcover: boxSet.hasSlipcover ?? false,
        hasBooklet: boxSet.hasBooklet ?? false,
        hasBonusDisc: boxSet.hasBonusDisc ?? false,
        bonusDiscCount: boxSet.bonusDiscCount || null,
        hasDigitalCopy: boxSet.hasDigitalCopy ?? false,
        has3d: boxSet.has3d ?? false,
        discNumber: item.discNumber || null,
        discLabel: item.discLabel || null,
        status: EntryStatus.VERIFIED,
      });
    }
  }

  if (releasesData.length === 0) {
    throw new AppError('No movies found in box set to create releases for', 400);
  }

  // Create the releases
  await prisma.physicalCopy.createMany({ data: releasesData as any });

  // Fetch created releases
  const createdReleases = await prisma.physicalCopy.findMany({
    where: { boxSetId: boxSet.id },
    select: { id: true },
  });

  res.status(201).json({
    message: 'Releases created successfully',
    release_ids: createdReleases.map(r => `rel-${r.id}`),
    count: createdReleases.length,
  });
});
