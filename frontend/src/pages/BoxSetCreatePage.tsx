import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { boxSetApi } from '../services/api';

export default function BoxSetCreatePage() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    format: '',
    region: '',
    edition: '',
    packageType: '',
    notes: '',
    coverImageUrl: '',
    spineImageUrl: '',
    hasSlipcover: false,
    hasBooklet: false,
    hasBonusDisc: false,
    bonusDiscCount: null as number | null,
    hasDigitalCopy: false,
    has3d: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) {
      alert('Name is required');
      return;
    }

    try {
      setSaving(true);
      const result = await boxSetApi.create(form);
      navigate(`/box-sets/${result.boxSet.id}`);
    } catch (err: any) {
      console.error('Failed to create box set:', err);
      alert(err.response?.data?.error || 'Failed to create box set');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link to="/box-sets" className="text-blue-600 hover:text-blue-800 mb-2 inline-block">
          ← Back to Box Sets
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Create New Box Set</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        {/* Basic Info */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Stanley Kubrick: The Masterpiece Collection"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Format
                </label>
                <select
                  value={form.format}
                  onChange={(e) => setForm({ ...form, format: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="">Select format</option>
                  <option value="DVD">DVD</option>
                  <option value="BLU_RAY">Blu-ray</option>
                  <option value="BLU_RAY_4K">4K Blu-ray</option>
                  <option value="VHS">VHS</option>
                  <option value="LASERDISC">LaserDisc</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Region
                </label>
                <input
                  type="text"
                  value={form.region}
                  onChange={(e) => setForm({ ...form, region: e.target.value })}
                  placeholder="e.g. A, B, Free"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Edition
                </label>
                <input
                  type="text"
                  value={form.edition}
                  onChange={(e) => setForm({ ...form, edition: e.target.value })}
                  placeholder="e.g. Criterion #42"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Package Type
                </label>
                <input
                  type="text"
                  value={form.packageType}
                  onChange={(e) => setForm({ ...form, packageType: e.target.value })}
                  placeholder="e.g. Digipak, Slipcase"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
                placeholder="Additional notes about this box set"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
          </div>
        </div>

        {/* Images */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Images</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cover Image URL
              </label>
              <input
                type="url"
                value={form.coverImageUrl}
                onChange={(e) => setForm({ ...form, coverImageUrl: e.target.value })}
                placeholder="https://..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Spine Image URL
              </label>
              <input
                type="url"
                value={form.spineImageUrl}
                onChange={(e) => setForm({ ...form, spineImageUrl: e.target.value })}
                placeholder="https://..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
          </div>
        </div>

        {/* Features */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Features</h3>
          <div className="grid md:grid-cols-2 gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.hasSlipcover}
                onChange={(e) => setForm({ ...form, hasSlipcover: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm font-medium text-gray-700">Has Slipcover</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.hasBooklet}
                onChange={(e) => setForm({ ...form, hasBooklet: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm font-medium text-gray-700">Has Booklet</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.hasBonusDisc}
                onChange={(e) => setForm({ ...form, hasBonusDisc: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm font-medium text-gray-700">Has Bonus Disc</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.hasDigitalCopy}
                onChange={(e) => setForm({ ...form, hasDigitalCopy: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm font-medium text-gray-700">Has Digital Copy</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.has3d}
                onChange={(e) => setForm({ ...form, has3d: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm font-medium text-gray-700">Has 3D</span>
            </label>
          </div>

          {form.hasBonusDisc && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bonus Disc Count
              </label>
              <input
                type="number"
                min="1"
                value={form.bonusDiscCount || ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    bonusDiscCount: e.target.value ? Number(e.target.value) : null,
                  })
                }
                placeholder="1"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-gray-700">
            💡 After creating the box set, you can add movies and manage all details on the detail page.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-medium disabled:opacity-50"
          >
            {saving ? 'Creating...' : 'Create Box Set'}
          </button>
          <Link
            to="/box-sets"
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-center"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
