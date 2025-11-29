import axios from 'axios';
import { AppError } from '../middleware/errorHandler';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

export interface TMDBMovie {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  release_date: string;
  runtime?: number;
  tagline?: string;
  poster_path?: string;
  backdrop_path?: string;
  vote_average?: number;
  vote_count?: number;
  original_language?: string;
  genres?: Array<{ id: number; name: string }>;
  credits?: {
    cast?: Array<{
      id: number;
      name: string;
      character: string;
      order: number;
      profile_path?: string;
    }>;
    crew?: Array<{
      id: number;
      name: string;
      job: string;
      department: string;
      profile_path?: string;
    }>;
  };
}

class TMDBService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.TMDB_API_KEY || '';
    if (!this.apiKey) {
      console.warn('TMDB_API_KEY not set in environment variables');
    }
  }

  private checkApiKey() {
    if (!this.apiKey) {
      throw new AppError('TMDB API key not configured', 500);
    }
  }

  async searchMovies(query: string, year?: number): Promise<any[]> {
    this.checkApiKey();

    try {
      const params: any = {
        api_key: this.apiKey,
        query,
        include_adult: false
      };

      if (year) {
        params.year = year;
      }

      const response = await axios.get(`${TMDB_BASE_URL}/search/movie`, { params });
      return response.data.results || [];
    } catch (error) {
      console.error('TMDB search error:', error);
      throw new AppError('Failed to search TMDB', 500);
    }
  }

  async getMovieDetails(tmdbId: number): Promise<TMDBMovie> {
    this.checkApiKey();

    try {
      const response = await axios.get(
        `${TMDB_BASE_URL}/movie/${tmdbId}`,
        {
          params: {
            api_key: this.apiKey,
            append_to_response: 'credits'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('TMDB details error:', error);
      throw new AppError('Failed to get movie details from TMDB', 500);
    }
  }

  async getPerson(tmdbPersonId: number): Promise<any> {
    this.checkApiKey();

    try {
      const response = await axios.get(
        `${TMDB_BASE_URL}/person/${tmdbPersonId}`,
        {
          params: {
            api_key: this.apiKey
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('TMDB person error:', error);
      throw new AppError('Failed to get person details from TMDB', 500);
    }
  }

  getImageUrl(path: string | null | undefined, size: 'w500' | 'original' = 'w500'): string | null {
    if (!path) return null;
    return `${TMDB_IMAGE_BASE}/${size}${path}`;
  }

  getPosterUrl(path: string | null | undefined): string | null {
    return this.getImageUrl(path, 'w500');
  }

  getBackdropUrl(path: string | null | undefined): string | null {
    return this.getImageUrl(path, 'original');
  }
}

export default new TMDBService();
