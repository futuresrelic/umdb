import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

/**
 * Full-text search across movies, people, and physical copies
 * Uses PostgreSQL's pg_trgm extension for fuzzy matching
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

  try {
    // Search movies (title, original title, plot, tagline)
    if (type === 'movie' || type === 'all') {
      if (fuzzy) {
        // Use pg_trgm similarity search
        result.movies = await prisma.$queryRaw`
          SELECT
            m.*,
            GREATEST(
              similarity(m.title, ${searchTerm}),
              COALESCE(similarity(m."originalTitle", ${searchTerm}), 0),
              COALESCE(similarity(m.plot, ${searchTerm}), 0) * 0.5
            ) as rank
          FROM "Movie" m
          WHERE
            m.title % ${searchTerm}
            OR m."originalTitle" % ${searchTerm}
            OR m.plot ILIKE ${'%' + searchTerm + '%'}
          ORDER BY rank DESC
          LIMIT ${limit}
          OFFSET ${offset}
        `;
      } else {
        // Standard ILIKE search
        result.movies = await prisma.movie.findMany({
          where: {
            OR: [
              { title: { contains: searchTerm, mode: 'insensitive' } },
              { originalTitle: { contains: searchTerm, mode: 'insensitive' } },
              { plot: { contains: searchTerm, mode: 'insensitive' } },
              { tagline: { contains: searchTerm, mode: 'insensitive' } },
            ],
          },
          take: limit,
          skip: offset,
          include: {
            movieGenres: {
              include: { genre: true },
            },
            physicalCopies: {
              take: 1,
            },
          },
        });
      }
    }

    // Search people (name, biography)
    if (type === 'person' || type === 'all') {
      if (fuzzy) {
        result.people = await prisma.$queryRaw`
          SELECT
            p.*,
            similarity(p.name, ${searchTerm}) as rank
          FROM "Person" p
          WHERE p.name % ${searchTerm}
          ORDER BY rank DESC
          LIMIT ${limit}
          OFFSET ${offset}
        `;
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
        });
      }
    }

    // Search physical copies (edition name, distributor, upc, etc.)
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
            select: {
              id: true,
              title: true,
              year: true,
              posterUrl: true,
            },
          },
        },
      });
    }

    result.total = result.movies.length + result.people.length + result.physicalCopies.length;

    return result;
  } catch (error) {
    console.error('Search error:', error);
    throw error;
  }
}

/**
 * Search for similar titles (for duplicate detection)
 */
export async function findSimilarTitles(title: string, year?: number, limit = 10) {
  try {
    // Use trigram similarity with optional year matching
    const results = await prisma.$queryRaw<any[]>`
      SELECT
        id,
        title,
        "originalTitle",
        year,
        "posterUrl",
        similarity(title, ${title}) as rank
      FROM "Movie"
      WHERE title % ${title}
        ${year ? prisma.$queryRawUnsafe(`AND year = ${year}`) : prisma.$queryRawUnsafe('')}
      ORDER BY rank DESC, year DESC
      LIMIT ${limit}
    `;

    return results;
  } catch (error) {
    console.error('Similar titles search error:', error);
    return [];
  }
}

/**
 * Autocomplete search suggestions
 */
export async function getSearchSuggestions(query: string, limit = 5) {
  if (!query || query.length < 2) {
    return [];
  }

  try {
    const suggestions = await prisma.$queryRaw<any[]>`
      SELECT DISTINCT
        title,
        year,
        'movie' as type
      FROM "Movie"
      WHERE title ILIKE ${query + '%'}
      ORDER BY title
      LIMIT ${limit}
    `;

    return suggestions;
  } catch (error) {
    console.error('Suggestions error:', error);
    return [];
  }
}

/**
 * Initialize pg_trgm extension (run once during setup)
 */
export async function initializeFullTextSearch() {
  try {
    // Enable pg_trgm extension
    await prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS pg_trgm;`;

    // Create GIN indexes for faster trigram searches
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_movie_title_trgm ON "Movie" USING gin (title gin_trgm_ops);
    `;

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_movie_original_title_trgm ON "Movie" USING gin ("originalTitle" gin_trgm_ops);
    `;

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_person_name_trgm ON "Person" USING gin (name gin_trgm_ops);
    `;

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_alternative_title_trgm ON "AlternativeTitle" USING gin (title gin_trgm_ops);
    `;

    console.log('✅ Full-text search indexes created successfully');
    return true;
  } catch (error) {
    console.error('Error initializing full-text search:', error);
    return false;
  }
}
