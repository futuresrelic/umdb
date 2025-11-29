import { Link } from 'react-router-dom';

function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Welcome to UMDB
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Universal Media Database - Your universal catalog for ALL media that aren't found
          anywhere else. Movies, music, physical media - if it's rare or regional, it belongs here.
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mt-12">
          <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition">
            <div className="text-4xl mb-4">✍️</div>
            <h2 className="text-2xl font-bold mb-3">Manual Entry</h2>
            <p className="text-gray-600 mb-4">
              Enter media details directly from your physical collection. Perfect for
              rare DVDs, vinyls, and media not in any database.
            </p>
            <Link
              to="/add"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Add Movie
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition">
            <div className="text-4xl mb-4">🔍</div>
            <h2 className="text-2xl font-bold mb-3">Search External</h2>
            <p className="text-gray-600 mb-4">
              Find and import from TMDB, IMDB, Amazon, and more. Build your collection
              from multiple sources.
            </p>
            <Link
              to="/search-external"
              className="inline-block bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
            >
              Search Now
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition">
            <div className="text-4xl mb-4">📚</div>
            <h2 className="text-2xl font-bold mb-3">Browse Collection</h2>
            <p className="text-gray-600 mb-4">
              View and manage your entire media collection. Search, filter, and
              organize everything in one place.
            </p>
            <Link
              to="/browse"
              className="inline-block bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition"
            >
              Browse Movies
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition">
            <div className="text-4xl mb-4">📥</div>
            <h2 className="text-2xl font-bold mb-3">Import CSV</h2>
            <p className="text-gray-600 mb-4">
              Bulk import movies from CSV files. Perfect for migrating from
              CineShelf or other apps.
            </p>
            <Link
              to="/import-csv"
              className="inline-block bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition"
            >
              Import CSV
            </Link>
          </div>
        </div>

        <div className="mt-16 bg-blue-50 rounded-lg p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Why UMDB?</h2>
          <div className="text-left max-w-3xl mx-auto space-y-4 text-gray-700">
            <p>
              <strong>🌍 For rare and regional content:</strong> Quebec films, independent releases,
              vinyls, CDs - ANY media missing from mainstream databases.
            </p>
            <p>
              <strong>🔗 Connect to multiple sources:</strong> Link your media to
              TMDB, IMDB, Amazon, OMDB, and more for enriched data.
            </p>
            <p>
              <strong>📀 Universal media tracking:</strong> Record details for DVDs, Blu-rays, vinyls,
              CDs - with format, distributor, and UPC codes.
            </p>
            <p>
              <strong>🎯 Extensible architecture:</strong> A single source of truth for all your media
              data, designed to support future platforms and media types.
            </p>
            <p>
              <strong>📥 Bulk import:</strong> Import from CSV files - migrate from CineShelf or
              other apps in seconds.
            </p>
            <p>
              <strong>🔄 CineShelf integration:</strong> Match your CineShelf entries with IMDB, TMDB,
              and UMDB data for complete metadata.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
