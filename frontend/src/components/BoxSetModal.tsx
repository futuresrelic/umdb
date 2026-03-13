import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { boxSetApi } from '../services/api';

interface BoxSetMovie {
  id: string;
  title: string;
  year: number | null;
  posterUrl: string | null;
  tagline: string | null;
  plot: string | null;
  rating: number | null;
  runtime: number | null;
}

interface BoxSetItem {
  id: string;
  position: number;
  discNumber: number | null;
  discLabel: string | null;
  movie: BoxSetMovie;
}

interface BoxSet {
  id: string;
  name: string;
  format: string | null;
  region: string | null;
  edition: string | null;
  packageType: string | null;
  notes: string | null;
  coverImageUrl: string | null;
  items: BoxSetItem[];
}

interface Props {
  boxSetId: string;
  onClose: () => void;
}

export default function BoxSetModal({ boxSetId, onClose }: Props) {
  const [boxSet, setBoxSet] = useState<BoxSet | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBoxSet = async () => {
      try {
        const data = await boxSetApi.getBoxSet(boxSetId);
        setBoxSet(data.boxSet);
      } catch (err) {
        console.error('Failed to load box set:', err);
      } finally {
        setLoading(false);
      }
    };
    loadBoxSet();
  }, [boxSetId]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full p-6" onClick={e => e.stopPropagation()}>
          <p className="text-gray-500 text-center">Loading box set...</p>
        </div>
      </div>
    );
  }

  if (!boxSet) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full p-6" onClick={e => e.stopPropagation()}>
          <p className="text-red-600 text-center">Failed to load box set</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 mx-auto block"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-xl">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">📦 {boxSet.name}</h2>
              <div className="flex gap-3 text-sm text-gray-600">
                {boxSet.format && <span className="bg-gray-100 px-2 py-0.5 rounded">{boxSet.format}</span>}
                {boxSet.region && <span className="bg-gray-100 px-2 py-0.5 rounded">Region {boxSet.region}</span>}
                {boxSet.edition && <span className="bg-gray-100 px-2 py-0.5 rounded">{boxSet.edition}</span>}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            >
              ×
            </button>
          </div>
        </div>

        {/* Movies Grid */}
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Movies in this Box Set ({boxSet.items.length})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {boxSet.items.map((item) => (
              <Link
                key={item.id}
                to={`/movie/${item.movie.id}`}
                onClick={onClose}
                className="group bg-gray-50 rounded-lg overflow-hidden hover:shadow-md transition border border-gray-200 hover:border-blue-400"
              >
                {item.movie.posterUrl ? (
                  <img
                    src={item.movie.posterUrl}
                    alt={item.movie.title}
                    className="w-full aspect-[2/3] object-cover"
                  />
                ) : (
                  <div className="w-full aspect-[2/3] bg-gray-200 flex items-center justify-center text-gray-400">
                    No poster
                  </div>
                )}
                <div className="p-3">
                  <div className="font-medium text-gray-900 group-hover:text-blue-600 line-clamp-2">
                    {item.movie.title}
                  </div>
                  {item.movie.year && (
                    <div className="text-sm text-gray-500 mt-0.5">{item.movie.year}</div>
                  )}
                  {item.discNumber && (
                    <div className="text-xs text-purple-600 mt-1">
                      Disc {item.discNumber}{item.discLabel && `: ${item.discLabel}`}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>

          {boxSet.notes && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-sm font-medium text-gray-700 mb-1">Notes</div>
              <div className="text-sm text-gray-600">{boxSet.notes}</div>
            </div>
          )}

          {/* View Full Page Link */}
          <div className="mt-6 text-center">
            <Link
              to={`/box-sets/${boxSet.id}`}
              onClick={onClose}
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
            >
              View Full Box Set Page →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
