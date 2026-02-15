import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { movieApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

function EditMoviePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    originalTitle: '',
    year: '' as string | number,
    runtime: '' as string | number,
    plot: '',
    tagline: '',
    language: '',
    country: '',
    posterUrl: '',
    backdropUrl: '',
    physicalFormat: '',
    distributor: '',
    upc: '',
    notes: '',
    rating: '' as string | number,
  });

  useEffect(() => {
    if (!id) return;
    movieApi.getById(id).then((movie) => {
      setFormData({
        title: movie.title || '',
        originalTitle: movie.originalTitle || '',
        year: movie.year ?? '',
        runtime: movie.runtime ?? '',
        plot: movie.plot || '',
        tagline: movie.tagline || '',
        language: movie.language || '',
        country: movie.country || '',
        posterUrl: movie.posterUrl || '',
        backdropUrl: movie.backdropUrl || '',
        physicalFormat: (movie as any).physicalFormat || '',
        distributor: (movie as any).distributor || '',
        upc: (movie as any).upc || '',
        notes: (movie as any).notes || '',
        rating: movie.rating ?? '',
      });
    }).catch(() => navigate('/browse'))
      .finally(() => setFetching(false));
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !formData.title.trim()) { alert('Title is required'); return; }

    try {
      setLoading(true);
      const dataToSubmit: any = { ...formData };
      if (dataToSubmit.year) dataToSubmit.year = parseInt(dataToSubmit.year);
      else dataToSubmit.year = null;
      if (dataToSubmit.runtime) dataToSubmit.runtime = parseInt(dataToSubmit.runtime);
      else dataToSubmit.runtime = null;
      if (dataToSubmit.rating) dataToSubmit.rating = parseFloat(dataToSubmit.rating);
      else dataToSubmit.rating = null;
      Object.keys(dataToSubmit).forEach((key) => {
        if (dataToSubmit[key] === '') dataToSubmit[key] = null;
      });
      await movieApi.update(id, dataToSubmit);
      navigate(`/movie/${id}`);
    } catch (error) {
      console.error('Failed to update movie:', error);
      alert('Failed to update movie');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <div className="max-w-4xl mx-auto px-4 py-8 text-center">Loading...</div>;
  }

  if (!user) {
    return <div className="max-w-4xl mx-auto px-4 py-8 text-center text-gray-600">Sign in to edit entries.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to={`/movie/${id}`} className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
        ← Back to Movie
      </Link>
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Edit Movie</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
            <input type="text" name="title" value={formData.title} onChange={handleChange} required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Original Title</label>
            <input type="text" name="originalTitle" value={formData.originalTitle} onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
            <input type="number" name="year" value={formData.year} onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Runtime (minutes)</label>
            <input type="number" name="runtime" value={formData.runtime} onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Tagline</label>
            <input type="text" name="tagline" value={formData.tagline} onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Plot</label>
            <textarea name="plot" value={formData.plot} onChange={handleChange} rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
            <input type="text" name="language" value={formData.language} onChange={handleChange}
              placeholder="French, English..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
            <input type="text" name="country" value={formData.country} onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Physical Format</label>
            <select name="physicalFormat" value={formData.physicalFormat} onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="">Select format</option>
              <option value="DVD">DVD</option>
              <option value="Blu-ray">Blu-ray</option>
              <option value="4K UHD">4K UHD</option>
              <option value="VHS">VHS</option>
              <option value="LaserDisc">LaserDisc</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Distributor</label>
            <input type="text" name="distributor" value={formData.distributor} onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">UPC Code</label>
            <input type="text" name="upc" value={formData.upc} onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Poster URL</label>
            <input type="url" name="posterUrl" value={formData.posterUrl} onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Rating (0–10)</label>
            <input type="number" name="rating" value={formData.rating} onChange={handleChange}
              min="0" max="10" step="0.1"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
            <textarea name="notes" value={formData.notes} onChange={handleChange} rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
        </div>

        <div className="mt-8 flex gap-4">
          <button type="submit" disabled={loading}
            className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400">
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
          <Link to={`/movie/${id}`}
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-center">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

export default EditMoviePage;
