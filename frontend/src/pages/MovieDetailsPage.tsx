import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { movieApi } from '../services/api';
import type { Movie } from '../types';

function MovieDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadMovie(id);
    }
  }, [id]);

  const loadMovie = async (movieId: string) => {
    try {
      setLoading(true);
      const data = await movieApi.getById(movieId);
      setMovie(data);
    } catch (error) {
      console.error('Failed to load movie:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !confirm('Are you sure you want to delete this movie?')) return;

    try {
      await movieApi.delete(id);
      navigate('/browse');
    } catch (error) {
      console.error('Failed to delete movie:', error);
      alert('Failed to delete movie');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">Loading...</div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">Movie not found</div>
      </div>
    );
  }

  const directors = movie.moviePeople?.filter((mp) => mp.role === 'DIRECTOR') || [];
  const actors = movie.moviePeople?.filter((mp) => mp.role === 'ACTOR') || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to="/browse" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
        ← Back to Browse
      </Link>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="md:flex">
          <div className="md:w-1/3">
            {movie.posterUrl ? (
              <img
                src={movie.posterUrl}
                alt={movie.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-96 bg-gray-200 flex items-center justify-center">
                <span className="text-8xl">🎬</span>
              </div>
            )}
          </div>

          <div className="md:w-2/3 p-8">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">{movie.title}</h1>
                {movie.originalTitle && movie.originalTitle !== movie.title && (
                  <p className="text-gray-600 italic mb-2">{movie.originalTitle}</p>
                )}
              </div>
              <button
                onClick={handleDelete}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
              >
                Delete
              </button>
            </div>

            <div className="flex flex-wrap gap-4 mb-6">
              {movie.year && (
                <span className="bg-gray-100 px-3 py-1 rounded">{movie.year}</span>
              )}
              {movie.runtime && (
                <span className="bg-gray-100 px-3 py-1 rounded">{movie.runtime} min</span>
              )}
              <span
                className={`px-3 py-1 rounded ${
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
                <span className="bg-yellow-100 px-3 py-1 rounded">
                  ⭐ {movie.rating.toFixed(1)}
                </span>
              )}
            </div>

            {movie.tagline && (
              <p className="text-xl text-gray-600 italic mb-4">{movie.tagline}</p>
            )}

            {movie.plot && (
              <div className="mb-6">
                <h2 className="text-xl font-bold mb-2">Plot</h2>
                <p className="text-gray-700">{movie.plot}</p>
              </div>
            )}

            {movie.movieGenres && movie.movieGenres.length > 0 && (
              <div className="mb-6">
                <h2 className="text-xl font-bold mb-2">Genres</h2>
                <div className="flex flex-wrap gap-2">
                  {movie.movieGenres.map((mg) => (
                    <span
                      key={mg.id}
                      className="bg-purple-100 text-purple-800 px-3 py-1 rounded"
                    >
                      {mg.genre.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {directors.length > 0 && (
              <div className="mb-6">
                <h2 className="text-xl font-bold mb-2">Director(s)</h2>
                <div className="space-y-1">
                  {directors.map((mp) => (
                    <p key={mp.id} className="text-gray-700">
                      {mp.person.name}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {actors.length > 0 && (
              <div className="mb-6">
                <h2 className="text-xl font-bold mb-2">Cast</h2>
                <div className="space-y-1">
                  {actors.slice(0, 10).map((mp) => (
                    <p key={mp.id} className="text-gray-700">
                      {mp.person.name}
                      {mp.character && <span className="text-gray-500"> as {mp.character}</span>}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {movie.language && (
              <div className="mb-6">
                <h2 className="text-xl font-bold mb-2">Language</h2>
                <p className="text-gray-700">{movie.language}</p>
              </div>
            )}

            {movie.country && (
              <div className="mb-6">
                <h2 className="text-xl font-bold mb-2">Country</h2>
                <p className="text-gray-700">{movie.country}</p>
              </div>
            )}

            {movie.physicalFormat && (
              <div className="mb-6">
                <h2 className="text-xl font-bold mb-2">Physical Format</h2>
                <p className="text-gray-700">{movie.physicalFormat}</p>
              </div>
            )}

            {movie.distributor && (
              <div className="mb-6">
                <h2 className="text-xl font-bold mb-2">Distributor</h2>
                <p className="text-gray-700">{movie.distributor}</p>
              </div>
            )}

            {movie.upc && (
              <div className="mb-6">
                <h2 className="text-xl font-bold mb-2">UPC</h2>
                <p className="text-gray-700">{movie.upc}</p>
              </div>
            )}

            {movie.notes && (
              <div className="mb-6">
                <h2 className="text-xl font-bold mb-2">Notes</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{movie.notes}</p>
              </div>
            )}

            {movie.externalMatches && movie.externalMatches.length > 0 && (
              <div className="mb-6">
                <h2 className="text-xl font-bold mb-2">External Links</h2>
                <div className="space-y-2">
                  {movie.externalMatches.map((match) => (
                    <div key={match.id}>
                      {match.url ? (
                        <a
                          href={match.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          {match.source}: {match.externalId}
                        </a>
                      ) : (
                        <span className="text-gray-700">
                          {match.source}: {match.externalId}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MovieDetailsPage;
