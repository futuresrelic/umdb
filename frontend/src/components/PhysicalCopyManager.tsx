import { useState, useEffect } from 'react';
import api from '../services/api';

interface PhysicalCopy {
  id: string;
  format: string;
  region?: string;
  edition?: string;
  distributor?: string;
  releaseDate?: string;
  upc?: string;
  ean?: string;
  asin?: string;
  condition?: string;
  location?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  notes?: string;
}

interface Props {
  movieId: string;
}

const FORMATS = ['DVD', 'BLU_RAY', 'BLU_RAY_4K', 'VHS', 'LASERDISC', 'BETAMAX', 'HD_DVD', 'DIGITAL', 'STREAMING', 'CD', 'VINYL', 'CASSETTE', 'EIGHT_TRACK', 'MINI_DISC', 'OTHER'];

function PhysicalCopyManager({ movieId }: Props) {
  const [copies, setCopies] = useState<PhysicalCopy[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<Partial<PhysicalCopy>>({
    format: 'DVD'
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCopies();
  }, [movieId]);

  const loadCopies = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/physical-copies/movie/${movieId}`);
      setCopies(response.data);
    } catch (error) {
      console.error('Failed to load physical copies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.format) {
      alert('Format is required');
      return;
    }

    try {
      setSaving(true);
      await api.post(`/physical-copies/movie/${movieId}`, formData);
      alert('Physical copy added successfully!');
      setShowAddForm(false);
      setFormData({ format: 'DVD' });
      loadCopies();
    } catch (error: any) {
      console.error('Failed to add physical copy:', error);
      alert(`Failed to add physical copy: ${error.response?.data?.message || error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (copyId: string) => {
    if (!confirm('Are you sure you want to delete this physical copy?')) return;

    try {
      await api.delete(`/physical-copies/${copyId}`);
      alert('Physical copy deleted successfully!');
      loadCopies();
    } catch (error) {
      console.error('Failed to delete physical copy:', error);
      alert('Failed to delete physical copy');
    }
  };

  const formatLabel = (format: string) => {
    return format.replace(/_/g, ' ');
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Physical Copies</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition text-sm"
        >
          {showAddForm ? 'Cancel' : '+ Add Copy'}
        </button>
      </div>

      {showAddForm && (
        <div className="bg-gray-50 p-4 rounded-lg mb-4 border">
          <h3 className="font-bold mb-3">Add Physical Copy</h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Format *</label>
                <select
                  value={formData.format}
                  onChange={(e) => setFormData({ ...formData, format: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  required
                >
                  {FORMATS.map(format => (
                    <option key={format} value={format}>
                      {formatLabel(format)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Edition</label>
                <input
                  type="text"
                  value={formData.edition || ''}
                  onChange={(e) => setFormData({ ...formData, edition: e.target.value })}
                  placeholder="Collector's Edition, Director's Cut, etc."
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Region</label>
                <input
                  type="text"
                  value={formData.region || ''}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  placeholder="Region 1, Region A, etc."
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Condition</label>
                <input
                  type="text"
                  value={formData.condition || ''}
                  onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                  placeholder="New, Like New, Good, Fair"
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Distributor</label>
                <input
                  type="text"
                  value={formData.distributor || ''}
                  onChange={(e) => setFormData({ ...formData, distributor: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Location</label>
                <input
                  type="text"
                  value={formData.location || ''}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Where it's stored"
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">UPC/Barcode</label>
                <input
                  type="text"
                  value={formData.upc || ''}
                  onChange={(e) => setFormData({ ...formData, upc: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Purchase Price</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.purchasePrice || ''}
                  onChange={(e) => setFormData({ ...formData, purchasePrice: parseFloat(e.target.value) })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Release Date</label>
                <input
                  type="date"
                  value={formData.releaseDate || ''}
                  onChange={(e) => setFormData({ ...formData, releaseDate: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Purchase Date</label>
                <input
                  type="date"
                  value={formData.purchaseDate || ''}
                  onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Notes</label>
              <textarea
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full border rounded px-3 py-2"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
              {saving ? 'Saving...' : 'Save Copy'}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-4 text-gray-500">Loading...</div>
      ) : copies.length === 0 ? (
        <div className="text-center py-4 text-gray-500">
          No physical copies added yet
        </div>
      ) : (
        <div className="space-y-3">
          {copies.map((copy) => (
            <div key={copy.id} className="border rounded-lg p-4 bg-white">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded font-medium">
                    {formatLabel(copy.format)}
                  </span>
                  {copy.edition && (
                    <span className="text-sm text-gray-600">• {copy.edition}</span>
                  )}
                  {copy.region && (
                    <span className="text-sm text-gray-600">• {copy.region}</span>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(copy.id)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Delete
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-2 text-sm text-gray-700">
                {copy.condition && <div><strong>Condition:</strong> {copy.condition}</div>}
                {copy.distributor && <div><strong>Distributor:</strong> {copy.distributor}</div>}
                {copy.location && <div><strong>Location:</strong> {copy.location}</div>}
                {copy.upc && <div><strong>UPC:</strong> {copy.upc}</div>}
                {copy.purchasePrice && <div><strong>Price:</strong> ${copy.purchasePrice.toFixed(2)}</div>}
                {copy.releaseDate && <div><strong>Released:</strong> {new Date(copy.releaseDate).toLocaleDateString()}</div>}
                {copy.purchaseDate && <div><strong>Purchased:</strong> {new Date(copy.purchaseDate).toLocaleDateString()}</div>}
              </div>

              {copy.notes && (
                <div className="mt-2 text-sm text-gray-600">
                  <strong>Notes:</strong> {copy.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default PhysicalCopyManager;
