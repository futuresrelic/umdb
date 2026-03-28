import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { useGlobalShortcuts } from './hooks/useKeyboardShortcuts';
import GlobalSearch from './components/GlobalSearch';
import Breadcrumbs from './components/Breadcrumbs';
import HomePage from './pages/HomePage';
import BrowseMoviesPage from './pages/BrowseMoviesPage';
import MovieDetailsPage from './pages/MovieDetailsPage';
import PersonDetailsPage from './pages/PersonDetailsPage';
import AddMoviePage from './pages/AddMoviePage';
import SearchExternalPage from './pages/SearchExternalPage';
import ImportCSVPage from './pages/ImportCSVPage';
import CollectionPage from './pages/CollectionPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import MySubmissionsPage from './pages/MySubmissionsPage';
import AdminPage from './pages/AdminPage';
import EditMoviePage from './pages/EditMoviePage';
import DocsPage from './pages/DocsPage';
import BoxSetsListPage from './pages/BoxSetsListPage';
import BoxSetDetailPage from './pages/BoxSetDetailPage';
import BoxSetCreatePage from './pages/BoxSetCreatePage';

function NavBar() {
  const { user, loading, login, logout, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <nav className="bg-gray-900 dark:bg-gray-950 text-white shadow-lg border-b border-gray-800 dark:border-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center">
              <span className="text-2xl font-bold">🎬 UMDB</span>
            </Link>
            <GlobalSearch />
            <div className="hidden lg:flex items-baseline space-x-4">
              <Link to="/browse" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition">
                Browse
              </Link>
              <Link to="/box-sets" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition">
                📦 Box Sets
              </Link>
              {user && (
                <>
                  <Link to="/add" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition">
                    Add Movie
                  </Link>
                  <Link to="/search-external" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition">
                    Search External
                  </Link>
                  <Link to="/collection" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition">
                    Collection
                  </Link>
                  <Link to="/import-csv" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition">
                    Import CSV
                  </Link>
                  <Link to="/my-submissions" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition">
                    My Submissions
                  </Link>
                  <Link to="/docs" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition">
                    Docs
                  </Link>
                  {isAdmin && (
                    <Link to="/admin" className="px-3 py-2 rounded-md text-sm font-medium bg-yellow-600 hover:bg-yellow-500 transition">
                      Admin
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-gray-800 dark:bg-gray-900 hover:bg-gray-700 dark:hover:bg-gray-800 transition"
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? (
                <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>

            {loading ? null : user ? (
              <div className="flex items-center gap-3">
                {user.photo && (
                  <img src={user.photo} alt={user.name} className="w-8 h-8 rounded-full border-2 border-gray-600" />
                )}
                <span className="text-sm text-gray-300">{user.name}</span>
                <button
                  onClick={() => { logout(); navigate('/'); }}
                  className="px-3 py-1.5 rounded text-sm bg-gray-700 hover:bg-gray-600 transition"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={login}
                className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-white text-gray-900 hover:bg-gray-100 transition"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign in with Google
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

function AppContent() {
  // Enable global keyboard shortcuts
  useGlobalShortcuts();

  // Point favicon/apple-touch-icon to the admin-configured icons on the backend.
  // index.html has static fallbacks; this updates them once JS loads.
  useEffect(() => {
    const apiBase = import.meta.env.VITE_API_URL ?? '/api';
    const set = (sel: string, href: string) => {
      const el = document.querySelector<HTMLLinkElement>(sel);
      if (el) el.href = href;
    };
    set('link[rel="icon"]',             `${apiBase}/icons/favicon.png`);
    set('link[rel="apple-touch-icon"]', `${apiBase}/icons/apple-touch-icon.png`);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
      <NavBar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Breadcrumbs />
        <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/browse" element={<BrowseMoviesPage />} />
              <Route path="/movie/:id" element={<MovieDetailsPage />} />
              <Route path="/person/:id" element={<PersonDetailsPage />} />
              <Route path="/add" element={<AddMoviePage />} />
              <Route path="/search-external" element={<SearchExternalPage />} />
              <Route path="/import-csv" element={<ImportCSVPage />} />
              <Route path="/collection" element={<CollectionPage />} />
              <Route path="/my-submissions" element={<MySubmissionsPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/edit/:id" element={<EditMoviePage />} />
              <Route path="/docs" element={<DocsPage />} />
              <Route path="/auth/callback" element={<AuthCallbackPage />} />
              <Route path="/box-sets" element={<BoxSetsListPage />} />
              <Route path="/box-sets/new" element={<BoxSetCreatePage />} />
              <Route path="/box-sets/:id" element={<BoxSetDetailPage />} />
            </Routes>
          </main>

          <footer className="bg-gray-900 dark:bg-gray-950 text-white mt-16 border-t border-gray-800">
            <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 text-center space-y-2">
              <p className="text-gray-400">
                UMDB - Universal Media Database &copy; {new Date().getFullYear()}
              </p>
              <p className="text-gray-500 text-xs">
                This product uses the TMDB API but is not endorsed or certified by TMDB.
                Movie data may also be sourced from OMDb API.
              </p>
              <p className="text-gray-600 text-xs mt-4">
                Keyboard shortcuts: <kbd className="px-2 py-1 bg-gray-800 rounded text-xs">H</kbd> Home •
                <kbd className="px-2 py-1 bg-gray-800 rounded text-xs ml-1">B</kbd> Browse •
                <kbd className="px-2 py-1 bg-gray-800 rounded text-xs ml-1">/</kbd> Search •
                <kbd className="px-2 py-1 bg-gray-800 rounded text-xs ml-1">A</kbd> Add Movie
              </p>
            </div>
          </footer>
    </div>
  );
}

function App() {
  return (
    <Router>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
