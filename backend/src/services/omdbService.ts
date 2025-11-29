import axios from 'axios';
import { AppError } from '../middleware/errorHandler';

const OMDB_BASE_URL = 'http://www.omdbapi.com/';

export interface OMDBMovie {
  Title: string;
  Year: string;
  Rated: string;
  Released: string;
  Runtime: string;
  Genre: string;
  Director: string;
  Writer: string;
  Actors: string;
  Plot: string;
  Language: string;
  Country: string;
  Awards: string;
  Poster: string;
  Ratings: Array<{ Source: string; Value: string }>;
  Metascore: string;
  imdbRating: string;
  imdbVotes: string;
  imdbID: string;
  Type: string;
  DVD: string;
  BoxOffice: string;
  Production: string;
  Website: string;
  Response: string;
}

class OMDBService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.OMDB_API_KEY || '';
    if (!this.apiKey) {
      console.warn('OMDB_API_KEY not set in environment variables');
    }
  }

  private checkApiKey() {
    if (!this.apiKey) {
      throw new AppError('OMDB API key not configured', 500);
    }
  }

  async searchMovies(query: string, year?: number): Promise<any[]> {
    this.checkApiKey();

    try {
      const params: any = {
        apikey: this.apiKey,
        s: query,
        type: 'movie'
      };

      if (year) {
        params.y = year;
      }

      const response = await axios.get(OMDB_BASE_URL, { params });

      if (response.data.Response === 'True') {
        return response.data.Search || [];
      }

      return [];
    } catch (error) {
      console.error('OMDB search error:', error);
      throw new AppError('Failed to search OMDB', 500);
    }
  }

  async getMovieByImdbId(imdbId: string): Promise<OMDBMovie> {
    this.checkApiKey();

    try {
      const response = await axios.get(OMDB_BASE_URL, {
        params: {
          apikey: this.apiKey,
          i: imdbId,
          plot: 'full'
        }
      });

      if (response.data.Response === 'False') {
        throw new AppError('Movie not found on OMDB', 404);
      }

      return response.data;
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      console.error('OMDB details error:', error);
      throw new AppError('Failed to get movie details from OMDB', 500);
    }
  }

  async getMovieByTitle(title: string, year?: number): Promise<OMDBMovie> {
    this.checkApiKey();

    try {
      const params: any = {
        apikey: this.apiKey,
        t: title,
        plot: 'full',
        type: 'movie'
      };

      if (year) {
        params.y = year;
      }

      const response = await axios.get(OMDB_BASE_URL, { params });

      if (response.data.Response === 'False') {
        throw new AppError('Movie not found on OMDB', 404);
      }

      return response.data;
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      console.error('OMDB details error:', error);
      throw new AppError('Failed to get movie details from OMDB', 500);
    }
  }

  parseRuntime(runtime: string): number | null {
    const match = runtime.match(/(\d+)/);
    return match ? parseInt(match[1]) : null;
  }
}

export default new OMDBService();
