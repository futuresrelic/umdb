import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import HomePage from './pages/HomePage';
import BrowseMoviesPage from './pages/BrowseMoviesPage';
import MovieDetailsPage from './pages/MovieDetailsPage';
import AddMoviePage from './pages/AddMoviePage';
import SearchExternalPage from './pages/SearchExternalPage';
import ImportCSVPage from './pages/ImportCSVPage';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-gray-900 text-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <Link to="/" className="flex items-center">
                  <span className="text-2xl font-bold">🎬 UMDB</span>
                </Link>
                <div className="ml-10 flex items-baseline space-x-4">
                  <Link
                    to="/browse"
                    className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition"
                  >
                    Browse Movies
                  </Link>
                  <Link
                    to="/add"
                    className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition"
                  >
                    Add Movie
                  </Link>
                  <Link
                    to="/search-external"
                    className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition"
                  >
                    Search External
                  </Link>
                  <Link
                    to="/import-csv"
                    className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition"
                  >
                    Import CSV
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </nav>

        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/browse" element={<BrowseMoviesPage />} />
            <Route path="/movie/:id" element={<MovieDetailsPage />} />
            <Route path="/add" element={<AddMoviePage />} />
            <Route path="/search-external" element={<SearchExternalPage />} />
            <Route path="/import-csv" element={<ImportCSVPage />} />
          </Routes>
        </main>

        <footer className="bg-gray-900 text-white mt-16">
          <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
            <p className="text-center text-gray-400">
              UMDB - Universal Media Database &copy; {new Date().getFullYear()}
            </p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
