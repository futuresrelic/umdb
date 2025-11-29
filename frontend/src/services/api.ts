import axios from 'axios';
import type { Movie, Person, Genre, MovieFormData, SearchResult } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
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

export default api;
