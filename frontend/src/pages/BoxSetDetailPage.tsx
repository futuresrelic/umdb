import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { boxSetApi } from '../services/api';

interface BoxSetMovie {
  id: string | null;
  boxSetItemId: string;
  title?: string;
  year?: number;
  posterUrl?: string | null;
  plot?: string | null;
  rating?: number | null;
  runtime?: number | null;
  position: number;
  discNumber: number | null;
  discLabel: string | null;
  isPresent: boolean;
  physicalCopyId: string | null;
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
  spineImageUrl: string | null;
  hasSlipcover: boolean;
  hasBooklet: boolean;
  hasBonusDisc: boolean;
  bonusDiscCount: number | null;
  hasDigitalCopy: boolean;
  has3d: boolean;
  createdAt: string;
  updatedAt: string;
  movies: BoxSetMovie[];
  releases: Array<{ id: string; movieId: string | null }>;
}

export default function BoxSetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [boxSet, setBoxSet] = useState<BoxSet | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);

  const loadBoxSet = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await boxSetApi.getBoxSet(id);
      setBoxSet(data.boxSet);
    } catch (err) {
      console.error('Failed to load box set:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBoxSet();
  }, [id]);

  const handleUpdate = async (field: string, value: any) => {
    if (!id || !boxSet) return;
    try {
      setSaving(true);
      await boxSetApi.update(id, { [field]: value });
      setBoxSet({ ...boxSet, [field]: value });
      setEditingField(null);
    } catch (err) {
      console.error('Failed to update:', err);
      alert('Failed to update field');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    if (!confirm(`Delete "${boxSet?.name}"? This cannot be undone!`)) return;
    try {
      await boxSetApi.delete(id);
      navigate('/box-sets');
    } catch (err) {
      console.error('Failed to delete:', err);
      alert('Failed to delete box set');
    }
  };

  const handleUpdateMovie = async (movieId: string, field: string, value: any) => {
    if (!id) return;
    try {
      await boxSetApi.updateMovie(id, movieId, { [field]: value });
      loadBoxSet(); // Reload to get updated data
    } catch (err) {
      console.error('Failed to update movie:', err);
      alert('Failed to update movie');
    }
  };

  const handleRemoveMovie = async (movieId: string) => {
    if (!id || !movieId) return;
    if (!confirm('Remove this movie from the box set?')) return;
    try {
      await boxSetApi.removeMovie(id, movieId);
      loadBoxSet();
    } catch (err) {
      console.error('Failed to remove movie:', err);
      alert('Failed to remove movie');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <p className="text-gray-500">Loading box set...</p>
      </div>
    );
  }

  if (!boxSet) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <p className="text-red-600">Box set not found</p>
      </div>
    );
  }

  const EditableField = ({
    label,
    value,
    field,
    type = 'text',
    multiline = false,
  }: {
    label: string;
    value: any;
    field: string;
    type?: 'text' | 'select' | 'number';
    multiline?: boolean;
  }) => {
    const [tempValue, setTempValue] = useState(value);
    const isEditing = editingField === field;

    return (
      <div className="py-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        {isEditing ? (
          <div className="flex gap-2">
            {multiline ? (
              <textarea
                value={tempValue || ''}
                onChange={(e) => setTempValue(e.target.value)}
                className="flex-1 border border-blue-500 rounded px-3 py-2"
                rows={3}
                autoFocus
              />
            ) : (
              <input
                type={type}
                value={tempValue || ''}
                onChange={(e) => setTempValue(e.target.value)}
                className="flex-1 border border-blue-500 rounded px-3 py-2"
                autoFocus
              />
            )}
            <button
              onClick={() => handleUpdate(field, tempValue)}
              disabled={saving}
              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              Save
            </button>
            <button
              onClick={() => {
                setEditingField(null);
                setTempValue(value);
              }}
              className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div
            onClick={() => {
              setEditingField(field);
              setTempValue(value);
            }}
            className="cursor-pointer hover:bg-blue-50 rounded px-3 py-2 border border-transparent hover:border-blue-300 transition"
          >
            {value || <span className="text-gray-400 italic">Click to edit</span>}
          </div>
        )}
      </div>
    );
  };

  const ToggleField = ({ label, value, field }: { label: string; value: boolean; field: string }) => {
    return (
      <label className="flex items-center gap-2 cursor-pointer py-2">
        <input
          type="checkbox"
          checked={value}
          onChange={(e) => handleUpdate(field, e.target.checked)}
          disabled={saving}
          className="rounded"
        />
        <span className="text-sm font-medium text-gray-700">{label}</span>
      </label>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link to="/box-sets" className="text-blue-600 hover:text-blue-800 mb-2 inline-block">
          ← Back to Box Sets
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">{boxSet.name}</h1>
            <div className="text-sm text-gray-500 font-mono">{boxSet.id}</div>
          </div>
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            🗑️ Delete
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Images */}
        <div className="space-y-4">
          {/* Cover Image */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold mb-2">Cover Image</h3>
            {boxSet.coverImageUrl ? (
              <img
                src={boxSet.coverImageUrl}
                alt="Cover"
                className="w-full rounded shadow mb-2"
              />
            ) : (
              <div className="aspect-[3/2] bg-gray-100 rounded flex items-center justify-center text-gray-400 mb-2">
                <div className="text-4xl">📦</div>
              </div>
            )}
            <EditableField
              label="Cover Image URL"
              value={boxSet.coverImageUrl}
              field="coverImageUrl"
            />
          </div>

          {/* Spine Image */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold mb-2">Spine Image</h3>
            {boxSet.spineImageUrl ? (
              <img
                src={boxSet.spineImageUrl}
                alt="Spine"
                className="w-full rounded shadow mb-2"
              />
            ) : (
              <div className="aspect-[8/1] bg-gray-100 rounded flex items-center justify-center text-gray-400 mb-2 text-xs">
                No spine image
              </div>
            )}
            <EditableField
              label="Spine Image URL"
              value={boxSet.spineImageUrl}
              field="spineImageUrl"
            />
          </div>
        </div>

        {/* Middle Column - Metadata */}
        <div className="lg:col-span-2 space-y-4">
          {/* Basic Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
            <div className="space-y-1">
              <EditableField label="Name" value={boxSet.name} field="name" />
              <EditableField label="Format" value={boxSet.format} field="format" />
              <EditableField label="Region" value={boxSet.region} field="region" />
              <EditableField label="Edition" value={boxSet.edition} field="edition" />
              <EditableField label="Package Type" value={boxSet.packageType} field="packageType" />
              <EditableField label="Notes" value={boxSet.notes} field="notes" multiline />
            </div>
          </div>

          {/* Features */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Features</h3>
            <div className="grid md:grid-cols-2 gap-2">
              <ToggleField label="Has Slipcover" value={boxSet.hasSlipcover} field="hasSlipcover" />
              <ToggleField label="Has Booklet" value={boxSet.hasBooklet} field="hasBooklet" />
              <ToggleField label="Has Bonus Disc" value={boxSet.hasBonusDisc} field="hasBonusDisc" />
              <ToggleField label="Has Digital Copy" value={boxSet.hasDigitalCopy} field="hasDigitalCopy" />
              <ToggleField label="Has 3D" value={boxSet.has3d} field="has3d" />
            </div>
            {boxSet.hasBonusDisc && (
              <div className="mt-4">
                <EditableField
                  label="Bonus Disc Count"
                  value={boxSet.bonusDiscCount}
                  field="bonusDiscCount"
                  type="number"
                />
              </div>
            )}
          </div>

          {/* Movies */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">
              Movies ({boxSet.movies.length})
            </h3>
            {boxSet.movies.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No movies in this box set</p>
            ) : (
              <div className="space-y-3">
                {boxSet.movies.map((movie) => (
                  <div key={movie.boxSetItemId} className="border rounded-lg p-4 flex gap-4">
                    {movie.posterUrl && (
                      <img
                        src={movie.posterUrl}
                        alt={movie.title}
                        className="w-16 h-24 object-cover rounded shadow flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          {movie.id ? (
                            <Link
                              to={`/movie/${movie.id}`}
                              className="font-medium text-blue-600 hover:text-blue-800"
                            >
                              {movie.title} {movie.year && `(${movie.year})`}
                            </Link>
                          ) : (
                            <span className="font-medium text-gray-900">
                              {movie.title} {movie.year && `(${movie.year})`}
                            </span>
                          )}
                          <div className="text-xs text-gray-500 font-mono mt-0.5">{movie.id}</div>
                        </div>
                        {movie.id && (
                          <button
                            onClick={() => handleRemoveMovie(movie.id!)}
                            className="text-red-600 hover:text-red-800 text-sm ml-2"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <label className="text-xs text-gray-600">Position</label>
                          <input
                            type="number"
                            value={movie.position}
                            onChange={(e) => handleUpdateMovie(movie.id!, 'position', Number(e.target.value))}
                            className="w-full border rounded px-2 py-1 text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600">Disc Number</label>
                          <input
                            type="number"
                            value={movie.discNumber || ''}
                            onChange={(e) => handleUpdateMovie(movie.id!, 'discNumber', e.target.value ? Number(e.target.value) : null)}
                            className="w-full border rounded px-2 py-1 text-sm"
                            placeholder="Optional"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="text-xs text-gray-600">Disc Label</label>
                          <input
                            type="text"
                            value={movie.discLabel || ''}
                            onChange={(e) => handleUpdateMovie(movie.id!, 'discLabel', e.target.value || null)}
                            className="w-full border rounded px-2 py-1 text-sm"
                            placeholder="e.g. Disc 1: The Fellowship"
                          />
                        </div>
                      </div>

                      <label className="flex items-center gap-2 mt-2 cursor-pointer text-sm">
                        <input
                          type="checkbox"
                          checked={movie.isPresent}
                          onChange={(e) => handleUpdateMovie(movie.id!, 'isPresent', e.target.checked)}
                          className="rounded"
                        />
                        <span className="text-gray-700">Present in collection</span>
                      </label>

                      {movie.physicalCopyId && (
                        <div className="mt-2 text-xs text-gray-500 font-mono">
                          PhysicalCopy: {movie.physicalCopyId}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Releases */}
          {boxSet.releases.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">
                Physical Releases ({boxSet.releases.length})
              </h3>
              <div className="space-y-2 text-sm font-mono text-gray-600">
                {boxSet.releases.map((release) => (
                  <div key={release.id} className="flex justify-between">
                    <span>{release.id}</span>
                    <span className="text-gray-400">{release.movieId}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
