import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { movieApi } from '../services/api';
import api from '../services/api';
import type { Movie } from '../types';

interface Genre {
  id: string;
  name: string;
  _count?: { movieGenres: number };
}

function BrowseMoviesPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 24;

  // Filter states
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [genreFilter, setGenreFilter] = useState('');
  const [directorFilter, setDirectorFilter] = useState('');
  const [actorFilter, setActorFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [minRating, setMinRating] = useState('');
  const [maxRating, setMaxRating] = useState('');

  // Sort states
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Show/hide filter panel
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadGenres();
  }, []);

  useEffect(() => {
    loadMovies();
  }, [page, search, sourceFilter, genreFilter, directorFilter, actorFilter, yearFilter, minRating, maxRating, sortBy, sortOrder]);

  const loadGenres = async () => {
    try {
      const data = await api.get('/genres');
      setGenres(data.data || []);
    } catch (error) {
      console.error('Failed to load genres:', error);
    }
  };

  const loadMovies = async () => {
    try {
      setLoading(true);
      const params: any = {
        limit,
        offset: (page - 1) * limit,
        sortBy,
        sortOrder
      };

      if (search) params.search = search;
      if (sourceFilter) params.sourceType = sourceFilter;
      if (genreFilter) params.genre = genreFilter;
      if (directorFilter) params.director = directorFilter;
      if (actorFilter) params.actor = actorFilter;
      if (yearFilter) params.year = yearFilter;
      if (minRating) params.minRating = minRating;
      if (maxRating) params.maxRating = maxRating;

      const data = await movieApi.getAll(params);
      setMovies(data?.movies || []);
      setTotal(data?.total || 0);
    } catch (error) {
      console.error('Failed to load movies:', error);
      setMovies([]);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setSourceFilter('');
    setGenreFilter('');
    setDirectorFilter('');
    setActorFilter('');
    setYearFilter('');
    setMinRating('');
    setMaxRating('');
    setPage(1);
  };

  const totalPages = Math.ceil(total / limit);
  const activeFiltersCount = [search, sourceFilter, genreFilter, directorFilter, actorFilter, yearFilter, minRating, maxRating].filter(Boolean).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold text-gray-900">Browse Movies</h1>
        <div className="text-sm text-gray-600">
          {total} movie{total !== 1 ? 's' : ''} found
        </div>
      </div>

      {/* Search and Sort Bar */}
      <div className="mb-6 flex flex-wrap gap-4">
        <input
          type="text"
          placeholder="Search movies..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="flex-1 min-w-[200px] px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="createdAt">Recently Added</option>
          <option value="title">Title (A-Z)</option>
          <option value="year">Year</option>
          <option value="rating">Rating</option>
          <option value="runtime">Runtime</option>
        </select>

        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="desc">Descending</option>
          <option value="asc">Ascending</option>
        </select>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-4 py-2 rounded-lg transition ${
            showFilters || activeFiltersCount > 0
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
        </button>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="mb-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Genre
              </label>
              <select
                value={genreFilter}
                onChange={(e) => {
                  setGenreFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Genres</option>
                {genres.map((genre) => (
                  <option key={genre.id} value={genre.name}>
                    {genre.name} {genre._count && `(${genre._count.movieGenres})`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Source
              </label>
              <select
                value={sourceFilter}
                onChange={(e) => {
                  setSourceFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Sources</option>
                <option value="MANUAL">Manual</option>
                <option value="TMDB">TMDB</option>
                <option value="IMDB">IMDB</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Year
              </label>
              <input
                type="number"
                placeholder="e.g. 2009"
                value={yearFilter}
                onChange={(e) => {
                  setYearFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Director
              </label>
              <input
                type="text"
                placeholder="Search by director..."
                value={directorFilter}
                onChange={(e) => {
                  setDirectorFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Actor
              </label>
              <input
                type="text"
                placeholder="Search by actor..."
                value={actorFilter}
                onChange={(e) => {
                  setActorFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rating Range
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  min="0"
                  max="10"
                  step="0.1"
                  value={minRating}
                  onChange={(e) => {
                    setMinRating(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-gray-500 self-center">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  min="0"
                  max="10"
                  step="0.1"
                  value={maxRating}
                  onChange={(e) => {
                    setMaxRating(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition"
            >
              Clear All Filters
            </button>
          </div>
        </div>
      )}

      {/* Movie Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="text-gray-600">Loading movies...</div>
        </div>
      ) : movies.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-600 mb-4">No movies found</p>
          <Link
            to="/add"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Add Your First Movie
          </Link>
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            {movies.map((movie) => (
              <Link
                key={movie.id}
                to={`/movie/${movie.id}`}
                className="bg-white rounded-lg shadow hover:shadow-xl transition overflow-hidden"
              >
                {movie.posterUrl ? (
                  <img
                    src={movie.posterUrl}
                    alt={movie.title}
                    className="w-full h-80 object-cover"
                  />
                ) : (
                  <div className="w-full h-80 bg-gray-200 flex items-center justify-center">
                    <span className="text-6xl">🎬</span>
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-1 truncate">{movie.title}</h3>
                  {movie.year && (
                    <p className="text-gray-600 text-sm mb-2">{movie.year}</p>
                  )}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        movie.sourceType === 'MANUAL'
                          ? 'bg-blue-100 text-blue-800'
                          : movie.sourceType === 'TMDB'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {movie.sourceType}
                    </span>
                    {movie.rating && (
                      <span className="text-xs text-gray-600">
                        ⭐ {movie.rating.toFixed(1)}
                      </span>
                    )}
                    {movie.runtime && (
                      <span className="text-xs text-gray-600">
                        {movie.runtime} min
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
              >
                Previous
              </button>

              <div className="flex gap-2">
                {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 7) {
                    pageNum = i + 1;
                  } else if (page <= 4) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 3) {
                    pageNum = totalPages - 6 + i;
                  } else {
                    pageNum = page - 3 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-10 h-10 rounded-lg transition ${
                        page === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default BrowseMoviesPage;
