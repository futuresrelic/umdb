import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { externalApi } from '../services/api';
import type { SearchResult, TMDBSearchResult, OMDBSearchResult } from '../types';

function SearchExternalPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [year, setYear] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult | null>(null);
  const [importing, setImporting] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!query.trim()) {
      alert('Please enter a search query');
      return;
    }

    try {
      setLoading(true);
      const data = await externalApi.search(
        query,
        year ? parseInt(year) : undefined
      );
      setResults(data);
    } catch (error) {
      console.error('Search failed:', error);
      alert('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleImportTMDB = async (tmdbId: number) => {
    try {
      setImporting(`tmdb-${tmdbId}`);
      const movie = await externalApi.importFromTMDB(tmdbId);
      navigate(`/movie/${movie.id}`);
    } catch (error: any) {
      console.error('Import failed:', error);
      if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert('Import failed');
      }
    } finally {
      setImporting(null);
    }
  };

  const handleImportIMDB = async (imdbId: string) => {
    try {
      setImporting(`imdb-${imdbId}`);
      const movie = await externalApi.importFromIMDB(imdbId);
      navigate(`/movie/${movie.id}`);
    } catch (error: any) {
      console.error('Import failed:', error);
      if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert('Import failed');
      }
    } finally {
      setImporting(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Search External Sources</h1>

      <form onSubmit={handleSearch} className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Movie Title
            </label>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter movie title..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Year (optional)
            </label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="2024"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="mt-4 w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {results && (
        <div className="space-y-8">
          {/* TMDB Results */}
          {results.tmdb && !('error' in results.tmdb) && results.tmdb.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                TMDB Results ({results.tmdb.length})
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {results.tmdb.map((movie: TMDBSearchResult) => (
                  <div
                    key={movie.id}
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
                      <h3 className="font-bold text-lg mb-1">{movie.title}</h3>
                      {movie.year && (
                        <p className="text-gray-600 text-sm mb-2">{movie.year}</p>
                      )}
                      {movie.overview && (
                        <p className="text-gray-700 text-sm mb-3 line-clamp-3">
                          {movie.overview}
                        </p>
                      )}
                      {movie.rating && (
                        <p className="text-sm text-gray-600 mb-3">
                          ⭐ {movie.rating.toFixed(1)}
                        </p>
                      )}
                      <button
                        onClick={() => handleImportTMDB(movie.id)}
                        disabled={importing === `tmdb-${movie.id}`}
                        className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition disabled:bg-gray-400"
                      >
                        {importing === `tmdb-${movie.id}` ? 'Importing...' : 'Import'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* OMDB/IMDB Results */}
          {results.omdb && !('error' in results.omdb) && results.omdb.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                IMDB Results ({results.omdb.length})
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {results.omdb.map((movie: OMDBSearchResult) => (
                  <div
                    key={movie.imdbId}
                    className="bg-white rounded-lg shadow hover:shadow-xl transition overflow-hidden"
                  >
                    {movie.posterUrl && movie.posterUrl !== 'N/A' ? (
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
                      <h3 className="font-bold text-lg mb-1">{movie.title}</h3>
                      {movie.year && (
                        <p className="text-gray-600 text-sm mb-2">{movie.year}</p>
                      )}
                      <p className="text-gray-600 text-sm mb-3">IMDB ID: {movie.imdbId}</p>
                      <button
                        onClick={() => handleImportIMDB(movie.imdbId)}
                        disabled={importing === `imdb-${movie.imdbId}`}
                        className="w-full bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 transition disabled:bg-gray-400"
                      >
                        {importing === `imdb-${movie.imdbId}` ? 'Importing...' : 'Import'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No results */}
          {results.tmdb &&
            !('error' in results.tmdb) &&
            results.tmdb.length === 0 &&
            results.omdb &&
            !('error' in results.omdb) &&
            results.omdb.length === 0 && (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <p className="text-gray-600 text-lg">No results found</p>
                <p className="text-gray-500 mt-2">
                  Try adjusting your search or add the movie manually
                </p>
              </div>
            )}
        </div>
      )}
    </div>
  );
}

export default SearchExternalPage;
