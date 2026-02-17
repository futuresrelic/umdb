import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { adminApi } from '../services/api';
import IconEditor from '../components/IconEditor';

type AdminTab = 'queue' | 'icons';

interface PendingMovie {
  id: string;
  title: string;
  year: number | null;
  posterUrl: string | null;
  status: string;
  createdAt: string;
  upc: string | null;
  physicalFormat: string | null;
  sourceType: string;
  submittedBy: { id: string; name: string; email: string; photo?: string } | null;
  movieGenres: { genre: { name: string } }[];
  physicalCopies: { id: string; format: string; upc: string | null; status: string }[];
}

interface PendingCopy {
  id: string;
  format: string;
  upc: string | null;
  ean: string | null;
  edition: string | null;
  region: string | null;
  distributor: string | null;
  status: string;
  createdAt: string;
  rejectionReason: string | null;
  submittedBy: { id: string; name: string; email: string } | null;
  movie: { id: string; title: string; year: number | null; status: string };
}

interface AdminStats {
  pendingMovies: number;
  verifiedMovies: number;
  rejectedMovies: number;
  pendingCopies: number;
  totalUsers: number;
}

export default function AdminPage() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [pendingMovies, setPendingMovies] = useState<PendingMovie[]>([]);
  const [pendingCopies, setPendingCopies] = useState<PendingCopy[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectModal, setRejectModal] = useState<{ type: 'movie' | 'copy'; id: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [mergeModal, setMergeModal] = useState<{ sourceId: string; sourceTitle: string } | null>(null);
  const [mergeTargetId, setMergeTargetId] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>('queue');

  const loadData = async () => {
    try {
      const [statsData, pendingData] = await Promise.all([
        adminApi.getStats(),
        adminApi.getPending(),
      ]);
      setStats(statsData);
      setPendingMovies(pendingData.movies);
      setPendingCopies(pendingData.physicalCopies);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || !isAdmin) return;
    loadData();
  }, [user, isAdmin]);

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-600">Please sign in to access the admin panel.</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="text-5xl mb-4">🚫</div>
        <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
        <p className="text-gray-600 mt-2">You need admin privileges to access this page.</p>
        <button onClick={() => navigate('/')} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Go Home
        </button>
      </div>
    );
  }

  const handleVerifyMovie = async (id: string) => {
    setActionLoading(id);
    await adminApi.verifyMovie(id);
    await loadData();
    setActionLoading(null);
  };

  const handleRejectConfirm = async () => {
    if (!rejectModal) return;
    setActionLoading(rejectModal.id);
    if (rejectModal.type === 'movie') {
      await adminApi.rejectMovie(rejectModal.id, rejectReason);
    } else {
      await adminApi.rejectPhysicalCopy(rejectModal.id, rejectReason);
    }
    setRejectModal(null);
    setRejectReason('');
    await loadData();
    setActionLoading(null);
  };

  const handleVerifyCopy = async (id: string) => {
    setActionLoading(id);
    await adminApi.verifyPhysicalCopy(id);
    await loadData();
    setActionLoading(null);
  };

  const handleMergeConfirm = async () => {
    if (!mergeModal || !mergeTargetId.trim()) return;
    setActionLoading(mergeModal.sourceId);
    await adminApi.mergeMovies(mergeModal.sourceId, mergeTargetId.trim());
    setMergeModal(null);
    setMergeTargetId('');
    await loadData();
    setActionLoading(null);
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 text-center">
        <p className="text-gray-500">Loading admin panel...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-gray-200 mb-8 gap-1">
        {([
          { id: 'queue' as AdminTab, label: '📋 Verification Queue' },
          { id: 'icons' as AdminTab, label: '🎨 App Icons' },
        ]).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2.5 text-sm font-medium rounded-t transition ${
              activeTab === tab.id
                ? 'bg-white border border-b-white border-gray-200 -mb-px text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >{tab.label}</button>
        ))}
      </div>

      {/* ── App Icons tab ── */}
      {activeTab === 'icons' && (
        <div className="bg-white rounded-xl shadow p-6">
          <IconEditor />
        </div>
      )}

      {activeTab === 'queue' && <>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-5 gap-4 mb-10">
          {[
            { label: 'Pending Movies', value: stats.pendingMovies, color: 'yellow' },
            { label: 'Verified Movies', value: stats.verifiedMovies, color: 'green' },
            { label: 'Rejected Movies', value: stats.rejectedMovies, color: 'red' },
            { label: 'Pending Copies', value: stats.pendingCopies, color: 'yellow' },
            { label: 'Total Users', value: stats.totalUsers, color: 'blue' },
          ].map(({ label, value, color }) => (
            <div key={label} className={`bg-${color}-50 border border-${color}-200 rounded-lg p-4 text-center`}>
              <div className={`text-2xl font-bold text-${color}-700`}>{value}</div>
              <div className={`text-xs text-${color}-600 mt-1`}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Pending Movies */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Pending Movies ({pendingMovies.length})
        </h2>
        {pendingMovies.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-6 text-center text-gray-500">
            No pending movies. All caught up!
          </div>
        ) : (
          <div className="space-y-4">
            {pendingMovies.map(movie => (
              <div key={movie.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-start gap-4">
                  {movie.posterUrl ? (
                    <img src={movie.posterUrl} alt={movie.title} className="w-14 h-20 object-cover rounded flex-shrink-0" />
                  ) : (
                    <div className="w-14 h-20 bg-gray-200 rounded flex-shrink-0 flex items-center justify-center text-gray-400 text-xs text-center">No poster</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Link to={`/movie/${movie.id}`} className="text-lg font-semibold text-gray-900 hover:text-blue-600">
                          {movie.title} {movie.year ? `(${movie.year})` : ''}
                        </Link>
                        {movie.movieGenres.length > 0 && (
                          <p className="text-sm text-gray-500">{movie.movieGenres.map(g => g.genre.name).join(', ')}</p>
                        )}
                        {movie.upc && <p className="text-xs text-gray-400">UPC: {movie.upc}</p>}
                        {movie.physicalFormat && <p className="text-xs text-gray-400">Format: {movie.physicalFormat}</p>}
                        <p className="text-xs text-gray-400">Source: {movie.sourceType}</p>
                        {movie.submittedBy && (
                          <p className="text-xs text-gray-500 mt-1">
                            Submitted by <span className="font-medium">{movie.submittedBy.name}</span> ({movie.submittedBy.email}) on {new Date(movie.createdAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleVerifyMovie(movie.id)}
                          disabled={actionLoading === movie.id}
                          className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
                        >
                          Verify
                        </button>
                        <button
                          onClick={() => setMergeModal({ sourceId: movie.id, sourceTitle: movie.title })}
                          className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                        >
                          Merge
                        </button>
                        <button
                          onClick={() => setRejectModal({ type: 'movie', id: movie.id })}
                          className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                        >
                          Reject
                        </button>
                      </div>
                    </div>

                    {/* Physical copies attached to this movie */}
                    {movie.physicalCopies.length > 0 && (
                      <div className="mt-2 flex gap-2 flex-wrap">
                        {movie.physicalCopies.map(c => (
                          <span key={c.id} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                            {c.format.replace('_', ' ')} {c.upc ? `• ${c.upc}` : ''}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Pending Physical Copies (standalone) */}
      {pendingCopies.filter(c => c.movie.status === 'VERIFIED').length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Pending Physical Copies — on Verified Movies ({pendingCopies.filter(c => c.movie.status === 'VERIFIED').length})
          </h2>
          <div className="space-y-3">
            {pendingCopies.filter(c => c.movie.status === 'VERIFIED').map(copy => (
              <div key={copy.id} className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{copy.format.replace('_', ' ')}</span>
                    {copy.edition && <span className="text-gray-500 text-sm">— {copy.edition}</span>}
                    {copy.region && <span className="text-xs text-gray-400">Region: {copy.region}</span>}
                  </div>
                  <Link to={`/movie/${copy.movie.id}`} className="text-sm text-blue-600 hover:underline">
                    {copy.movie.title} {copy.movie.year ? `(${copy.movie.year})` : ''}
                  </Link>
                  {copy.upc && <p className="text-xs text-gray-400">UPC: {copy.upc}</p>}
                  {copy.submittedBy && (
                    <p className="text-xs text-gray-500">By {copy.submittedBy.name} on {new Date(copy.createdAt).toLocaleDateString()}</p>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleVerifyCopy(copy.id)}
                    disabled={actionLoading === copy.id}
                    className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
                  >
                    Verify
                  </button>
                  <button
                    onClick={() => setRejectModal({ type: 'copy', id: copy.id })}
                    className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      </>}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reject Entry</h3>
            <p className="text-sm text-gray-600 mb-3">Optionally provide a reason for rejection:</p>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="e.g. Duplicate of existing entry, incorrect format..."
              className="w-full border border-gray-300 rounded-lg p-3 text-sm resize-none h-24 focus:outline-none focus:ring-2 focus:ring-red-400"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleRejectConfirm}
                disabled={!!actionLoading}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium"
              >
                Confirm Reject
              </button>
              <button
                onClick={() => { setRejectModal(null); setRejectReason(''); }}
                className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Merge Modal */}
      {mergeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Merge Movie</h3>
            <p className="text-sm text-gray-600 mb-1">
              Merging <span className="font-medium">"{mergeModal.sourceTitle}"</span> into an existing verified movie.
            </p>
            <p className="text-xs text-gray-500 mb-4">
              All physical copies will be moved to the target movie. The submitted movie will be deleted.
            </p>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Movie ID</label>
            <input
              type="text"
              value={mergeTargetId}
              onChange={e => setMergeTargetId(e.target.value)}
              placeholder="Paste the ID of the existing verified movie"
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <p className="text-xs text-gray-400 mt-1">You can find the movie ID in the URL: /movie/&lt;id&gt;</p>
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleMergeConfirm}
                disabled={!!actionLoading || !mergeTargetId.trim()}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
              >
                Confirm Merge
              </button>
              <button
                onClick={() => { setMergeModal(null); setMergeTargetId(''); }}
                className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
