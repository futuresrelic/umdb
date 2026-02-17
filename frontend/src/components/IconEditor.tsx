/**
 * IconEditor — Admin tool to design + export PWA app icons.
 *
 * Features:
 *  • Upload PNG / JPG / SVG source image
 *  • Square-enforced crop (drag to offset, scroll/slider to zoom)
 *  • Adjustments: brightness, contrast, saturation, hue-rotate, opacity
 *  • Background: colour + opacity (transparent by default)
 *  • Padding / safe-zone (0-40% — for maskable icon compliance)
 *  • Rotation: 0 / 90 / 180 / 270 °
 *  • Live previews: 16, 32, 64, 128, 192, 512 px
 *  • Saves all icon variants (favicon 32, 192, 512, apple-touch 180) to UMDB
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import api from '../services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Adj {
  brightness: number;   // 50–200  (100 = normal)
  contrast:   number;   // 50–200
  saturation: number;   // 0–200
  hue:        number;   // 0–360 (degrees)
  opacity:    number;   // 0–100
  rotation:   number;   // 0 | 90 | 180 | 270
}

interface Bg {
  enabled: boolean;
  color:   string;   // hex
  opacity: number;   // 0–100
}

interface Crop {
  offsetX: number;   // fractional, -1..1 from centre
  offsetY: number;
  zoom:    number;   // 1 = fit, >1 = zoomed in
}

const DEFAULT_ADJ: Adj = { brightness: 100, contrast: 100, saturation: 100, hue: 0, opacity: 100, rotation: 0 };
const DEFAULT_BG:  Bg  = { enabled: false, color: '#111827', opacity: 100 };
const DEFAULT_CROP: Crop = { offsetX: 0, offsetY: 0, zoom: 1 };

// Preview sizes to show
const PREVIEW_SIZES = [16, 32, 64, 128, 192, 512];

// ─── Canvas rendering ─────────────────────────────────────────────────────────

function renderIcon(
  img: HTMLImageElement | null,
  adj: Adj,
  bg: Bg,
  crop: Crop,
  padding: number,
  size: number
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width  = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Background layer
  if (bg.enabled) {
    ctx.save();
    ctx.globalAlpha = bg.opacity / 100;
    ctx.fillStyle   = bg.color;
    ctx.fillRect(0, 0, size, size);
    ctx.restore();
  }

  if (!img) return canvas;

  // Safe-zone draw area
  const pad      = (size * padding) / 100;
  const drawSize = size - pad * 2;

  // Zoom & offset
  const zoomed = drawSize * crop.zoom;
  const dx     = pad + (drawSize - zoomed) / 2 + crop.offsetX * drawSize;
  const dy     = pad + (drawSize - zoomed) / 2 + crop.offsetY * drawSize;

  ctx.save();

  // Apply adjustments via CSS filter
  const filters: string[] = [
    `brightness(${adj.brightness}%)`,
    `contrast(${adj.contrast}%)`,
    `saturate(${adj.saturation}%)`,
    `hue-rotate(${adj.hue}deg)`,
  ];
  ctx.filter = filters.join(' ');
  ctx.globalAlpha = adj.opacity / 100;

  // Rotation around centre
  if (adj.rotation !== 0) {
    ctx.translate(size / 2, size / 2);
    ctx.rotate((adj.rotation * Math.PI) / 180);
    ctx.drawImage(img, -zoomed / 2, -zoomed / 2, zoomed, zoomed);
  } else {
    ctx.drawImage(img, dx, dy, zoomed, zoomed);
  }

  ctx.restore();
  return canvas;
}

// ─── Slider helper ────────────────────────────────────────────────────────────

function Slider({
  label, value, min, max, step = 1, unit = '',
  onChange, onReset,
}: {
  label: string; value: number; min: number; max: number; step?: number; unit?: string;
  onChange: (v: number) => void; onReset?: () => void;
}) {
  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1">
        <label className="text-xs font-medium text-gray-600">{label}</label>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 tabular-nums w-12 text-right">
            {value}{unit}
          </span>
          {onReset && (
            <button
              onClick={onReset}
              className="text-xs text-blue-500 hover:text-blue-700 leading-none"
              title="Reset"
            >↺</button>
          )}
        </div>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded appearance-none bg-gray-200 accent-blue-600"
      />
    </div>
  );
}

// ─── Preview canvas ───────────────────────────────────────────────────────────

function PreviewCanvas({
  img, adj, bg, crop, padding, size,
}: {
  img: HTMLImageElement | null;
  adj: Adj; bg: Bg; crop: Crop; padding: number; size: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const src = renderIcon(img, adj, bg, crop, padding, size);
    ctx.clearRect(0, 0, size, size);
    ctx.drawImage(src, 0, 0);
  }, [img, adj, bg, crop, padding, size]);

  return (
    <canvas
      ref={ref}
      width={size}
      height={size}
      className="rounded"
      style={{
        width: Math.min(size, 64),
        height: Math.min(size, 64),
        imageRendering: size <= 32 ? 'pixelated' : 'auto',
        // Checkerboard to show transparency
        background:
          'repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 0 0 / 8px 8px',
      }}
    />
  );
}

// ─── Draggable large preview ───────────────────────────────────────────────────

function DraggablePreview({
  img, adj, bg, crop, padding, onCropChange,
}: {
  img: HTMLImageElement | null;
  adj: Adj; bg: Bg; crop: Crop; padding: number;
  onCropChange: (c: Crop) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const SIZE = 256;
  const dragging = useRef(false);
  const lastPos  = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const src = renderIcon(img, adj, bg, crop, padding, SIZE);
    ctx.clearRect(0, 0, SIZE, SIZE);
    ctx.drawImage(src, 0, 0);
  }, [img, adj, bg, crop, padding]);

  const onMouseDown = (e: React.MouseEvent) => {
    dragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
  };

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging.current) return;
    const dx = (e.clientX - lastPos.current.x) / SIZE;
    const dy = (e.clientY - lastPos.current.y) / SIZE;
    lastPos.current = { x: e.clientX, y: e.clientY };
    onCropChange({
      ...crop,
      offsetX: Math.max(-1, Math.min(1, crop.offsetX + dx)),
      offsetY: Math.max(-1, Math.min(1, crop.offsetY + dy)),
    });
  }, [crop, onCropChange]);

  const onMouseUp = () => { dragging.current = false; };

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [onMouseMove]);

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.1 : -0.1;
    onCropChange({ ...crop, zoom: Math.max(0.5, Math.min(4, crop.zoom + delta)) });
  };

  return (
    <canvas
      ref={canvasRef}
      width={SIZE}
      height={SIZE}
      onMouseDown={onMouseDown}
      onWheel={onWheel}
      className="rounded-xl border-2 border-dashed border-gray-300 cursor-move select-none"
      style={{
        background: 'repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 0 0 / 12px 12px',
      }}
      title="Drag to reposition • Scroll to zoom"
    />
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function IconEditor() {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [adj, setAdj] = useState<Adj>(DEFAULT_ADJ);
  const [bg,  setBg]  = useState<Bg>(DEFAULT_BG);
  const [crop, setCrop] = useState<Crop>(DEFAULT_CROP);
  const [padding, setPadding] = useState(10);
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [error,  setError]  = useState<string | null>(null);
  const [currentIcons, setCurrentIcons] = useState<Record<string, string | null>>({});

  // Load existing icons on mount
  useEffect(() => {
    api.get('/api/icons/settings/all')
      .then(r => setCurrentIcons(r.data))
      .catch(() => {/* not critical */});
  }, []);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => { setImg(image); setCrop(DEFAULT_CROP); };
    image.src = url;
  };

  const patchAdj = (partial: Partial<Adj>) => setAdj(a => ({ ...a, ...partial }));

  const handleSaveAll = async () => {
    if (!img && !bg.enabled) {
      setError('Please upload an image or enable a background colour first.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const sizes: [string, number][] = [
        ['icon_favicon', 32],
        ['icon_192',     192],
        ['icon_512',     512],
        ['icon_apple',   180],
      ];
      const body: Record<string, string> = {};
      for (const [key, size] of sizes) {
        const canvas = renderIcon(img, adj, bg, crop, padding, size);
        body[key] = canvas.toDataURL('image/png');
      }
      await api.put('/api/icons/settings/all', body);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      // Reload so the nav favicon updates
      const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
      if (link) link.href = `/api/icons/favicon.png?t=${Date.now()}`;
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const setRotation = (r: number) => patchAdj({ rotation: ((r % 360) + 360) % 360 });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">App Icons</h2>
        <p className="text-sm text-gray-500 mt-1">
          Design your favicon and PWA icons. Drag the preview to reposition, scroll to zoom.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* ── Left: Upload + large preview ── */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Source image</label>
            <label className="cursor-pointer flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-blue-400 transition">
              <span className="text-3xl mb-2">🖼</span>
              <span className="text-sm text-gray-600">{img ? 'Replace image' : 'Upload PNG / JPG / SVG'}</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
            </label>
          </div>

          <div className="flex flex-col items-center gap-3">
            <DraggablePreview
              img={img} adj={adj} bg={bg} crop={crop} padding={padding}
              onCropChange={setCrop}
            />
            <div className="flex gap-2 text-xs text-gray-500 items-center">
              <span>Zoom: {crop.zoom.toFixed(2)}×</span>
              <input
                type="range" min={0.5} max={4} step={0.05} value={crop.zoom}
                onChange={e => setCrop(c => ({ ...c, zoom: Number(e.target.value) }))}
                className="w-28 accent-blue-600"
              />
              <button
                onClick={() => setCrop(DEFAULT_CROP)}
                className="text-blue-500 hover:text-blue-700"
              >Reset ↺</button>
            </div>
          </div>
        </div>

        {/* ── Centre: Adjustments ── */}
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Image Adjustments</h3>

            <Slider label="Brightness" value={adj.brightness} min={50} max={200} unit="%"
              onChange={v => patchAdj({ brightness: v })} onReset={() => patchAdj({ brightness: 100 })} />
            <Slider label="Contrast" value={adj.contrast} min={50} max={200} unit="%"
              onChange={v => patchAdj({ contrast: v })} onReset={() => patchAdj({ contrast: 100 })} />
            <Slider label="Saturation" value={adj.saturation} min={0} max={200} unit="%"
              onChange={v => patchAdj({ saturation: v })} onReset={() => patchAdj({ saturation: 100 })} />
            <Slider label="Hue Rotate" value={adj.hue} min={0} max={360} unit="°"
              onChange={v => patchAdj({ hue: v })} onReset={() => patchAdj({ hue: 0 })} />
            <Slider label="Opacity" value={adj.opacity} min={0} max={100} unit="%"
              onChange={v => patchAdj({ opacity: v })} onReset={() => patchAdj({ opacity: 100 })} />

            <div className="mt-4 pt-3 border-t border-gray-200">
              <label className="text-xs font-medium text-gray-600 block mb-2">Rotation</label>
              <div className="flex gap-2">
                {[0, 90, 180, 270].map(r => (
                  <button
                    key={r}
                    onClick={() => setRotation(r)}
                    className={`flex-1 py-1.5 text-xs rounded border transition ${
                      adj.rotation === r
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 text-gray-600 hover:border-blue-400'
                    }`}
                  >{r}°</button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Background</h3>

            <label className="flex items-center gap-2 mb-3 cursor-pointer">
              <input
                type="checkbox" checked={bg.enabled}
                onChange={e => setBg(b => ({ ...b, enabled: e.target.checked }))}
                className="rounded accent-blue-600"
              />
              <span className="text-sm text-gray-700">Add background colour</span>
            </label>

            {bg.enabled && (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    type="color" value={bg.color}
                    onChange={e => setBg(b => ({ ...b, color: e.target.value }))}
                    className="w-10 h-10 rounded cursor-pointer border border-gray-300"
                    title="Background colour"
                  />
                  <span className="text-sm font-mono text-gray-600">{bg.color}</span>
                </div>
                <Slider label="Background opacity" value={bg.opacity} min={0} max={100} unit="%"
                  onChange={v => setBg(b => ({ ...b, opacity: v }))} />
              </div>
            )}
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <Slider
              label="Padding / safe zone"
              value={padding} min={0} max={40} unit="%"
              onChange={setPadding}
              onReset={() => setPadding(10)}
            />
            <p className="text-xs text-gray-400 mt-1">
              10 % recommended for maskable PWA icons.
            </p>
          </div>
        </div>

        {/* ── Right: Previews + save ── */}
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Live Previews</h3>
            <div className="space-y-3">
              {PREVIEW_SIZES.map(sz => (
                <div key={sz} className="flex items-center gap-3">
                  <PreviewCanvas img={img} adj={adj} bg={bg} crop={crop} padding={padding} size={sz} />
                  <span className="text-xs text-gray-500">{sz}×{sz}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Current icons */}
          {Object.values(currentIcons).some(v => v !== null) && (
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Current saved icons</h3>
              <div className="flex flex-wrap gap-3">
                {(['icon_favicon', 'icon_192', 'icon_512', 'icon_apple'] as const).map(key => {
                  const v = currentIcons[key];
                  if (!v) return null;
                  const labels: Record<string, string> = {
                    icon_favicon: '32px (favicon)',
                    icon_192:     '192px',
                    icon_512:     '512px',
                    icon_apple:   '180px (Apple)',
                  };
                  return (
                    <div key={key} className="flex flex-col items-center gap-1">
                      <img
                        src={v}
                        alt={labels[key]}
                        className="w-10 h-10 rounded"
                        style={{ background: 'repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 0 0 / 8px 8px' }}
                      />
                      <span className="text-[10px] text-gray-400">{labels[key]}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            onClick={handleSaveAll}
            disabled={saving}
            className={`w-full py-3 rounded-xl font-semibold text-sm transition ${
              saved
                ? 'bg-green-600 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50'
            }`}
          >
            {saving ? 'Saving…' : saved ? '✓ Icons saved!' : 'Save all icon sizes'}
          </button>
          <p className="text-xs text-gray-400 text-center">
            Saves favicon (32px), 192px, 512px, and Apple touch (180px) to the database.
            Refresh to see the updated favicon.
          </p>
        </div>
      </div>
    </div>
  );
}
