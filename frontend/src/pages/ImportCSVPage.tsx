import { useState } from 'react';
import api from '../services/api';

function ImportCSVPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      alert('Please select a file first');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/csv/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setResult(response.data);
      setFile(null);
      // Reset file input
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error: any) {
      console.error('Upload failed:', error);
      alert(`Upload failed: ${error.response?.data?.message || error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const apiBase = import.meta.env.VITE_API_URL || '/api';
    window.open(`${apiBase}/csv/template`, '_blank');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Import Movies from CSV</h1>

      <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Upload CSV File</h2>
          <p className="text-gray-600 mb-4">
            Import multiple movies at once from a CSV file. The CSV should include columns
            like title, year, plot, etc.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-bold text-blue-900 mb-2">📋 Supported Columns</h3>
            <div className="text-sm text-blue-800 space-y-1">
              <p><strong>Required:</strong> title</p>
              <p><strong>Optional:</strong> originalTitle, year, runtime, plot, tagline, language, country,
                posterUrl, physicalFormat, distributor, upc, notes, rating</p>
            </div>
          </div>

          <button
            onClick={downloadTemplate}
            className="mb-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
          >
            📥 Download Example CSV Template
          </button>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select CSV File
          </label>
          <input
            id="file-input"
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
          />
          {file && (
            <p className="mt-2 text-sm text-gray-600">
              Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
            </p>
          )}
        </div>

        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {uploading ? 'Uploading...' : 'Upload and Import'}
        </button>
      </div>

      {result && (
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Import Results</h2>

          <div className="grid md:grid-cols-3 gap-6 mb-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-3xl font-bold text-green-600">{result.imported}</div>
              <div className="text-sm text-green-800">Movies Imported</div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="text-3xl font-bold text-yellow-600">{result.skipped}</div>
              <div className="text-sm text-yellow-800">Skipped (duplicates/errors)</div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-3xl font-bold text-blue-600">{result.total}</div>
              <div className="text-sm text-blue-800">Total Rows Processed</div>
            </div>
          </div>

          {result.errors && result.errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-bold text-red-900 mb-2">Errors</h3>
              <div className="text-sm text-red-800 space-y-2">
                {result.errors.map((err: any, idx: number) => (
                  <div key={idx} className="border-b border-red-100 pb-2">
                    <strong>Row {idx + 1}:</strong> {err.error}
                  </div>
                ))}
                {result.errors.length >= 10 && (
                  <p className="italic">Showing first 10 errors only...</p>
                )}
              </div>
            </div>
          )}

          {result.imported > 0 && (
            <div className="mt-6">
              <a
                href="/browse"
                className="inline-block bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition"
              >
                View Imported Movies
              </a>
            </div>
          )}
        </div>
      )}

      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">💡 Tips</h2>
        <ul className="space-y-2 text-gray-700">
          <li>• Download the template to see the exact format needed</li>
          <li>• The import will skip movies that already exist (based on title + year)</li>
          <li>• Column names are flexible - both "title" and "Title" work</li>
          <li>• Works great for importing data from other movie apps like CineShelf</li>
          <li>• You can export from TMDB/IMDB tools and import here</li>
        </ul>
      </div>
    </div>
  );
}

export default ImportCSVPage;
