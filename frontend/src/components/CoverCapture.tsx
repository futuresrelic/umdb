import { useState, useRef, useEffect, useCallback } from 'react';
import api from '../services/api';

interface ImageMeta {
  id: string;
  src: string;
  altText?: string;
  imageType: string;
  isPrimary: boolean;
  uploadedById?: string;
  uploadedBy?: { id: string; name: string };
}

interface Props {
  movieId?: string;
  physicalCopyId?: string;
  currentUserId?: string;
  isAdmin?: boolean;
  onPrimaryChange?: (src: string) => void;
}

interface Adjustments {
  brightness: number;  // 0–200 (100 = normal)
  contrast: number;
  saturation: number;
  rotation: number;    // 0, 90, 180, 270
}

const DEFAULT_ADJ: Adjustments = { brightness: 100, contrast: 100, saturation: 100, rotation: 0 };

// ─── Canvas helpers ───────────────────────────────────────────────────────────

function applyAdjustments(img: HTMLImageElement, adj: Adjustments, crop: CropRect | null): string {
  const canvas = document.createElement('canvas');
  const rotated = adj.rotation === 90 || adj.rotation === 270;

  const srcW = img.naturalWidth;
  const srcH = img.naturalHeight;

  // Determine effective crop region in natural image coordinates
  const cx = crop ? Math.round(crop.x * srcW) : 0;
  const cy = crop ? Math.round(crop.y * srcH) : 0;
  const cw = crop ? Math.round(crop.w * srcW) : srcW;
  const ch = crop ? Math.round(crop.h * srcH) : srcH;

  canvas.width = rotated ? ch : cw;
  canvas.height = rotated ? cw : ch;

  const ctx = canvas.getContext('2d')!;
  ctx.filter = `brightness(${adj.brightness}%) contrast(${adj.contrast}%) saturate(${adj.saturation}%)`;

  if (adj.rotation !== 0) {
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((adj.rotation * Math.PI) / 180);
    ctx.drawImage(img, cx, cy, cw, ch, -cw / 2, -ch / 2, cw, ch);
  } else {
    ctx.drawImage(img, cx, cy, cw, ch, 0, 0, cw, ch);
  }

  return canvas.toDataURL('image/jpeg', 0.85);
}

interface CropRect { x: number; y: number; w: number; h: number } // 0–1 normalised

// ─── Crop overlay ─────────────────────────────────────────────────────────────

function CropOverlay({ onCrop }: { onCrop: (rect: CropRect | null) => void }) {
  const [dragging, setDragging] = useState(false);
  const [start, setStart] = useState({ x: 0, y: 0 });
  const [rect, setRect] = useState<CropRect | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const getRelative = (e: React.MouseEvent | React.TouchEvent) => {
    const el = containerRef.current!;
    const bounds = el.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    return {
      x: Math.max(0, Math.min(1, (clientX - bounds.left) / bounds.width)),
      y: Math.max(0, Math.min(1, (clientY - bounds.top) / bounds.height)),
    };
  };

  const onDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const pos = getRelative(e);
    setStart(pos);
    setRect(null);
    setDragging(true);
  };

  const onMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!dragging) return;
    const el = containerRef.current!;
    const bounds = el.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
    const ex = Math.max(0, Math.min(1, (clientX - bounds.left) / bounds.width));
    const ey = Math.max(0, Math.min(1, (clientY - bounds.top) / bounds.height));
    const r = {
      x: Math.min(start.x, ex), y: Math.min(start.y, ey),
      w: Math.abs(ex - start.x),  h: Math.abs(ey - start.y),
    };
    setRect(r);
  }, [dragging, start]);

  const onUp = useCallback(() => {
    setDragging(false);
    if (rect && rect.w > 0.02 && rect.h > 0.02) onCrop(rect);
    else onCrop(null);
  }, [dragging, rect, onCrop]);

  useEffect(() => {
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove);
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, [onMove, onUp]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 cursor-crosshair select-none"
      onMouseDown={onDown}
      onTouchStart={onDown}
    >
      {rect && (
        <div
          className="absolute border-2 border-white shadow-lg pointer-events-none"
          style={{
            left: `${rect.x * 100}%`, top: `${rect.y * 100}%`,
            width: `${rect.w * 100}%`, height: `${rect.h * 100}%`,
            background: 'rgba(255,255,255,0.08)',
          }}
        />
      )}
      {!rect && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-white text-xs bg-black bg-opacity-50 px-2 py-1 rounded">
            Drag to crop
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function CoverCapture({ movieId, physicalCopyId, currentUserId, isAdmin, onPrimaryChange }: Props) {
  const [open, setOpen] = useState(false);
  const [images, setImages] = useState<ImageMeta[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);

  // Editor state
  const [rawSrc, setRawSrc] = useState<string | null>(null);
  const [adj, setAdj] = useState<Adjustments>(DEFAULT_ADJ);
  const [crop, setCrop] = useState<CropRect | null>(null);
  const [cropping, setCropping] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [altText, setAltText] = useState('');
  const [imageType, setImageType] = useState<'POSTER' | 'COVER_PHOTO' | 'SNAPSHOT'>('POSTER');
  const [isPrimary, setIsPrimary] = useState(false);

  const imgRef = useRef<HTMLImageElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadImages = async () => {
    if (!movieId && !physicalCopyId) return;
    setLoadingImages(true);
    try {
      const url = movieId ? `/api/images/movie/${movieId}` : `/api/images/copy/${physicalCopyId}`;
      const res = await api.get(url);
      setImages(res.data);
    } catch { /* ignore */ } finally {
      setLoadingImages(false);
    }
  };

  useEffect(() => { if (open) loadImages(); }, [open]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setRawSrc(ev.target?.result as string);
      setAdj(DEFAULT_ADJ);
      setCrop(null);
      setPreview(null);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const buildPreview = useCallback(() => {
    if (!imgRef.current) return;
    const result = applyAdjustments(imgRef.current, adj, crop);
    setPreview(result);
  }, [adj, crop]);

  const handleSave = async () => {
    if (!preview) return;
    setSaving(true);
    try {
      await api.post('/api/images', {
        dataUrl: preview,
        imageType,
        altText: altText || undefined,
        movieId: movieId || undefined,
        physicalCopyId: physicalCopyId || undefined,
        isPrimary,
      });
      setRawSrc(null);
      setPreview(null);
      await loadImages();
      if (isPrimary && onPrimaryChange) onPrimaryChange(preview);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save image');
    } finally {
      setSaving(false);
    }
  };

  const canEdit = (img: ImageMeta) =>
    isAdmin || (currentUserId && img.uploadedById === currentUserId);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this image?')) return;
    try {
      await api.delete(`/api/images/${id}`);
      loadImages();
    } catch { alert('Delete failed'); }
  };

  const handleSetPrimary = async (id: string, src: string) => {
    try {
      await api.put(`/api/images/${id}`, { isPrimary: true });
      loadImages();
      if (onPrimaryChange) onPrimaryChange(src);
    } catch { alert('Failed to set as primary'); }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-sm bg-purple-600 text-white px-3 py-1.5 rounded hover:bg-purple-700 transition"
      >
        📷 Photos ({images.length})
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="text-lg font-bold">Cover Photos</h2>
          <button onClick={() => { setOpen(false); setRawSrc(null); setPreview(null); }}
            className="text-gray-400 hover:text-gray-700 text-2xl leading-none">&times;</button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-5">

          {/* Add new photo */}
          {!rawSrc && (
            <div>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <p className="text-gray-500 mb-3">Snap a cover photo or upload an image</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => { if (fileRef.current) { fileRef.current.setAttribute('capture', 'environment'); fileRef.current.click(); } }}
                    className="flex items-center gap-2 justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                  >
                    📷 Use Camera
                  </button>
                  <button
                    onClick={() => { if (fileRef.current) { fileRef.current.removeAttribute('capture'); fileRef.current.click(); } }}
                    className="flex items-center gap-2 justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    🖼️ Upload Image
                  </button>
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
              </div>
            </div>
          )}

          {/* Editor */}
          {rawSrc && (
            <div className="space-y-4">
              <div className="relative bg-black rounded-lg overflow-hidden" style={{ maxHeight: '320px' }}>
                <img
                  ref={imgRef}
                  src={rawSrc}
                  alt="Edit preview"
                  className="w-full h-full object-contain max-h-80"
                  style={{
                    filter: `brightness(${adj.brightness}%) contrast(${adj.contrast}%) saturate(${adj.saturation}%)`,
                    transform: `rotate(${adj.rotation}deg)`,
                    transition: 'filter 0.1s',
                  }}
                />
                {cropping && <CropOverlay onCrop={(r) => { setCrop(r); setCropping(false); }} />}
              </div>

              {/* Controls */}
              <div className="grid grid-cols-1 gap-3 text-sm">
                <div className="flex items-center gap-3">
                  <label className="w-24 text-gray-600">Brightness</label>
                  <input type="range" min={50} max={150} value={adj.brightness}
                    onChange={e => setAdj(a => ({ ...a, brightness: +e.target.value }))}
                    className="flex-1" />
                  <span className="w-8 text-right text-gray-500">{adj.brightness}</span>
                </div>
                <div className="flex items-center gap-3">
                  <label className="w-24 text-gray-600">Contrast</label>
                  <input type="range" min={50} max={150} value={adj.contrast}
                    onChange={e => setAdj(a => ({ ...a, contrast: +e.target.value }))}
                    className="flex-1" />
                  <span className="w-8 text-right text-gray-500">{adj.contrast}</span>
                </div>
                <div className="flex items-center gap-3">
                  <label className="w-24 text-gray-600">Saturation</label>
                  <input type="range" min={0} max={200} value={adj.saturation}
                    onChange={e => setAdj(a => ({ ...a, saturation: +e.target.value }))}
                    className="flex-1" />
                  <span className="w-8 text-right text-gray-500">{adj.saturation}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button onClick={() => setAdj(a => ({ ...a, rotation: (a.rotation + 90) % 360 }))}
                  className="px-3 py-1.5 border rounded text-sm hover:bg-gray-50">↻ Rotate</button>
                <button onClick={() => setCropping(!cropping)}
                  className={`px-3 py-1.5 border rounded text-sm ${cropping ? 'bg-yellow-100 border-yellow-400' : 'hover:bg-gray-50'}`}>
                  ✂️ {crop ? 'Re-crop' : 'Crop'}
                </button>
                {crop && <button onClick={() => setCrop(null)}
                  className="px-3 py-1.5 border rounded text-sm text-red-600 hover:bg-red-50">✕ Clear crop</button>}
                <button onClick={() => setAdj(DEFAULT_ADJ)}
                  className="px-3 py-1.5 border rounded text-sm hover:bg-gray-50">↺ Reset</button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <select value={imageType} onChange={e => setImageType(e.target.value as any)}
                    className="w-full border rounded px-3 py-2 text-sm">
                    <option value="POSTER">Poster</option>
                    <option value="COVER_PHOTO">Cover Photo</option>
                    <option value="SNAPSHOT">Snapshot</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description (optional)</label>
                  <input type="text" value={altText} onChange={e => setAltText(e.target.value)}
                    placeholder="e.g. French VHS front cover"
                    className="w-full border rounded px-3 py-2 text-sm" />
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={isPrimary} onChange={e => setIsPrimary(e.target.checked)} />
                Set as primary poster for this title
              </label>

              <div className="flex gap-3">
                <button onClick={buildPreview}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition text-sm">
                  Preview Result
                </button>
                <button onClick={() => { setRawSrc(null); setPreview(null); setCrop(null); setAdj(DEFAULT_ADJ); }}
                  className="px-4 py-2 border rounded hover:bg-gray-50 transition text-sm">
                  Cancel
                </button>
              </div>

              {preview && (
                <div className="border rounded-lg p-3 bg-gray-50">
                  <p className="text-sm font-medium mb-2 text-gray-700">Preview:</p>
                  <img src={preview} alt="Preview" className="max-h-48 mx-auto rounded shadow" />
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="mt-3 w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400 transition text-sm"
                  >
                    {saving ? 'Saving…' : '✓ Save Image'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Gallery */}
          {loadingImages ? (
            <div className="text-center text-gray-400 py-4">Loading…</div>
          ) : images.length > 0 ? (
            <div>
              <h3 className="font-semibold text-sm text-gray-700 mb-2">Saved Images</h3>
              <div className="grid grid-cols-3 gap-2">
                {images.map(img => (
                  <div key={img.id} className="relative group rounded overflow-hidden border bg-gray-50">
                    <img src={img.src} alt={img.altText || img.imageType} className="w-full aspect-[2/3] object-cover" />
                    {img.isPrimary && (
                      <span className="absolute top-1 left-1 text-xs bg-yellow-400 text-yellow-900 px-1.5 py-0.5 rounded font-medium">
                        Primary
                      </span>
                    )}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition flex items-end justify-center gap-1 p-1 opacity-0 group-hover:opacity-100">
                      {!img.isPrimary && (
                        <button
                          onClick={() => handleSetPrimary(img.id, img.src)}
                          className="text-xs bg-yellow-400 text-yellow-900 px-2 py-1 rounded"
                        >★</button>
                      )}
                      {canEdit(img) && (
                        <button
                          onClick={() => handleDelete(img.id)}
                          className="text-xs bg-red-600 text-white px-2 py-1 rounded"
                        >🗑</button>
                      )}
                    </div>
                    {img.altText && (
                      <p className="text-xs text-gray-500 px-1 py-0.5 truncate">{img.altText}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : !rawSrc ? (
            <p className="text-center text-gray-400 text-sm">No images yet</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
