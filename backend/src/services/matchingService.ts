import prisma from '../utils/prisma';
import tmdbService from './tmdbService';
import omdbService from './omdbService';
import { AppError } from '../middleware/errorHandler';
import { ExternalSource } from '@prisma/client';

export interface SourceMatch {
  source: ExternalSource;
  externalId: string;
  title: string;
  year?: number;
  posterUrl?: string;
  rating?: number;
  confidence: number; // 0-100, how confident we are this is a match
}

export interface DetailedSourceData {
  source: ExternalSource;
  externalId: string;
  data: {
    title?: string;
    originalTitle?: string;
    year?: number;
    runtime?: number;
    plot?: string;
    tagline?: string;
    language?: string;
    country?: string;
    posterUrl?: string;
    backdropUrl?: string;
    rating?: number;
    voteCount?: number;
    releaseDate?: string;
    director?: string;
    cast?: Array<{ name: string; character?: string; order?: number }>;
    crew?: Array<{ name: string; job: string }>;
    genres?: Array<{ id?: number; name: string }>;
    alternativeTitles?: Array<{ title: string; country?: string }>;
    rawData?: any; // Full response from the source
  };
}

class MatchingService {
  /**
   * Search for a movie across all available sources
   */
  async findMatches(title: string, year?: number): Promise<SourceMatch[]> {
    const matches: SourceMatch[] = [];

    // Search TMDB
    try {
      const tmdbResults = await tmdbService.searchMovies(title, year);
      for (const result of tmdbResults.slice(0, 5)) {
        matches.push({
          source: 'TMDB' as ExternalSource,
          externalId: result.id.toString(),
          title: result.title,
          year: result.release_date ? parseInt(result.release_date.split('-')[0]) : undefined,
          posterUrl: tmdbService.getPosterUrl(result.poster_path) || undefined,
          rating: result.vote_average,
          confidence: this.calculateConfidence(title, result.title, year,
            result.release_date ? parseInt(result.release_date.split('-')[0]) : undefined)
        });
      }
    } catch (error) {
      console.error('TMDB search failed:', error);
    }

    // Search OMDB
    try {
      const omdbResults = await omdbService.searchMovies(title, year);
      for (const result of omdbResults.slice(0, 5)) {
        matches.push({
          source: 'OMDB' as ExternalSource,
          externalId: result.imdbID,
          title: result.Title,
          year: parseInt(result.Year),
          posterUrl: result.Poster !== 'N/A' ? result.Poster : undefined,
          confidence: this.calculateConfidence(title, result.Title, year, parseInt(result.Year))
        });
      }
    } catch (error) {
      console.error('OMDB search failed:', error);
    }

    // Sort by confidence
    matches.sort((a, b) => b.confidence - a.confidence);

    return matches;
  }

  /**
   * Get detailed data from a specific source
   */
  async getDetailedData(source: ExternalSource, externalId: string): Promise<DetailedSourceData> {
    switch (source) {
      case 'TMDB':
        return this.getTMDBDetails(parseInt(externalId));
      case 'OMDB':
        return this.getOMDBDetails(externalId);
      default:
        throw new AppError(`Source ${source} not supported`, 400);
    }
  }

  /**
   * Save a match to the database
   */
  async saveMatch(movieId: string, source: ExternalSource, externalId: string) {
    const detailedData = await this.getDetailedData(source, externalId);

    const externalMatch = await prisma.externalMatch.upsert({
      where: {
        movieId_source: {
          movieId,
          source
        }
      },
      create: {
        movieId,
        source,
        externalId,
        url: this.getSourceUrl(source, externalId),
        title: detailedData.data.title,
        originalTitle: detailedData.data.originalTitle,
        year: detailedData.data.year,
        runtime: detailedData.data.runtime,
        plot: detailedData.data.plot,
        tagline: detailedData.data.tagline,
        language: detailedData.data.language,
        country: detailedData.data.country,
        posterUrl: detailedData.data.posterUrl,
        backdropUrl: detailedData.data.backdropUrl,
        rating: detailedData.data.rating,
        voteCount: detailedData.data.voteCount,
        releaseDate: detailedData.data.releaseDate ? new Date(detailedData.data.releaseDate) : null,
        cachedData: detailedData.data.rawData
      },
      update: {
        externalId,
        url: this.getSourceUrl(source, externalId),
        title: detailedData.data.title,
        originalTitle: detailedData.data.originalTitle,
        year: detailedData.data.year,
        runtime: detailedData.data.runtime,
        plot: detailedData.data.plot,
        tagline: detailedData.data.tagline,
        language: detailedData.data.language,
        country: detailedData.data.country,
        posterUrl: detailedData.data.posterUrl,
        backdropUrl: detailedData.data.backdropUrl,
        rating: detailedData.data.rating,
        voteCount: detailedData.data.voteCount,
        releaseDate: detailedData.data.releaseDate ? new Date(detailedData.data.releaseDate) : null,
        cachedData: detailedData.data.rawData
      }
    });

    // Save alternative titles if available
    if (detailedData.data.alternativeTitles) {
      for (const altTitle of detailedData.data.alternativeTitles) {
        await prisma.alternativeTitle.upsert({
          where: {
            id: `${movieId}-${source}-${altTitle.title}`
          },
          create: {
            movieId,
            title: altTitle.title,
            region: altTitle.country,
            source
          },
          update: {
            title: altTitle.title,
            region: altTitle.country
          }
        });
      }
    }

    return externalMatch;
  }

  /**
   * Get all saved matches for a movie
   */
  async getMovieMatches(movieId: string): Promise<any[]> {
    return prisma.externalMatch.findMany({
      where: { movieId },
      orderBy: { source: 'asc' }
    });
  }

  /**
   * Remove a match
   */
  async removeMatch(movieId: string, source: ExternalSource): Promise<void> {
    await prisma.externalMatch.delete({
      where: {
        movieId_source: {
          movieId,
          source
        }
      }
    });
  }

  private async getTMDBDetails(tmdbId: number): Promise<DetailedSourceData> {
    const data = await tmdbService.getMovieDetails(tmdbId);

    return {
      source: 'TMDB' as ExternalSource,
      externalId: tmdbId.toString(),
      data: {
        title: data.title,
        originalTitle: data.original_title,
        year: data.release_date ? parseInt(data.release_date.split('-')[0]) : undefined,
        runtime: data.runtime,
        plot: data.overview,
        tagline: data.tagline,
        language: data.original_language,
        posterUrl: tmdbService.getPosterUrl(data.poster_path) || undefined,
        backdropUrl: tmdbService.getBackdropUrl(data.backdrop_path) || undefined,
        rating: data.vote_average,
        voteCount: data.vote_count,
        releaseDate: data.release_date,
        cast: data.credits?.cast?.map(c => ({
          name: c.name,
          character: c.character,
          order: c.order
        })),
        crew: data.credits?.crew?.map(c => ({
          name: c.name,
          job: c.job
        })),
        genres: data.genres,
        rawData: data
      }
    };
  }

  private async getOMDBDetails(imdbId: string): Promise<DetailedSourceData> {
    const data = await omdbService.getMovieByImdbId(imdbId);

    return {
      source: 'OMDB' as ExternalSource,
      externalId: imdbId,
      data: {
        title: data.Title,
        year: parseInt(data.Year),
        runtime: omdbService.parseRuntime(data.Runtime) || undefined,
        plot: data.Plot,
        language: data.Language,
        country: data.Country,
        posterUrl: data.Poster !== 'N/A' ? data.Poster : undefined,
        rating: parseFloat(data.imdbRating) || undefined,
        voteCount: parseInt(data.imdbVotes.replace(/,/g, '')) || undefined,
        releaseDate: data.Released,
        director: data.Director,
        cast: data.Actors.split(', ').map(name => ({ name })),
        crew: [
          ...data.Director.split(', ').map(name => ({ name, job: 'Director' })),
          ...data.Writer.split(', ').map(name => ({ name, job: 'Writer' }))
        ],
        genres: data.Genre.split(', ').map(name => ({ name })),
        rawData: data
      }
    };
  }

  private calculateConfidence(searchTitle: string, resultTitle: string,
                               searchYear?: number, resultYear?: number): number {
    let confidence = 0;

    // Title match (0-70 points)
    const titleSimilarity = this.stringSimilarity(
      searchTitle.toLowerCase(),
      resultTitle.toLowerCase()
    );
    confidence += titleSimilarity * 70;

    // Year match (0-30 points)
    if (searchYear && resultYear) {
      if (searchYear === resultYear) {
        confidence += 30;
      } else {
        const yearDiff = Math.abs(searchYear - resultYear);
        confidence += Math.max(0, 30 - yearDiff * 5);
      }
    }

    return Math.round(confidence);
  }

  private stringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  private getSourceUrl(source: ExternalSource, externalId: string): string {
    switch (source) {
      case 'TMDB':
        return `https://www.themoviedb.org/movie/${externalId}`;
      case 'OMDB':
      case 'IMDB':
        return `https://www.imdb.com/title/${externalId}/`;
      case 'AMAZON':
        return `https://www.amazon.com/dp/${externalId}`;
      default:
        return '';
    }
  }
}

export default new MatchingService();
