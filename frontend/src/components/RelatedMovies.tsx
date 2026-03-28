import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import LoadingSpinner from './LoadingSpinner';

interface Movie {
  id: string;
  title: string;
  year?: number;
  posterUrl?: string;
}

interface RelatedMoviesProps {
  movieId: string;
  movieTitle: string;
  movieYear?: number;
  genres?: string[];
}

export default function RelatedMovies({ movieId, movieTitle, movieYear, genres }: RelatedMoviesProps) {
  const [relatedMovies, setRelatedMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchRelated() {
      setIsLoading(true);
      try {
        // Try to find similar movies by title first
        const similarResponse = await api.get('/search/similar', {
          params: { title: movieTitle, year: movieYear, limit: 6 }
        });

        let movies = similarResponse.data.similar
          .filter((m: any) => m.id !== movieId)
          .slice(0, 6);

        // If we don't have enough similar movies and we have genres, search by genre
        if (movies.length < 4 && genres && genres.length > 0) {
          try {
            const genreResponse = await api.get('/movies', {
              params: {
                limit: 10,
                sortBy: 'year',
                sortOrder: 'desc'
              }
            });

            const genreMovies = genreResponse.data.movies
              .filter((m: any) => m.id !== movieId && !movies.find((rm: any) => rm.id === m.id))
              .slice(0, 6 - movies.length);

            movies = [...movies, ...genreMovies];
          } catch (error) {
            console.error('Error fetching by genre:', error);
          }
        }

        setRelatedMovies(movies);
      } catch (error) {
        console.error('Error fetching related movies:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchRelated();
  }, [movieId, movieTitle, movieYear, genres]);

  if (isLoading) {
    return <LoadingSpinner size="sm" message="Finding related movies..." />;
  }

  if (relatedMovies.length === 0) {
    return null;
  }

  return (
    <div className="bg-gray-800 dark:bg-gray-900 rounded-lg p-6 border border-gray-700 dark:border-gray-600">
      <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
        </svg>
        You Might Also Like
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {relatedMovies.map((movie) => (
          <Link
            key={movie.id}
            to={`/movie/${movie.id}`}
            className="group"
          >
            {movie.posterUrl ? (
              <img
                src={movie.posterUrl}
                alt={movie.title}
                className="w-full h-48 object-cover rounded shadow-lg group-hover:opacity-80 transition"
              />
            ) : (
              <div className="w-full h-48 bg-gray-700 dark:bg-gray-800 rounded flex items-center justify-center text-4xl group-hover:opacity-80 transition">
                🎬
              </div>
            )}
            <div className="mt-2">
              <h4 className="text-sm font-medium text-white group-hover:text-blue-400 transition line-clamp-2">
                {movie.title}
              </h4>
              {movie.year && (
                <p className="text-xs text-gray-400 mt-1">{movie.year}</p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
