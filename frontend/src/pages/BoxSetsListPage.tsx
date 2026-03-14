import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { boxSetApi } from '../services/api';

interface BoxSet {
  id: string;
  name: string;
  format: string | null;
  region: string | null;
  edition: string | null;
  packageType: string | null;
  coverImageUrl: string | null;
  movieCount: number;
  releaseCount: number;
  createdAt: string;
  movies: Array<{
    id: string | null;
    title?: string;
    year?: number;
    posterUrl?: string | null;
  }>;
}

export default function BoxSetsListPage() {
  const [boxSets, setBoxSets] = useState<BoxSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [format, setFormat] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [total, setTotal] = useState(0);

  const loadBoxSets = async () => {
    try {
      setLoading(true);
      const data = await boxSetApi.getAll({
        search: search || undefined,
        format: format || undefined,
        sortBy,
        sortOrder,
        limit: 50,
        offset: 0,
      });
      setBoxSets(data.boxSets);
      setTotal(data.total);
    } catch (err) {
      console.error('Failed to load box sets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBoxSets();
  }, [search, format, sortBy, sortOrder]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-900">📦 Box Sets</h1>
          <Link
            to="/box-sets/new"
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium"
          >
            + New Box Set
          </Link>
        </div>
        <p className="text-gray-600">Manage your box set collection</p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="">All Formats</option>
              <option value="DVD">DVD</option>
              <option value="BLU_RAY">Blu-ray</option>
              <option value="BLU_RAY_4K">4K Blu-ray</option>
              <option value="VHS">VHS</option>
              <option value="LASERDISC">LaserDisc</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [newSortBy, newSortOrder] = e.target.value.split('-');
                setSortBy(newSortBy);
                setSortOrder(newSortOrder as 'asc' | 'desc');
              }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="createdAt-desc">Newest First</option>
              <option value="createdAt-asc">Oldest First</option>
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4 text-sm text-gray-600">
        {total} box set{total !== 1 ? 's' : ''} found
      </div>

      {/* Box Sets Grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading box sets...</div>
      ) : boxSets.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-6xl mb-4">📦</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No box sets yet</h3>
          <p className="text-gray-600 mb-4">Create your first box set to get started</p>
          <Link
            to="/box-sets/new"
            className="inline-block bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 font-medium"
          >
            + New Box Set
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {boxSets.map((boxSet) => (
            <Link
              key={boxSet.id}
              to={`/box-sets/${boxSet.id}`}
              className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden group"
            >
              {/* Cover Image */}
              {boxSet.coverImageUrl ? (
                <div className="aspect-[3/2] overflow-hidden bg-gray-100">
                  <img
                    src={boxSet.coverImageUrl}
                    alt={boxSet.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition"
                  />
                </div>
              ) : (
                <div className="aspect-[3/2] bg-gray-100 flex items-center justify-center text-gray-400">
                  <div className="text-6xl">📦</div>
                </div>
              )}

              {/* Info */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600">
                  {boxSet.name}
                </h3>

                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  {boxSet.format && (
                    <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                      {boxSet.format.replace('_', ' ')}
                    </span>
                  )}
                  {boxSet.region && (
                    <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                      Region {boxSet.region}
                    </span>
                  )}
                </div>

                <div className="text-sm text-gray-600 flex items-center gap-2">
                  <span>🎬 {boxSet.movieCount} movie{boxSet.movieCount !== 1 ? 's' : ''}</span>
                  <span>•</span>
                  <span>💿 {boxSet.releaseCount} release{boxSet.releaseCount !== 1 ? 's' : ''}</span>
                </div>

                {boxSet.edition && (
                  <div className="text-xs text-gray-500 mt-2">{boxSet.edition}</div>
                )}

                {/* ID for debugging */}
                <div className="text-xs text-gray-400 mt-2 font-mono">{boxSet.id}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
