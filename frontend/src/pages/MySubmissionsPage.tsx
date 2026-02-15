import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userApi } from '../services/api';

interface SubmittedMovie {
  id: string;
  title: string;
  year: number | null;
  posterUrl: string | null;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  rejectionReason: string | null;
  createdAt: string;
  movieGenres: { genre: { name: string } }[];
  physicalCopies: { id: string; format: string; status: string }[];
}

interface SubmittedCopy {
  id: string;
  format: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  rejectionReason: string | null;
  createdAt: string;
  upc: string | null;
  edition: string | null;
  movie: { id: string; title: string; year: number | null; posterUrl: string | null; status: string };
}

const statusBadge = (status: string) => {
  if (status === 'VERIFIED') return <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-800 font-medium">Verified</span>;
  if (status === 'REJECTED') return <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-800 font-medium">Rejected</span>;
  return <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-800 font-medium">Pending Review</span>;
};

export default function MySubmissionsPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [movies, setMovies] = useState<SubmittedMovie[]>([]);
  const [copies, setCopies] = useState<SubmittedCopy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    userApi.getMySubmissions()
      .then(data => {
        setMovies(data.movies);
        setCopies(data.physicalCopies);
      })
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="text-5xl mb-4">🔐</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Sign in to view your submissions</h1>
        <p className="text-gray-600 mb-6">Track the status of movies and physical copies you've submitted.</p>
        <button onClick={login} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
          Sign in with Google
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 text-center">
        <p className="text-gray-500">Loading your submissions...</p>
      </div>
    );
  }

  const pendingMovies = movies.filter(m => m.status === 'PENDING');
  const verifiedMovies = movies.filter(m => m.status === 'VERIFIED');
  const rejectedMovies = movies.filter(m => m.status === 'REJECTED');

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Submissions</h1>
        <p className="text-gray-600 mt-1">Track the verification status of your entries.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-yellow-700">{pendingMovies.length}</div>
          <div className="text-sm text-yellow-600">Pending Review</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-700">{verifiedMovies.length}</div>
          <div className="text-sm text-green-600">Verified</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-red-700">{rejectedMovies.length}</div>
          <div className="text-sm text-red-600">Rejected</div>
        </div>
      </div>

      {/* Movies */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Movies ({movies.length})</h2>
        {movies.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-500">
            <p>No movies submitted yet.</p>
            <button onClick={() => navigate('/add')} className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
              Add a Movie
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {movies.map(movie => (
              <div key={movie.id} className="bg-white border border-gray-200 rounded-lg p-4 flex items-start gap-4">
                {movie.posterUrl ? (
                  <img src={movie.posterUrl} alt={movie.title} className="w-12 h-16 object-cover rounded flex-shrink-0" />
                ) : (
                  <div className="w-12 h-16 bg-gray-200 rounded flex-shrink-0 flex items-center justify-center text-gray-400 text-xs">?</div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link to={`/movie/${movie.id}`} className="font-semibold text-gray-900 hover:text-blue-600">
                      {movie.title}
                    </Link>
                    {movie.year && <span className="text-gray-500 text-sm">({movie.year})</span>}
                    {statusBadge(movie.status)}
                  </div>
                  {movie.movieGenres.length > 0 && (
                    <p className="text-sm text-gray-500 mt-1">{movie.movieGenres.map(g => g.genre.name).join(', ')}</p>
                  )}
                  {movie.status === 'REJECTED' && movie.rejectionReason && (
                    <p className="text-sm text-red-600 mt-1">Reason: {movie.rejectionReason}</p>
                  )}
                  {movie.status === 'PENDING' && (
                    <p className="text-xs text-yellow-600 mt-1">Visible only to you until verified by an admin.</p>
                  )}
                </div>
                <div className="text-xs text-gray-400 flex-shrink-0">
                  {new Date(movie.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Physical Copies */}
      {copies.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Physical Copies ({copies.length})</h2>
          <div className="space-y-3">
            {copies.map(copy => (
              <div key={copy.id} className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-900">{copy.format.replace('_', ' ')}</span>
                    {copy.edition && <span className="text-gray-500 text-sm">— {copy.edition}</span>}
                    {statusBadge(copy.status)}
                  </div>
                  <Link to={`/movie/${copy.movie.id}`} className="text-sm text-blue-600 hover:underline">
                    {copy.movie.title} {copy.movie.year ? `(${copy.movie.year})` : ''}
                  </Link>
                  {copy.upc && <p className="text-xs text-gray-400 mt-0.5">UPC: {copy.upc}</p>}
                  {copy.status === 'REJECTED' && copy.rejectionReason && (
                    <p className="text-sm text-red-600 mt-1">Reason: {copy.rejectionReason}</p>
                  )}
                </div>
                <div className="text-xs text-gray-400 flex-shrink-0">
                  {new Date(copy.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
