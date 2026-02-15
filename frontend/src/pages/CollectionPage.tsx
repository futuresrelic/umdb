import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

interface PhysicalCopyWithMovie {
  id: string;
  format: string;
  edition?: string;
  region?: string;
  condition?: string;
  distributor?: string;
  upc?: string;
  ean?: string;
  asin?: string;
  releaseDate?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  coverImageUrl?: string;
  notes?: string;
  createdAt: string;
  movie: {
    id: string;
    title: string;
    year?: number;
    posterUrl?: string;
    rating?: number;
  };
}

const FORMATS = [
  'DVD', 'BLU_RAY', 'BLU_RAY_4K', 'VHS', 'LASERDISC', 'BETAMAX',
  'HD_DVD', 'DIGITAL', 'STREAMING', 'CD', 'VINYL', 'CASSETTE',
  'EIGHT_TRACK', 'MINI_DISC', 'OTHER'
];

const FORMAT_LABELS: Record<string, string> = {
  DVD: 'DVD',
  BLU_RAY: 'Blu-ray',
  BLU_RAY_4K: '4K Blu-ray',
  VHS: 'VHS',
  LASERDISC: 'LaserDisc',
  BETAMAX: 'Betamax',
  HD_DVD: 'HD-DVD',
  DIGITAL: 'Digital',
  STREAMING: 'Streaming',
  CD: 'CD',
  VINYL: 'Vinyl',
  CASSETTE: 'Cassette',
  EIGHT_TRACK: '8-Track',
  MINI_DISC: 'MiniDisc',
  OTHER: 'Other'
};

function CollectionPage() {
  const [copies, setCopies] = useState<PhysicalCopyWithMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 24;

  const [formatFilter, setFormatFilter] = useState('');
  const [conditionFilter, setConditionFilter] = useState('');
  const [search, setSearch] = useState('');
  const [upcSearch, setUpcSearch] = useState('');

  useEffect(() => {
    loadCopies();
  }, [page, formatFilter, conditionFilter]);

  const loadCopies = async () => {
    try {
      setLoading(true);
      const params: any = {
        limit,
        offset: (page - 1) * limit
      };
      if (formatFilter) params.format = formatFilter;
      if (conditionFilter) params.condition = conditionFilter;

      const response = await api.get('/physical-copies', { params });
      setCopies(response.data.copies || []);
      setTotal(response.data.total || 0);
    } catch (error) {
      console.error('Failed to load collection:', error);
      setCopies([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpcSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!upcSearch.trim()) return;
    try {
      setLoading(true);
      const response = await api.get(`/physical-copies`, {
        params: { limit: 50, offset: 0 }
      });
      // Filter client-side by UPC/EAN/ASIN
      const all = response.data.copies || [];
      const filtered = all.filter((c: PhysicalCopyWithMovie) =>
        c.upc === upcSearch.trim() ||
        c.ean === upcSearch.trim() ||
        c.asin === upcSearch.trim()
      );
      setCopies(filtered);
      setTotal(filtered.length);
    } catch (error) {
      console.error('UPC search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCopies = search
    ? copies.filter(c =>
        c.movie.title.toLowerCase().includes(search.toLowerCase()) ||
        (c.edition && c.edition.toLowerCase().includes(search.toLowerCase())) ||
        (c.distributor && c.distributor.toLowerCase().includes(search.toLowerCase()))
      )
    : copies;

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">My Collection</h1>
          <p className="text-gray-600 mt-1">Physical media inventory — DVD, Blu-ray, VHS &amp; more</p>
        </div>
        <div className="text-sm text-gray-600">
          {total} {total !== 1 ? 'items' : 'item'} in collection
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="mb-6 space-y-3">
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Search by title, edition, distributor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[200px] px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          <select
            value={formatFilter}
            onChange={(e) => { setFormatFilter(e.target.value); setPage(1); }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Formats</option>
            {FORMATS.map(f => (
              <option key={f} value={f}>{FORMAT_LABELS[f]}</option>
            ))}
          </select>

          <select
            value={conditionFilter}
            onChange={(e) => { setConditionFilter(e.target.value); setPage(1); }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Conditions</option>
            <option value="New">New</option>
            <option value="Like New">Like New</option>
            <option value="Good">Good</option>
            <option value="Fair">Fair</option>
            <option value="Poor">Poor</option>
          </select>
        </div>

        {/* UPC/Barcode Search */}
        <form onSubmit={handleUpcSearch} className="flex gap-2">
          <input
            type="text"
            placeholder="Lookup by barcode (UPC / EAN / ASIN)..."
            value={upcSearch}
            onChange={(e) => setUpcSearch(e.target.value)}
            className="flex-1 max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
          >
            Barcode Lookup
          </button>
          {upcSearch && (
            <button
              type="button"
              onClick={() => { setUpcSearch(''); loadCopies(); }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm"
            >
              Clear
            </button>
          )}
        </form>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-600">Loading collection...</div>
      ) : filteredCopies.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-600 mb-4 text-lg">No physical copies found</p>
          <p className="text-gray-500 mb-6 text-sm">
            Add physical copies to movies in your database to start building your collection.
          </p>
          <Link
            to="/browse"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Browse Movies
          </Link>
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
            {filteredCopies.map((copy) => (
              <Link
                key={copy.id}
                to={`/movie/${copy.movie.id}`}
                className="bg-white rounded-lg shadow hover:shadow-xl transition overflow-hidden flex"
              >
                {/* Cover or Poster */}
                <div className="flex-shrink-0 w-20">
                  {copy.coverImageUrl ? (
                    <img
                      src={copy.coverImageUrl}
                      alt={`${copy.movie.title} cover`}
                      className="w-20 h-28 object-cover"
                    />
                  ) : copy.movie.posterUrl ? (
                    <img
                      src={copy.movie.posterUrl}
                      alt={copy.movie.title}
                      className="w-20 h-28 object-cover"
                    />
                  ) : (
                    <div className="w-20 h-28 bg-gray-200 flex items-center justify-center">
                      <span className="text-3xl">💿</span>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 p-3">
                  <h3 className="font-bold text-sm leading-tight mb-1 line-clamp-2">
                    {copy.movie.title}
                    {copy.movie.year && <span className="font-normal text-gray-500"> ({copy.movie.year})</span>}
                  </h3>

                  <span className={`inline-block text-xs px-2 py-0.5 rounded mb-2 ${
                    copy.format === 'BLU_RAY' || copy.format === 'BLU_RAY_4K'
                      ? 'bg-blue-100 text-blue-800'
                      : copy.format === 'DVD'
                      ? 'bg-yellow-100 text-yellow-800'
                      : copy.format === 'VHS'
                      ? 'bg-gray-100 text-gray-800'
                      : copy.format === 'VINYL' || copy.format === 'CD'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {FORMAT_LABELS[copy.format] || copy.format}
                  </span>

                  {copy.edition && (
                    <p className="text-xs text-gray-600 truncate">{copy.edition}</p>
                  )}
                  {copy.region && (
                    <p className="text-xs text-gray-500">{copy.region}</p>
                  )}
                  {copy.condition && (
                    <p className="text-xs text-gray-500">{copy.condition}</p>
                  )}
                  {copy.upc && (
                    <p className="text-xs text-gray-400 truncate">UPC: {copy.upc}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && !search && (
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
                  if (totalPages <= 7) pageNum = i + 1;
                  else if (page <= 4) pageNum = i + 1;
                  else if (page >= totalPages - 3) pageNum = totalPages - 6 + i;
                  else pageNum = page - 3 + i;

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

export default CollectionPage;
