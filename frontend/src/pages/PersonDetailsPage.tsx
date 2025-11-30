import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';

interface Person {
  id: string;
  name: string;
  birthDate?: string;
  deathDate?: string;
  biography?: string;
  photoUrl?: string;
  tmdbId?: number;
  imdbId?: string;
  moviePeople?: Array<{
    id: string;
    role: string;
    character?: string;
    movie: {
      id: string;
      title: string;
      year?: number;
      posterUrl?: string;
      rating?: number;
    };
  }>;
}

function PersonDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [person, setPerson] = useState<Person | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadPerson(id);
    }
  }, [id]);

  const loadPerson = async (personId: string) => {
    try {
      setLoading(true);
      const response = await api.get(`/people/${personId}`);
      setPerson(response.data);
    } catch (error) {
      console.error('Failed to load person:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">Loading...</div>
      </div>
    );
  }

  if (!person) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">Person not found</div>
      </div>
    );
  }

  // Group movies by role
  const moviesByRole = person.moviePeople?.reduce((acc, mp) => {
    if (!acc[mp.role]) acc[mp.role] = [];
    acc[mp.role].push(mp);
    return acc;
  }, {} as Record<string, typeof person.moviePeople>);

  // Sort movies by year (newest first)
  Object.values(moviesByRole || {}).forEach(movies => {
    movies.sort((a, b) => (b.movie.year || 0) - (a.movie.year || 0));
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to="/browse" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
        ← Back to Browse
      </Link>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="md:flex">
          {/* Photo */}
          {person.photoUrl && (
            <div className="md:w-1/3">
              <img
                src={person.photoUrl}
                alt={person.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Details */}
          <div className={person.photoUrl ? 'md:w-2/3 p-8' : 'w-full p-8'}>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{person.name}</h1>

            {(person.birthDate || person.deathDate) && (
              <div className="mb-4 text-gray-600">
                {person.birthDate && (
                  <p>Born: {new Date(person.birthDate).toLocaleDateString()}</p>
                )}
                {person.deathDate && (
                  <p>Died: {new Date(person.deathDate).toLocaleDateString()}</p>
                )}
              </div>
            )}

            {person.biography && (
              <div className="mb-6">
                <h2 className="text-xl font-bold mb-2">Biography</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{person.biography}</p>
              </div>
            )}

            {/* External Links */}
            <div className="mb-6 flex gap-4">
              {person.tmdbId && (
                <a
                  href={`https://www.themoviedb.org/person/${person.tmdbId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800"
                >
                  View on TMDB →
                </a>
              )}
              {person.imdbId && (
                <a
                  href={`https://www.imdb.com/name/${person.imdbId}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800"
                >
                  View on IMDB →
                </a>
              )}
            </div>

            {/* Filmography by Role */}
            {moviesByRole && Object.entries(moviesByRole).map(([role, movies]) => (
              <div key={role} className="mb-8">
                <h2 className="text-2xl font-bold mb-4">
                  {role === 'ACTOR' ? 'Acting' : role === 'DIRECTOR' ? 'Directing' : role}
                  <span className="text-gray-500 text-lg ml-2">({movies.length})</span>
                </h2>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {movies.map((mp) => (
                    <Link
                      key={mp.id}
                      to={`/movie/${mp.movie.id}`}
                      className="border rounded-lg p-3 hover:shadow-lg transition flex gap-3"
                    >
                      {mp.movie.posterUrl && (
                        <img
                          src={mp.movie.posterUrl}
                          alt={mp.movie.title}
                          className="w-16 h-24 object-cover rounded"
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 hover:text-blue-600">
                          {mp.movie.title}
                        </h3>
                        <div className="text-sm text-gray-600">
                          {mp.movie.year && <p>{mp.movie.year}</p>}
                          {mp.character && <p className="italic">as {mp.character}</p>}
                          {mp.movie.rating && (
                            <p>⭐ {mp.movie.rating.toFixed(1)}</p>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}

            {(!person.moviePeople || person.moviePeople.length === 0) && (
              <div className="text-center py-8 text-gray-500">
                No filmography available
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PersonDetailsPage;
