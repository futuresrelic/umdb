import { useState, useEffect } from 'react';

interface PhysicalCopy {
  id: string;
  format: string;
  editionName?: string;
  packageType?: string;
  region?: string;
  country?: string;
  distributor?: string;
  editionPublisher?: string;
  upc?: string;
  ean?: string;
  asin?: string;
  releaseDate?: string;
  discCount?: number;
  language?: string;
  videoStandard?: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  submittedBy?: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  coverImageUrl?: string;
  edition?: string;
  studio?: string;
  bonusContent?: string;
}

interface Props {
  movieId: string;
  movieTitle: string;
  canEdit: boolean;
  isAdmin: boolean;
}

function PhysicalEditionsSection({ movieId, movieTitle, canEdit, isAdmin }: Props) {
  const [copies, setCopies] = useState<PhysicalCopy[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    loadCopies();
  }, [movieId]);

  const loadCopies = async () => {
    try {
      setLoading(true);
      const apiBase = import.meta.env.VITE_API_URL || '/api';
      const response = await fetch(`${apiBase}/physical-copies/movie/${movieId}`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setCopies(data.copies || []);
      }
    } catch (error) {
      console.error('Failed to load physical copies:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">💿 Physical Editions</h2>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600">Loading physical editions...</p>
        </div>
      </div>
    );
  }

  const verifiedCopies = copies.filter(c => c.status === 'VERIFIED');
  const pendingCopies = copies.filter(c => c.status === 'PENDING');
  const displayCopies = showAll ? copies : copies.slice(0, 3);

  if (copies.length === 0) {
    return (
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">💿 Physical Editions</h2>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600 mb-4">No physical editions registered yet</p>
          <p className="text-sm text-gray-500">
            Be the first to add a physical edition of {movieTitle} to UMDB!
          </p>
        </div>
      </div>
    );
  }

  const formatDisplayName = (format: string) => {
    return format.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getSourceLabel = (copy: PhysicalCopy) => {
    // If it came from CineShelf, it would have been created via the API
    // For now, we can infer based on submittedBy
    return copy.submittedBy ? 'User Submission' : 'UMDB Database';
  };

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-900">
          💿 Physical Editions
          <span className="ml-3 text-sm font-normal text-gray-600">
            ({verifiedCopies.length} verified
            {pendingCopies.length > 0 && `, ${pendingCopies.length} pending`})
          </span>
        </h2>
        {canEdit && (
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium">
            ➕ Add New Edition
          </button>
        )}
      </div>

      {pendingCopies.length > 0 && (isAdmin || canEdit) && (
        <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            ⚠️ <strong>{pendingCopies.length} edition{pendingCopies.length !== 1 ? 's' : ''}</strong> awaiting admin verification
          </p>
        </div>
      )}

      <div className="space-y-4">
        {displayCopies.map((copy) => (
          <div
            key={copy.id}
            className={`border rounded-lg p-6 ${
              copy.status === 'VERIFIED'
                ? 'bg-white border-gray-200'
                : copy.status === 'PENDING'
                ? 'bg-yellow-50 border-yellow-200'
                : 'bg-red-50 border-red-200'
            }`}
          >
            <div className="flex items-start gap-6">
              {/* Edition thumbnail/icon */}
              <div className="flex-shrink-0">
                {copy.coverImageUrl ? (
                  <img
                    src={copy.coverImageUrl}
                    alt={copy.editionName || `${formatDisplayName(copy.format)} edition`}
                    className="w-24 h-32 object-cover rounded-lg shadow"
                  />
                ) : (
                  <div className="w-24 h-32 bg-gray-100 rounded-lg flex items-center justify-center text-4xl">
                    {copy.format.includes('BLU_RAY') ? '💿' :
                     copy.format === 'DVD' ? '📀' :
                     copy.format === 'VHS' ? '📼' :
                     copy.format === 'LASERDISC' ? '💽' : '📦'}
                  </div>
                )}
              </div>

              {/* Edition details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {copy.editionName || `${formatDisplayName(copy.format)} Edition`}
                    </h3>
                    {copy.edition && (
                      <p className="text-sm text-gray-600 mt-1">{copy.edition}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      copy.status === 'VERIFIED'
                        ? 'bg-green-100 text-green-800'
                        : copy.status === 'PENDING'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {copy.status === 'VERIFIED' ? '✓ Verified' :
                       copy.status === 'PENDING' ? '⏳ Pending' : '✗ Rejected'}
                    </span>
                  </div>
                </div>

                {/* Key metadata */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-500">Format:</span>
                    <span className="text-sm text-gray-900">{formatDisplayName(copy.format)}</span>
                  </div>

                  {copy.region && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500">Region:</span>
                      <span className="text-sm text-gray-900">{copy.region}</span>
                    </div>
                  )}

                  {copy.country && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500">Country:</span>
                      <span className="text-sm text-gray-900">{copy.country}</span>
                    </div>
                  )}

                  {copy.distributor && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500">Distributor:</span>
                      <span className="text-sm text-gray-900">{copy.distributor}</span>
                    </div>
                  )}

                  {copy.editionPublisher && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500">Publisher:</span>
                      <span className="text-sm text-gray-900">{copy.editionPublisher}</span>
                    </div>
                  )}

                  {copy.studio && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500">Studio:</span>
                      <span className="text-sm text-gray-900">{copy.studio}</span>
                    </div>
                  )}

                  {copy.releaseDate && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500">Released:</span>
                      <span className="text-sm text-gray-900">
                        {new Date(copy.releaseDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  {copy.language && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500">Language:</span>
                      <span className="text-sm text-gray-900">{copy.language}</span>
                    </div>
                  )}

                  {copy.videoStandard && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500">Video:</span>
                      <span className="text-sm text-gray-900">{copy.videoStandard}</span>
                    </div>
                  )}
                </div>

                {/* Barcodes */}
                {(copy.upc || copy.ean || copy.asin) && (
                  <div className="flex flex-wrap gap-3 mb-3">
                    {copy.upc && (
                      <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded text-xs font-mono">
                        UPC: {copy.upc}
                      </span>
                    )}
                    {copy.ean && (
                      <span className="px-3 py-1 bg-green-50 text-green-700 rounded text-xs font-mono">
                        EAN: {copy.ean}
                      </span>
                    )}
                    {copy.asin && (
                      <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded text-xs font-mono">
                        ASIN: {copy.asin}
                      </span>
                    )}
                  </div>
                )}

                {/* Bonus content preview */}
                {copy.bonusContent && (
                  <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                    <span className="font-medium">Bonus Content:</span> {copy.bonusContent}
                  </p>
                )}

                {/* Attribution */}
                <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-200">
                  <div className="flex items-center gap-4">
                    {copy.submittedBy && (
                      <span>
                        Added by <span className="font-medium text-gray-700">{copy.submittedBy.name}</span>
                      </span>
                    )}
                    <span>
                      {new Date(copy.createdAt).toLocaleDateString()}
                    </span>
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                      {getSourceLabel(copy)}
                    </span>
                  </div>
                  {canEdit && (
                    <button className="text-blue-600 hover:text-blue-700 font-medium">
                      View Full Details →
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {copies.length > 3 && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="mt-4 w-full py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
        >
          Show All {copies.length} Editions →
        </button>
      )}

      {showAll && copies.length > 3 && (
        <button
          onClick={() => setShowAll(false)}
          className="mt-4 w-full py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
        >
          Show Less
        </button>
      )}
    </div>
  );
}

export default PhysicalEditionsSection;
