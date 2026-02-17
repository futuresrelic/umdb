import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { movieApi, adminApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { Movie } from '../types';
import SourceMatchingModal from '../components/SourceMatchingModal';
import PhysicalCopyManager from '../components/PhysicalCopyManager';
import SourceDataTabs from '../components/SourceDataTabs';
import CoverCapture from '../components/CoverCapture';

function MovieDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [showMatchingModal, setShowMatchingModal] = useState(false);
  const [showAllCast, setShowAllCast] = useState(false);
  const [showAllCrew, setShowAllCrew] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [showPhotos, setShowPhotos] = useState(false);

  useEffect(() => {
    if (id) loadMovie(id);
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

  const handleVerify = async () => {
    if (!id) return;
    setVerifying(true);
    try {
      await adminApi.verifyMovie(id);
      await loadMovie(id);
    } finally {
      setVerifying(false);
    }
  };

  const handleReject = async () => {
    if (!id) return;
    const reason = prompt('Rejection reason (optional):');
    if (reason === null) return; // cancelled
    setVerifying(true);
    try {
      await adminApi.rejectMovie(id, reason);
      await loadMovie(id);
    } finally {
      setVerifying(false);
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

  const status = (movie as any).status as string | undefined;
  const canEdit = user && (isAdmin || (movie as any).submittedById === user.id);

  const directors = movie.moviePeople?.filter((mp) => mp.role === 'DIRECTOR') || [];
  const actors = movie.moviePeople?.filter((mp) => mp.role === 'ACTOR') || [];
  const writers = movie.moviePeople?.filter((mp) => mp.role === 'WRITER') || [];
  const producers = movie.moviePeople?.filter((mp) => mp.role === 'PRODUCER') || [];
  const crew = movie.moviePeople?.filter((mp) =>
    !['DIRECTOR', 'ACTOR', 'WRITER', 'PRODUCER'].includes(mp.role)
  ) || [];

  const displayedActors = showAllCast ? actors : actors.slice(0, 10);
  const displayedCrew = showAllCrew ? [...writers, ...producers, ...crew] : [...writers, ...producers, ...crew].slice(0, 5);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to="/browse" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
        ← Back to Browse
      </Link>

      {/* Status banner */}
      {status === 'PENDING' && (
        <div className="mb-4 bg-yellow-50 border border-yellow-300 rounded-lg px-4 py-3 flex items-center justify-between">
          <div>
            <span className="font-semibold text-yellow-800">Pending Verification</span>
            <span className="text-yellow-700 text-sm ml-2">— only visible to you until an admin approves it.</span>
          </div>
          {isAdmin && (
            <div className="flex gap-2">
              <button
                onClick={handleVerify}
                disabled={verifying}
                className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
              >
                Verify
              </button>
              <button
                onClick={handleReject}
                disabled={verifying}
                className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          )}
        </div>
      )}
      {status === 'REJECTED' && (
        <div className="mb-4 bg-red-50 border border-red-300 rounded-lg px-4 py-3">
          <span className="font-semibold text-red-800">Rejected</span>
          {(movie as any).rejectionReason && (
            <span className="text-red-700 text-sm ml-2">— {(movie as any).rejectionReason}</span>
          )}
        </div>
      )}
      {status === 'VERIFIED' && isAdmin && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg px-4 py-3 flex items-center justify-between">
          <span className="text-green-700 text-sm font-medium">Verified — publicly visible</span>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="md:flex">
          <div className="md:w-1/3">
            {movie.posterUrl ? (
              <img src={movie.posterUrl} alt={movie.title} className="w-full h-full object-cover" />
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
              <div className="flex gap-2 flex-wrap justify-end">
                {user && (
                  <button
                    onClick={() => setShowPhotos(!showPhotos)}
                    className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700 transition text-sm"
                  >
                    📷 Photos
                  </button>
                )}
                <button
                  onClick={() => setShowMatchingModal(true)}
                  className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition text-sm"
                >
                  🔗 Match Sources
                </button>
                {canEdit && (
                  <Link
                    to={`/edit/${movie.id}`}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition text-sm"
                  >
                    ✏️ Edit
                  </Link>
                )}
                {canEdit && (
                  <button
                    onClick={handleDelete}
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition text-sm"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-4 mb-6">
              {movie.year && <span className="bg-gray-100 px-3 py-1 rounded">{movie.year}</span>}
              {movie.runtime && <span className="bg-gray-100 px-3 py-1 rounded">{movie.runtime} min</span>}
              <span className={`px-3 py-1 rounded ${
                movie.sourceType === 'MANUAL' ? 'bg-blue-100 text-blue-800'
                : movie.sourceType === 'TMDB' ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800'
              }`}>
                {movie.sourceType}
              </span>
              {movie.rating && (
                <span className="bg-yellow-100 px-3 py-1 rounded">⭐ {movie.rating.toFixed(1)}</span>
              )}
            </div>

            {movie.tagline && <p className="text-xl text-gray-600 italic mb-4">{movie.tagline}</p>}

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
                    <span key={mg.id} className="bg-purple-100 text-purple-800 px-3 py-1 rounded">
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
                    <div key={mp.id}>
                      <Link to={`/person/${mp.person.id}`} className="text-blue-600 hover:text-blue-800 font-medium">
                        {mp.person.name}
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {actors.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-bold">Cast</h2>
                  {actors.length > 10 && (
                    <button onClick={() => setShowAllCast(!showAllCast)} className="text-sm text-blue-600 hover:text-blue-800">
                      {showAllCast ? 'Show Less' : `Show All (${actors.length})`}
                    </button>
                  )}
                </div>
                <div className="space-y-1">
                  {displayedActors.map((mp) => (
                    <div key={mp.id} className="text-gray-700">
                      <Link to={`/person/${mp.person.id}`} className="text-blue-600 hover:text-blue-800">
                        {mp.person.name}
                      </Link>
                      {mp.character && <span className="text-gray-500"> as {mp.character}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(writers.length > 0 || producers.length > 0 || crew.length > 0) && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-bold">Crew</h2>
                  {(writers.length + producers.length + crew.length) > 5 && (
                    <button onClick={() => setShowAllCrew(!showAllCrew)} className="text-sm text-blue-600 hover:text-blue-800">
                      {showAllCrew ? 'Show Less' : `Show All (${writers.length + producers.length + crew.length})`}
                    </button>
                  )}
                </div>
                <div className="space-y-1">
                  {displayedCrew.map((mp) => (
                    <div key={mp.id} className="text-gray-700">
                      <Link to={`/person/${mp.person.id}`} className="text-blue-600 hover:text-blue-800">
                        {mp.person.name}
                      </Link>
                      <span className="text-gray-500"> - {mp.role}</span>
                    </div>
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

            <SourceDataTabs
              matches={movie.externalMatches || []}
              umdbData={{
                title: movie.title,
                originalTitle: movie.originalTitle,
                year: movie.year,
                runtime: movie.runtime,
                plot: movie.plot,
                tagline: movie.tagline,
                language: movie.language,
                country: movie.country,
                rating: movie.rating,
                posterUrl: movie.posterUrl,
                backdropUrl: movie.backdropUrl,
              }}
            />

            <PhysicalCopyManager movieId={movie.id} canEdit={!!canEdit} />
          </div>
        </div>
      </div>

      {/* Cover photos panel */}
      {showPhotos && user && (
        <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">Cover Photos</h2>
          <CoverCapture
            movieId={movie.id}
            currentUserId={user.id}
            isAdmin={!!isAdmin}
            onPrimaryChange={(url) => setMovie((m) => m ? { ...m, posterUrl: url } : m)}
          />
        </div>
      )}

      {id && (
        <SourceMatchingModal
          movieId={id}
          movieTitle={movie.title}
          movieYear={movie.year || undefined}
          isOpen={showMatchingModal}
          onClose={() => setShowMatchingModal(false)}
          onMatchSaved={() => { setShowMatchingModal(false); loadMovie(id); }}
        />
      )}
    </div>
  );
}

export default MovieDetailsPage;
