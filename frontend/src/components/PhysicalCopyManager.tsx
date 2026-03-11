import { useState, useEffect } from 'react';
import api from '../services/api';

interface Movie {
  id: string;
  title: string;
  year: number;
}

interface PhysicalCopy {
  id: string;
  format: string;
  isSuper?: boolean;
  editionName?: string;
  packageType?: string;
  language?: string;
  region?: string;
  videoStandard?: string;
  country?: string;
  edition?: string;
  discCount?: number;
  components?: {
    packageTypes?: string[];
    includedItems?: string[];
    colors?: string[];
  };
  audioFormats?: string[];
  subtitles?: string[];
  copyProtected?: boolean;
  bonusContent?: string;
  studio?: string;
  editionPublisher?: string;
  distributor?: string;
  releaseDate?: string;
  upc?: string;
  ean?: string;
  asin?: string;
  coverImageUrl?: string;
  notes?: string;
  status?: string;
}

interface Props {
  movieId: string;
  canEdit?: boolean;
}

const FORMATS = [
  'DVD', 'BLU_RAY', 'BLU_RAY_4K', 'VHS', 'LASERDISC', 'BETAMAX', 'HD_DVD',
  'DIGITAL', 'STREAMING', 'CD', 'VINYL', 'CASSETTE', 'EIGHT_TRACK', 'MINI_DISC',
  'FILM_8MM', 'FILM_16MM', 'FILM_35MM', 'FILM_70MM', 'OTHER'
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
  FILM_8MM: '8mm Film',
  FILM_16MM: '16mm Film',
  FILM_35MM: '35mm Film',
  FILM_70MM: '70mm Film',
  OTHER: 'Other'
};

const FILM_FORMATS = ['FILM_8MM', 'FILM_16MM', 'FILM_35MM', 'FILM_70MM'];

const EDITION_TYPES = [
  'Normal',
  'Special Edition',
  'Ultimate Edition',
  'Complete Edition',
  'Anniversary Edition',
  'Oscar Winners Edition',
  "Collector's Edition",
  'Criterion Collection',
  "Director's Cut",
  'Extended Cut',
  'Theatrical Cut',
  'Unrated',
  'Limited Edition',
  'Deluxe Edition',
  'Other'
];

const PACKAGE_TYPES = [
  'Slipbox',
  'Steelbook',
  'Snapcase',
  'Lockcase',
  'Tincase',
  'Digipak',
  'Amaray Case',
  'Keep Case',
  'Jewel Case',
  'Paper Sleeve',
  'Boxset',
  'Clamshell'
];

const INCLUDED_ITEMS = [
  'Booklet',
  'Inlet/Insert',
  'Paper Ads',
  'Digital Code',
  'Bonus Disc',
  'Poster',
  'Art Cards',
  'Stickers',
  'Certificate'
];

const PACKAGE_COLORS = [
  'Black',
  'White',
  'Blue',
  'Red',
  'Green',
  'Yellow',
  'Clear',
  'Frosted',
  'Silver',
  'Gold',
  'Printed'
];

const AUDIO_FORMATS = [
  'Dolby Digital',
  'Dolby Digital Plus',
  'Dolby TrueHD',
  'Dolby Atmos',
  'DTS',
  'DTS-HD Master Audio',
  'DTS-HD High Resolution',
  'DTS:X',
  'THX',
  'PCM Stereo',
  'LPCM',
  'Mono',
  'Stereo'
];

const DVD_REGIONS = [
  'Region Free',
  'Region 0',
  'Region 1 (US/CA)',
  'Region 2 (EU/JP)',
  'Region 3 (SE Asia)',
  'Region 4 (AU/NZ/Latin America)',
  'Region 5 (Africa/India/Russia)',
  'Region 6 (China)',
  'Region A (Americas/East Asia)',
  'Region B (Europe/Africa/Oceania)',
  'Region C (Asia)'
];

const VIDEO_STANDARDS = [
  'NTSC',
  'PAL',
  'SECAM'
];

const COMMON_LANGUAGES = [
  'English',
  'French (France)',
  'French (Quebec)',
  'Spanish (Spain)',
  'Spanish (Latin America)',
  'German',
  'Italian',
  'Portuguese (Portugal)',
  'Portuguese (Brazil)',
  'Japanese',
  'Korean',
  'Mandarin Chinese',
  'Cantonese',
  'Russian',
  'Arabic',
  'Hindi',
  'Dutch',
  'Polish',
  'Swedish',
  'Norwegian',
  'Danish',
  'Finnish'
];

const COUNTRIES = [
  'US', 'CA', 'UK', 'FR', 'DE', 'IT', 'ES', 'JP', 'KR', 'CN', 'AU', 'NZ',
  'MX', 'BR', 'AR', 'RU', 'IN', 'NL', 'BE', 'CH', 'AT', 'SE', 'NO', 'DK', 'FI'
];

function MultiSelect({
  label,
  options,
  selected,
  onChange,
  placeholder
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}) {
  const [input, setInput] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const addItem = (item: string) => {
    if (!selected.includes(item)) {
      onChange([...selected, item]);
    }
    setInput('');
  };

  const removeItem = (item: string) => {
    onChange(selected.filter(i => i !== item));
  };

  const filteredOptions = options.filter(
    opt => opt.toLowerCase().includes(input.toLowerCase()) && !selected.includes(opt)
  );

  return (
    <div className="relative">
      <label className="block text-sm font-medium mb-1">{label}</label>
      <div className="border rounded px-3 py-2 min-h-[42px] flex flex-wrap gap-1 items-center">
        {selected.map(item => (
          <span key={item} className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-sm flex items-center gap-1">
            {item}
            <button
              type="button"
              onClick={() => removeItem(item)}
              className="text-blue-600 hover:text-blue-900 font-bold"
            >
              ×
            </button>
          </span>
        ))}
        <input
          type="text"
          value={input}
          onChange={(e) => { setInput(e.target.value); setShowDropdown(true); }}
          onFocus={() => setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          placeholder={selected.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] outline-none"
        />
      </div>
      {showDropdown && filteredOptions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border rounded shadow-lg max-h-48 overflow-y-auto">
          {filteredOptions.map(opt => (
            <button
              key={opt}
              type="button"
              onClick={() => addItem(opt)}
              className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CheckboxGroup({
  label,
  options,
  selected,
  onChange
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (values: string[]) => void;
}) {
  const toggle = (item: string) => {
    if (selected.includes(item)) {
      onChange(selected.filter(i => i !== item));
    } else {
      onChange([...selected, item]);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium mb-2">{label}</label>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {options.map(opt => (
          <label key={opt} className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={selected.includes(opt)}
              onChange={() => toggle(opt)}
              className="rounded"
            />
            <span>{opt}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function CopyForm({
  initial,
  movie,
  onSave,
  onCancel,
  saving
}: {
  initial: Partial<PhysicalCopy>;
  movie: Movie | null;
  onSave: (data: Partial<PhysicalCopy>) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<Partial<PhysicalCopy>>({
    ...initial,
    components: initial.components || { packageTypes: [], includedItems: [], colors: [] },
    audioFormats: initial.audioFormats || [],
    subtitles: initial.subtitles || []
  });
  const [fetching, setFetching] = useState(false);
  const [autoEditionName, setAutoEditionName] = useState(true);

  const set = (key: keyof PhysicalCopy, val: any) => setForm(f => ({ ...f, [key]: val }));
  const setComponent = (key: 'packageTypes' | 'includedItems' | 'colors', val: string[]) => {
    const newComponents = { ...form.components, [key]: val };
    setForm(f => ({ ...f, components: newComponents }));

    // Auto-update disc count when Bonus Disc is toggled
    if (key === 'includedItems') {
      const hasBonusDisc = val.includes('Bonus Disc');
      const oldHasBonusDisc = (form.components?.includedItems || []).includes('Bonus Disc');

      if (hasBonusDisc !== oldHasBonusDisc) {
        const currentCount = form.discCount || 1;
        setForm(f => ({
          ...f,
          components: newComponents,
          discCount: hasBonusDisc ? currentCount + 1 : Math.max(1, currentCount - 1)
        }));
      }
    }
  };

  const isFilmFormat = form.format && FILM_FORMATS.includes(form.format);

  // Auto-generate Edition Name: Film Name + Year + Package Type + Edition/Cut + Format
  const generateEditionName = () => {
    if (!movie || !autoEditionName) return form.editionName || '';

    const parts: string[] = [];

    // Film Name + Year
    parts.push(`${movie.title} (${movie.year})`);

    // Edition/Cut
    if (form.edition && form.edition !== 'Normal') {
      parts.push(form.edition);
    }

    // Format
    if (form.format) {
      let formatStr = FORMAT_LABELS[form.format] || form.format;
      if (form.isSuper && isFilmFormat) {
        formatStr = 'Super ' + formatStr;
      }
      parts.push(formatStr);
    }

    // Package Type (first selected)
    const packageTypes = form.components?.packageTypes || [];
    if (packageTypes.length > 0) {
      parts.push(packageTypes[0]);
    }

    return parts.join(' - ');
  };

  const computedEditionName = generateEditionName();

  // Fetch data from barcode
  const fetchFromBarcode = async () => {
    const barcode = form.upc || form.ean || form.asin;
    if (!barcode) {
      alert('Please enter a UPC, EAN, or ASIN first');
      return;
    }

    setFetching(true);
    try {
      // Try to fetch from backend API endpoint (to be implemented)
      const response = await api.get(`/physical-copies/fetch-barcode/${barcode}`);
      const data = response.data;

      // Merge fetched data with form
      if (data.audioFormats) set('audioFormats', data.audioFormats);
      if (data.country) set('country', data.country);
      if (data.distributor) set('distributor', data.distributor);
      if (data.releaseDate) set('releaseDate', data.releaseDate);
      if (data.studio) set('studio', data.studio);
      if (data.editionPublisher) set('editionPublisher', data.editionPublisher);
      if (data.discCount) set('discCount', data.discCount);
      if (data.subtitles) set('subtitles', data.subtitles);
      if (data.region) set('region', data.region);
      if (data.videoStandard) set('videoStandard', data.videoStandard);

      alert('Data fetched successfully!');
    } catch (error: any) {
      // For now, show a message that this feature is coming soon
      if (error.response?.status === 404) {
        alert('Barcode lookup service coming soon!\n\nFor now, please enter the data manually. Future updates will include:\n- Amazon Product API integration\n- DVD database lookups\n- Automated field population');
      } else {
        alert('No data found for this barcode. Please enter manually.');
      }
    } finally {
      setFetching(false);
    }
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave({ ...form, editionName: autoEditionName ? computedEditionName : form.editionName }); }} className="space-y-4">
      {/* Format Section */}
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

        {isFilmFormat && (
          <div className="flex items-center pt-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isSuper || false}
                onChange={(e) => set('isSuper', e.target.checked)}
                className="rounded"
              />
              <span className="text-sm font-medium">Super Format</span>
              <span className="text-xs text-gray-500">(Super 8, Super 16, etc.)</span>
            </label>
          </div>
        )}
      </div>

      {/* Edition Name - Auto-generated */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium">Edition Name</label>
          <label className="flex items-center gap-1 text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={autoEditionName}
              onChange={(e) => setAutoEditionName(e.target.checked)}
              className="rounded"
            />
            <span>Auto-generate</span>
          </label>
        </div>
        {autoEditionName ? (
          <div className="w-full border rounded px-3 py-2 bg-blue-50 text-blue-900 font-medium">
            {computedEditionName || 'Fill in fields below to auto-generate...'}
          </div>
        ) : (
          <input
            type="text"
            value={form.editionName || ""}
            onChange={(e) => set("editionName", e.target.value)}
            placeholder="e.g. Fight Club (1999) - Collector's Edition - DVD - Steelbook"
            className="w-full border rounded px-3 py-2"
          />
        )}
        <p className="text-xs text-gray-500 mt-1">
          Auto-generated from: Film Name + Year + Edition/Cut + Format + Package Type
        </p>
      </div>

      {/* Package Type Section */}
      <div className="border rounded-lg p-4 bg-gray-50">
        <h4 className="font-medium mb-3">Package Details</h4>
        <div className="space-y-3">
          <CheckboxGroup
            label="Package Types"
            options={PACKAGE_TYPES}
            selected={form.components?.packageTypes || []}
            onChange={(val) => setComponent('packageTypes', val)}
          />
          <CheckboxGroup
            label="Included Items"
            options={INCLUDED_ITEMS}
            selected={form.components?.includedItems || []}
            onChange={(val) => setComponent('includedItems', val)}
          />
          <CheckboxGroup
            label="Package Colors / Finish"
            options={PACKAGE_COLORS}
            selected={form.components?.colors || []}
            onChange={(val) => setComponent('colors', val)}
          />
        </div>
      </div>

      {/* Edition and Region */}
      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Edition / Cut</label>
          <select
            value={form.edition || ""}
            onChange={(e) => set("edition", e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            <option value="">-- Select --</option>
            {EDITION_TYPES.map(e => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">DVD/Blu-ray Region</label>
          <select
            value={form.region || ""}
            onChange={(e) => set("region", e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            <option value="">-- Select --</option>
            {DVD_REGIONS.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Video Standard (separate from Region) */}
      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Video Standard</label>
          <select
            value={form.videoStandard || ""}
            onChange={(e) => set("videoStandard", e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            <option value="">-- Select --</option>
            {VIDEO_STANDARDS.map(std => (
              <option key={std} value={std}>{std}</option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">Separate from region lock</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Disc / Tape Count</label>
          <input
            type="number"
            min="1"
            value={form.discCount ?? ""}
            onChange={(e) => set("discCount", e.target.value ? parseInt(e.target.value) : undefined)}
            placeholder="1"
            className="w-full border rounded px-3 py-2"
          />
          <p className="text-xs text-gray-500 mt-1">
            Auto-updates when you toggle "Bonus Disc"
          </p>
        </div>
      </div>

      {/* Languages and Subtitles */}
      <div className="grid md:grid-cols-2 gap-3">
        <MultiSelect
          label="Audio Language(s)"
          options={COMMON_LANGUAGES}
          selected={form.language ? form.language.split(', ') : []}
          onChange={(vals) => set('language', vals.join(', '))}
          placeholder="Type to search or add..."
        />

        <MultiSelect
          label="Subtitles"
          options={COMMON_LANGUAGES}
          selected={form.subtitles || []}
          onChange={(vals) => set('subtitles', vals)}
          placeholder="Type to search or add..."
        />
      </div>

      {/* Audio Formats */}
      <div>
        <CheckboxGroup
          label="Audio Formats"
          options={AUDIO_FORMATS}
          selected={form.audioFormats || []}
          onChange={(vals) => set('audioFormats', vals)}
        />
      </div>

      {/* Country */}
      <div>
        <MultiSelect
          label="Country/Countries of Release"
          options={COUNTRIES}
          selected={form.country ? form.country.split(', ') : []}
          onChange={(vals) => set('country', vals.join(', '))}
          placeholder="Type country code (e.g. US, CA, FR)..."
        />
      </div>

      {/* Distribution Details */}
      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Distributor</label>
          <input
            type="text"
            value={form.distributor || ""}
            onChange={(e) => set("distributor", e.target.value)}
            placeholder="e.g. 20th Century Fox Home Entertainment"
            className="w-full border rounded px-3 py-2"
            list="distributors"
          />
          <datalist id="distributors">
            <option value="20th Century Fox" />
            <option value="Universal Pictures" />
            <option value="Warner Bros." />
            <option value="Paramount Pictures" />
            <option value="Sony Pictures" />
            <option value="Walt Disney Studios" />
            <option value="Criterion Collection" />
            <option value="Arrow Video" />
            <option value="Shout! Factory" />
            <option value="Vinegar Syndrome" />
          </datalist>
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
      </div>

      {/* Studio and Publisher */}
      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Studio / Production</label>
          <input
            type="text"
            value={form.studio || ""}
            onChange={(e) => set("studio", e.target.value)}
            placeholder="e.g. Fox 2000 Pictures"
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Edition Publisher</label>
          <input
            type="text"
            value={form.editionPublisher || ""}
            onChange={(e) => set("editionPublisher", e.target.value)}
            placeholder="Publisher of this edition (if different from distributor)"
            className="w-full border rounded px-3 py-2"
          />
        </div>
      </div>

      {/* Barcodes with Fetch Button */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium">Barcodes & Identifiers</label>
          <button
            type="button"
            onClick={fetchFromBarcode}
            disabled={fetching || (!form.upc && !form.ean && !form.asin)}
            className="text-sm bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-1"
          >
            {fetching ? '🔄 Fetching...' : '🔍 Fetch Data from Barcode'}
          </button>
        </div>
        <div className="grid md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">UPC / Barcode</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={form.upc || ""}
                onChange={(e) => set("upc", e.target.value)}
                placeholder="12-digit barcode"
                className="flex-1 border rounded px-3 py-2"
              />
              <button
                type="button"
                className="px-3 py-2 border rounded hover:bg-gray-50 text-sm"
                title="Scan barcode (coming soon)"
              >
                📷
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">EAN</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={form.ean || ""}
                onChange={(e) => set("ean", e.target.value)}
                placeholder="European Article Number"
                className="flex-1 border rounded px-3 py-2"
              />
              <button
                type="button"
                className="px-3 py-2 border rounded hover:bg-gray-50 text-sm"
                title="Scan EAN (coming soon)"
              >
                📷
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">ASIN</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={form.asin || ""}
                onChange={(e) => set("asin", e.target.value)}
                placeholder="Amazon ASIN"
                className="flex-1 border rounded px-3 py-2"
              />
              <button
                type="button"
                className="px-3 py-2 border rounded hover:bg-gray-50 text-sm"
                title="Scan ASIN (coming soon)"
              >
                📷
              </button>
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          💡 Enter any barcode above, then click "Fetch Data" to auto-fill fields from external databases
        </p>
      </div>

      {/* Copy Protection */}
      <div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.copyProtected || false}
            onChange={(e) => set('copyProtected', e.target.checked)}
            className="rounded"
          />
          <span className="text-sm font-medium">Copy Protected</span>
          <span className="text-xs text-gray-500">(DRM, region lock, etc.)</span>
        </label>
      </div>

      {/* Bonus Content */}
      <div>
        <label className="block text-sm font-medium mb-1">Special / Bonus Disc Content</label>
        <textarea
          value={form.bonusContent || ""}
          onChange={(e) => set("bonusContent", e.target.value)}
          rows={4}
          placeholder="Describe bonus features, special content, documentaries, deleted scenes, commentaries, etc."
          className="w-full border rounded px-3 py-2"
        />
      </div>

      {/* Cover Image */}
      <div>
        <label className="block text-sm font-medium mb-1">Cover Image URL</label>
        <input
          type="url"
          value={form.coverImageUrl || ""}
          onChange={(e) => set("coverImageUrl", e.target.value)}
          placeholder="https://example.com/cover.jpg or upload your own scan"
          className="w-full border rounded px-3 py-2"
        />
        <p className="text-xs text-gray-500 mt-1">
          💡 Upload capability coming soon - you'll be able to scan/photograph your cover directly
        </p>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium mb-1">Notes</label>
        <textarea
          value={form.notes || ""}
          onChange={(e) => set("notes", e.target.value)}
          rows={3}
          placeholder="Any additional notes about this physical copy..."
          className="w-full border rounded px-3 py-2"
        />
      </div>

      {/* Buttons */}
      <div className="flex gap-2 pt-2">
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
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCopies();
    loadMovie();
  }, [movieId]);

  const loadMovie = async () => {
    try {
      const response = await api.get(`/movies/${movieId}`);
      setMovie({ id: response.data.id, title: response.data.title, year: response.data.year });
    } catch (error) {
      console.error("Failed to load movie:", error);
    }
  };

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
      const msg = error.response?.data?.message || error.message;
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
      const msg = error.response?.data?.message || error.message;
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
            movie={movie}
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
          {canEdit && (
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition text-sm"
            >
              + Add Your First Copy
            </button>
          )}
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
                    movie={movie}
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
                          {copy.isSuper && ' (Super)'}
                        </span>
                        {copy.language && (
                          <span className="text-sm bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded">
                            {copy.language}
                          </span>
                        )}
                        {copy.country && (
                          <span className="text-sm bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                            {copy.country}
                          </span>
                        )}
                        {copy.edition && (
                          <span className="text-sm text-gray-600">• {copy.edition}</span>
                        )}
                        {copy.region && (
                          <span className="text-sm text-gray-500">• {copy.region}</span>
                        )}
                        {copy.videoStandard && (
                          <span className="text-sm text-gray-500">• {copy.videoStandard}</span>
                        )}
                        {copy.copyProtected && (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                            🔒 Copy Protected
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

                    {copy.editionName && (
                      <div className="text-sm font-medium text-gray-800 mb-1">{copy.editionName}</div>
                    )}

                    {copy.components && (
                      <div className="mb-2 flex gap-2 flex-wrap text-xs">
                        {copy.components.packageTypes?.map(pt => (
                          <span key={pt} className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                            {pt}
                          </span>
                        ))}
                        {copy.components.includedItems?.map(item => (
                          <span key={item} className="bg-green-100 text-green-800 px-2 py-0.5 rounded">
                            ✓ {item}
                          </span>
                        ))}
                        {copy.components.colors?.map(color => (
                          <span key={color} className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                            🎨 {color}
                          </span>
                        ))}
                      </div>
                    )}

                    {copy.audioFormats && copy.audioFormats.length > 0 && (
                      <div className="mb-1 text-xs text-gray-600">
                        <span className="font-medium">Audio:</span> {copy.audioFormats.join(', ')}
                      </div>
                    )}

                    {copy.subtitles && copy.subtitles.length > 0 && (
                      <div className="mb-1 text-xs text-gray-600">
                        <span className="font-medium">Subtitles:</span> {copy.subtitles.join(', ')}
                      </div>
                    )}

                    <div className="grid md:grid-cols-2 gap-1 text-sm text-gray-700">
                      {copy.discCount != null && <div><span className="font-medium">Discs/Tapes:</span> {copy.discCount}</div>}
                      {copy.distributor && <div><span className="font-medium">Distributor:</span> {copy.distributor}</div>}
                      {copy.studio && <div><span className="font-medium">Studio:</span> {copy.studio}</div>}
                      {copy.editionPublisher && <div><span className="font-medium">Publisher:</span> {copy.editionPublisher}</div>}
                      {copy.upc && <div><span className="font-medium">UPC:</span> {copy.upc}</div>}
                      {copy.ean && <div><span className="font-medium">EAN:</span> {copy.ean}</div>}
                      {copy.asin && <div><span className="font-medium">ASIN:</span> {copy.asin}</div>}
                      {copy.releaseDate && (
                        <div><span className="font-medium">Released:</span> {new Date(copy.releaseDate).toLocaleDateString()}</div>
                      )}
                    </div>

                    {copy.bonusContent && (
                      <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                        <div className="font-medium text-blue-900 mb-1">Bonus Content:</div>
                        <div className="text-gray-700">{copy.bonusContent}</div>
                      </div>
                    )}

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
