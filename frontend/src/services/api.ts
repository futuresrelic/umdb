import axios from 'axios';
import type { Movie, Person, Genre, MovieFormData, SearchResult } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Inject JWT token from localStorage on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('umdb_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Movies
export const movieApi = {
  getAll: async (params?: {
    search?: string;
    year?: number;
    sourceType?: string;
    limit?: number;
    offset?: number;
  }) => {
    const response = await api.get<{
      movies: Movie[];
      total: number;
      limit: number;
      offset: number;
    }>('/movies', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get<Movie>(`/movies/${id}`);
    return response.data;
  },

  create: async (data: MovieFormData) => {
    const response = await api.post<Movie>('/movies', data);
    return response.data;
  },

  update: async (id: string, data: Partial<MovieFormData>) => {
    const response = await api.put<Movie>(`/movies/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    await api.delete(`/movies/${id}`);
  },
};

// External APIs
export const externalApi = {
  search: async (query: string, year?: number, source?: string) => {
    const response = await api.get<SearchResult>('/external/search', {
      params: { query, year, source },
    });
    return response.data;
  },

  importFromTMDB: async (tmdbId: number) => {
    const response = await api.post<Movie>('/external/import/tmdb', { tmdbId });
    return response.data;
  },

  importFromIMDB: async (imdbId: string) => {
    const response = await api.post<Movie>('/external/import/imdb', { imdbId });
    return response.data;
  },
};

// People
export const peopleApi = {
  getAll: async (params?: { search?: string; limit?: number; offset?: number }) => {
    const response = await api.get<{
      people: Person[];
      total: number;
      limit: number;
      offset: number;
    }>('/people', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get<Person>(`/people/${id}`);
    return response.data;
  },

  create: async (data: Partial<Person>) => {
    const response = await api.post<Person>('/people', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Person>) => {
    const response = await api.put<Person>(`/people/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    await api.delete(`/people/${id}`);
  },
};

// Genres
export const genreApi = {
  getAll: async () => {
    const response = await api.get<Genre[]>('/genres');
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get<Genre>(`/genres/${id}`);
    return response.data;
  },

  create: async (data: { name: string; tmdbId?: number }) => {
    const response = await api.post<Genre>('/genres', data);
    return response.data;
  },

  update: async (id: string, data: { name?: string; tmdbId?: number }) => {
    const response = await api.put<Genre>(`/genres/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    await api.delete(`/genres/${id}`);
  },
};

// Auth
export const authApi = {
  getGoogleUrl: async (): Promise<string> => {
    const response = await api.get<{ url: string }>('/auth/google');
    return response.data.url;
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data.user;
  },
};

// Admin
export const adminApi = {
  getPending: async () => {
    const response = await api.get('/admin/pending');
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/admin/stats');
    return response.data;
  },

  verifyMovie: async (id: string) => {
    const response = await api.post(`/admin/movies/${id}/verify`);
    return response.data;
  },

  rejectMovie: async (id: string, reason?: string) => {
    const response = await api.post(`/admin/movies/${id}/reject`, { reason });
    return response.data;
  },

  mergeMovies: async (sourceId: string, targetId: string) => {
    const response = await api.post(`/admin/movies/${sourceId}/merge/${targetId}`);
    return response.data;
  },

  verifyPhysicalCopy: async (id: string) => {
    const response = await api.post(`/admin/physical-copies/${id}/verify`);
    return response.data;
  },

  rejectPhysicalCopy: async (id: string, reason?: string) => {
    const response = await api.post(`/admin/physical-copies/${id}/reject`, { reason });
    return response.data;
  },

  getUsers: async () => {
    const response = await api.get('/admin/users');
    return response.data;
  },

  // Box Set Admin APIs
  getBoxSets: async () => {
    const response = await api.get('/admin/box-sets');
    return response.data;
  },

  deleteBoxSet: async (id: string) => {
    const response = await api.delete(`/admin/box-sets/${id}`);
    return response.data;
  },

  backfillBoxSet: async (id: string) => {
    const response = await api.post(`/admin/box-sets/${id}/backfill`);
    return response.data;
  },

  backfillAllBoxSets: async () => {
    const response = await api.post('/admin/box-sets/backfill-all');
    return response.data;
  },

  deleteAllBoxSets: async () => {
    const response = await api.delete('/admin/box-sets');
    return response.data;
  },
};

// User submissions
export const userApi = {
  getMySubmissions: async () => {
    const response = await api.get('/users/me/submissions');
    return response.data;
  },
};

export default api;
