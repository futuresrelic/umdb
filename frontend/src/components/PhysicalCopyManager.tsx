import { useState, useEffect } from 'react';
import api from '../services/api';

interface PhysicalCopy {
  id: string;
  format: string;
  language?: string;
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
  coverImageUrl?: string;
  notes?: string;
  status?: string;
}

interface Props {
  movieId: string;
  canEdit?: boolean;
}

const FORMATS = ['DVD', 'BLU_RAY', 'BLU_RAY_4K', 'VHS', 'LASERDISC', 'BETAMAX', 'HD_DVD', 'DIGITAL', 'STREAMING', 'CD', 'VINYL', 'CASSETTE', 'EIGHT_TRACK', 'MINI_DISC', 'OTHER'];

const FORMAT_LABELS: Record<string, string> = {
  DVD: 'DVD', BLU_RAY: 'Blu-ray', BLU_RAY_4K: '4K Blu-ray', VHS: 'VHS',
  LASERDISC: 'LaserDisc', BETAMAX: 'Betamax', HD_DVD: 'HD-DVD', DIGITAL: 'Digital',
  STREAMING: 'Streaming', CD: 'CD', VINYL: 'Vinyl', CASSETTE: 'Cassette',
  EIGHT_TRACK: '8-Track', MINI_DISC: 'MiniDisc', OTHER: 'Other'
};

function CopyForm({
  initial,
  onSave,
  onCancel,
  saving
}: {
  initial: Partial<PhysicalCopy>;
  onSave: (data: Partial<PhysicalCopy>) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<Partial<PhysicalCopy>>(initial);
  const set = (key: keyof PhysicalCopy, val: any) => setForm(f => ({ ...f, [key]: val }));

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="space-y-3">
      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Format *</label>
          <select
            value={form.format}
            onChange={(e) => set('format', e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
          >
            {FORMATS.map(f => (
              <option key={f} value={f}>{FORMAT_LABELS[f] || f}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Edition</label>
          <input
            type="text"
            value={form.edition || ""}
            onChange={(e) => set("edition", e.target.value)}
            placeholder="Collector Edition, Director Cut..."
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Language(s)</label>
          <input
            type="text"
            value={form.language || ""}
            onChange={(e) => set("language", e.target.value)}
            placeholder="French, English, Bilingual FR/EN..."
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Region</label>
          <input
            type="text"
            value={form.region || ""}
            onChange={(e) => set("region", e.target.value)}
            placeholder="Region 1, Region A, etc."
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Condition</label>
          <select
            value={form.condition || ""}
            onChange={(e) => set("condition", e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            <option value="">-- Select --</option>
            <option value="New">New</option>
            <option value="Like New">Like New</option>
            <option value="Good">Good</option>
            <option value="Fair">Fair</option>
            <option value="Poor">Poor</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Distributor</label>
          <input
            type="text"
            value={form.distributor || ""}
            onChange={(e) => set("distributor", e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Storage Location</label>
          <input
            type="text"
            value={form.location || ""}
            onChange={(e) => set("location", e.target.value)}
            placeholder="Shelf 3, Box A, living room..."
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">UPC / Barcode</label>
          <input
            type="text"
            value={form.upc || ""}
            onChange={(e) => set("upc", e.target.value)}
            placeholder="12-digit barcode"
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">EAN</label>
          <input
            type="text"
            value={form.ean || ""}
            onChange={(e) => set("ean", e.target.value)}
            placeholder="European Article Number"
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">ASIN</label>
          <input
            type="text"
            value={form.asin || ""}
            onChange={(e) => set("asin", e.target.value)}
            placeholder="Amazon ASIN"
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Purchase Price ($)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={form.purchasePrice ?? ""}
            onChange={(e) => set("purchasePrice", e.target.value ? parseFloat(e.target.value) : undefined)}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Release Date</label>
          <input
            type="date"
            value={form.releaseDate ? String(form.releaseDate).substring(0, 10) : ""}
            onChange={(e) => set("releaseDate", e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Purchase Date</label>
          <input
            type="date"
            value={form.purchaseDate ? String(form.purchaseDate).substring(0, 10) : ""}
            onChange={(e) => set("purchaseDate", e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Cover Image URL</label>
        <input
          type="url"
          value={form.coverImageUrl || ""}
          onChange={(e) => set("coverImageUrl", e.target.value)}
          placeholder="https://example.com/cover.jpg"
          className="w-full border rounded px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Notes</label>
        <textarea
          value={form.notes || ""}
          onChange={(e) => set("notes", e.target.value)}
          rows={3}
          placeholder="Any notes about this copy..."
          className="w-full border rounded px-3 py-2"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 transition"
        >
          {saving ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 rounded border border-gray-300 hover:bg-gray-50 transition"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function PhysicalCopyManager({ movieId, canEdit = true }: Props) {
  const [copies, setCopies] = useState<PhysicalCopy[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
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
      console.error("Failed to load physical copies:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (data: Partial<PhysicalCopy>) => {
    if (!data.format) return;
    try {
      setSaving(true);
      await api.post(`/physical-copies/movie/${movieId}`, data);
      setShowAddForm(false);
      loadCopies();
    } catch (error: any) {
      const msg = error.response && error.response.data && error.response.data.message
        ? error.response.data.message
        : error.message;
      alert("Failed to add: " + msg);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (id: string, data: Partial<PhysicalCopy>) => {
    try {
      setSaving(true);
      await api.put(`/physical-copies/${id}`, data);
      setEditingId(null);
      loadCopies();
    } catch (error: any) {
      const msg = error.response && error.response.data && error.response.data.message
        ? error.response.data.message
        : error.message;
      alert("Failed to update: " + msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (copyId: string) => {
    if (!confirm("Delete this physical copy?")) return;
    try {
      await api.delete(`/physical-copies/${copyId}`);
      loadCopies();
    } catch {
      alert("Failed to delete");
    }
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Physical Copies</h2>
        {canEdit && (
          <button
            onClick={() => { setShowAddForm(!showAddForm); setEditingId(null); }}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition text-sm"
          >
            {showAddForm ? "Cancel" : "+ Add Copy"}
          </button>
        )}
      </div>

      {showAddForm && (
        <div className="bg-gray-50 p-4 rounded-lg mb-4 border">
          <h3 className="font-bold mb-3">Add Physical Copy</h3>
          <CopyForm
            initial={{ format: "DVD" }}
            onSave={handleAdd}
            onCancel={() => setShowAddForm(false)}
            saving={saving}
          />
        </div>
      )}

      {loading ? (
        <div className="text-center py-4 text-gray-500">Loading...</div>
      ) : copies.length === 0 && !showAddForm ? (
        <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-gray-500 mb-3">No physical copies yet</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition text-sm"
          >
            + Add Your First Copy
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {copies.map((copy) => (
            <div key={copy.id} className="border rounded-lg bg-white overflow-hidden">
              {editingId === copy.id ? (
                <div className="p-4">
                  <h4 className="font-bold mb-3">Edit Copy</h4>
                  <CopyForm
                    initial={copy}
                    onSave={(data) => handleEdit(copy.id, data)}
                    onCancel={() => setEditingId(null)}
                    saving={saving}
                  />
                </div>
              ) : (
                <div className="p-4 flex gap-4">
                  {copy.coverImageUrl && (
                    <div className="flex-shrink-0">
                      <img
                        src={copy.coverImageUrl}
                        alt="Physical copy cover"
                        className="w-24 h-32 object-cover rounded shadow"
                      />
                    </div>
                  )}

                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded font-medium text-sm">
                          {FORMAT_LABELS[copy.format] || copy.format}
                        </span>
                        {copy.language && (
                          <span className="text-sm bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded">
                            {copy.language}
                          </span>
                        )}
                        {copy.edition && (
                          <span className="text-sm text-gray-600">• {copy.edition}</span>
                        )}
                        {copy.region && (
                          <span className="text-sm text-gray-500">• {copy.region}</span>
                        )}
                        {copy.condition && (
                          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                            {copy.condition}
                          </span>
                        )}
                        {copy.status === 'PENDING' && (
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded font-medium">
                            Pending
                          </span>
                        )}
                      </div>
                      {canEdit && (
                        <div className="flex gap-2 ml-2 flex-shrink-0">
                          <button
                            onClick={() => { setEditingId(copy.id); setShowAddForm(false); }}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(copy.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="grid md:grid-cols-2 gap-1 text-sm text-gray-700">
                      {copy.distributor && <div><span className="font-medium">Distributor:</span> {copy.distributor}</div>}
                      {copy.language && <div><span className="font-medium">Language:</span> {copy.language}</div>}
                      {copy.location && <div><span className="font-medium">Location:</span> {copy.location}</div>}
                      {copy.upc && <div><span className="font-medium">UPC:</span> {copy.upc}</div>}
                      {copy.ean && <div><span className="font-medium">EAN:</span> {copy.ean}</div>}
                      {copy.asin && <div><span className="font-medium">ASIN:</span> {copy.asin}</div>}
                      {copy.purchasePrice != null && (
                        <div><span className="font-medium">Price:</span> ${copy.purchasePrice.toFixed(2)}</div>
                      )}
                      {copy.releaseDate && (
                        <div><span className="font-medium">Released:</span> {new Date(copy.releaseDate).toLocaleDateString()}</div>
                      )}
                      {copy.purchaseDate && (
                        <div><span className="font-medium">Purchased:</span> {new Date(copy.purchaseDate).toLocaleDateString()}</div>
                      )}
                    </div>

                    {copy.notes && (
                      <div className="mt-2 text-sm text-gray-600 italic">{copy.notes}</div>
                    )}
                  </div>
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
