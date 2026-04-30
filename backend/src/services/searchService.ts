import prisma from '../utils/prisma';

export interface SearchResult {
  movies: any[];
  people: any[];
  physicalCopies: any[];
  total: number;
}

export interface SearchOptions {
  query: string;
  limit?: number;
  offset?: number;
  type?: 'movie' | 'person' | 'copy' | 'all';
  fuzzy?: boolean;
}

// Cached flag: null = unknown, true = available, false = unavailable
let pgTrgmAvailable: boolean | null = null;

async function checkPgTrgm(): Promise<boolean> {
  if (pgTrgmAvailable !== null) return pgTrgmAvailable;
  try {
    await prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS pg_trgm`;
    pgTrgmAvailable = true;
  } catch {
    pgTrgmAvailable = false;
  }
  return pgTrgmAvailable;
}

/**
 * Search movies using ILIKE (always works, no extension needed)
 */
async function searchMoviesILike(searchTerm: string, limit: number, offset: number) {
  return prisma.movie.findMany({
    where: {
      AND: [
        { status: 'VERIFIED' as any },
        {
          OR: [
            { title: { contains: searchTerm, mode: 'insensitive' } },
            { originalTitle: { contains: searchTerm, mode: 'insensitive' } },
            { plot: { contains: searchTerm, mode: 'insensitive' } },
            { tagline: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
      ],
    },
    take: limit,
    skip: offset,
    select: {
      id: true,
      title: true,
      originalTitle: true,
      year: true,
      posterUrl: true,
      rating: true,
      runtime: true,
      status: true,
    },
  });
}

/**
 * Full-text search across movies, people, and physical copies.
 * Tries pg_trgm fuzzy matching first; falls back to ILIKE automatically.
 */
export async function fullTextSearch(options: SearchOptions): Promise<SearchResult> {
  const { query, limit = 20, offset = 0, type = 'all', fuzzy = true } = options;

  const result: SearchResult = {
    movies: [],
    people: [],
    physicalCopies: [],
    total: 0,
  };

  if (!query || query.trim().length === 0) {
    return result;
  }

  const searchTerm = query.trim();
  const useFuzzy = fuzzy && await checkPgTrgm();

  // Search movies
  if (type === 'movie' || type === 'all') {
    if (useFuzzy) {
      try {
        result.movies = await prisma.$queryRaw`
          SELECT
            m.id, m.title, m."originalTitle", m.year, m."posterUrl", m.rating, m.runtime, m.status,
            GREATEST(
              similarity(m.title, ${searchTerm}),
              COALESCE(similarity(m."originalTitle", ${searchTerm}), 0),
              COALESCE(similarity(m.plot, ${searchTerm}), 0) * 0.5
            ) as rank
          FROM "Movie" m
          WHERE m.status = 'VERIFIED'
            AND (
              m.title % ${searchTerm}
              OR m."originalTitle" % ${searchTerm}
              OR m.plot ILIKE ${'%' + searchTerm + '%'}
            )
          ORDER BY rank DESC
          LIMIT ${limit}
          OFFSET ${offset}
        `;
      } catch {
        pgTrgmAvailable = false;
        result.movies = await searchMoviesILike(searchTerm, limit, offset);
      }
    } else {
      result.movies = await searchMoviesILike(searchTerm, limit, offset);
    }
  }

  // Search people
  if (type === 'person' || type === 'all') {
    if (useFuzzy) {
      try {
        result.people = await prisma.$queryRaw`
          SELECT p.id, p.name, p."photoUrl", similarity(p.name, ${searchTerm}) as rank
          FROM "Person" p
          WHERE p.name % ${searchTerm}
          ORDER BY rank DESC
          LIMIT ${limit}
          OFFSET ${offset}
        `;
      } catch {
        pgTrgmAvailable = false;
        result.people = await prisma.person.findMany({
          where: { name: { contains: searchTerm, mode: 'insensitive' } },
          take: limit,
          skip: offset,
          select: { id: true, name: true, photoUrl: true },
        });
      }
    } else {
      result.people = await prisma.person.findMany({
        where: {
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { biography: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
        take: limit,
        skip: offset,
        select: { id: true, name: true, photoUrl: true },
      });
    }
  }

  // Search physical copies (UPC/EAN/ASIN lookups)
  if (type === 'copy' || type === 'all') {
    result.physicalCopies = await prisma.physicalCopy.findMany({
      where: {
        OR: [
          { editionName: { contains: searchTerm, mode: 'insensitive' } },
          { distributor: { contains: searchTerm, mode: 'insensitive' } },
          { upc: { contains: searchTerm, mode: 'insensitive' } },
          { ean: { contains: searchTerm, mode: 'insensitive' } },
          { asin: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      take: limit,
      skip: offset,
      include: {
        movie: {
          select: { id: true, title: true, year: true, posterUrl: true },
        },
      },
    });
  }

  result.total = result.movies.length + result.people.length + result.physicalCopies.length;
  return result;
}

/**
 * Find movies with similar titles (duplicate detection).
 * Uses pg_trgm if available, falls back to ILIKE prefix match.
 */
export async function findSimilarTitles(title: string, year?: number, limit = 10) {
  const useFuzzy = await checkPgTrgm();

  if (useFuzzy) {
    try {
      if (year) {
        return await prisma.$queryRaw<any[]>`
          SELECT id, title, "originalTitle", year, "posterUrl",
            similarity(title, ${title}) as rank
          FROM "Movie"
          WHERE title % ${title} AND year = ${year}
          ORDER BY rank DESC
          LIMIT ${limit}
        `;
      }
      return await prisma.$queryRaw<any[]>`
        SELECT id, title, "originalTitle", year, "posterUrl",
          similarity(title, ${title}) as rank
        FROM "Movie"
        WHERE title % ${title}
        ORDER BY rank DESC, year DESC
        LIMIT ${limit}
      `;
    } catch {
      pgTrgmAvailable = false;
    }
  }

  // ILIKE fallback
  return prisma.movie.findMany({
    where: {
      AND: [
        { title: { contains: title, mode: 'insensitive' } },
        ...(year ? [{ year }] : []),
      ],
    },
    take: limit,
    select: { id: true, title: true, originalTitle: true, year: true, posterUrl: true },
  });
}

/**
 * Quick autocomplete suggestions (always ILIKE — must be fast).
 */
export async function getSearchSuggestions(query: string, limit = 5) {
  if (!query || query.length < 2) return [];

  try {
    return await prisma.movie.findMany({
      where: {
        AND: [
          { status: 'VERIFIED' as any },
          { title: { startsWith: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
      select: { id: true, title: true, year: true },
      orderBy: { title: 'asc' },
    });
  } catch {
    return [];
  }
}

/**
 * Initialize pg_trgm extension + GIN indexes.
 * Call once on server startup (non-fatal if it fails).
 */
export async function initializeFullTextSearch() {
  try {
    await prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS pg_trgm`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_movie_title_trgm ON "Movie" USING gin (title gin_trgm_ops)`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_movie_orig_title_trgm ON "Movie" USING gin ("originalTitle" gin_trgm_ops)`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_person_name_trgm ON "Person" USING gin (name gin_trgm_ops)`;
    pgTrgmAvailable = true;
    console.log('✅ pg_trgm extension and GIN indexes ready');
    return true;
  } catch (error) {
    pgTrgmAvailable = false;
    console.log('ℹ️  pg_trgm unavailable — search will use ILIKE fallback');
    return false;
  }
}
