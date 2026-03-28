import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

interface SearchResult {
  id: string;
  title: string;
  year?: number;
  posterUrl?: string;
  type: 'movie' | 'person';
}

export default function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await api.get('/search', {
          params: { q: query, limit: 5 }
        });

        const movies = response.data.results.movies.map((m: any) => ({
          id: m.id,
          title: m.title,
          year: m.year,
          posterUrl: m.posterUrl,
          type: 'movie' as const,
        }));

        const people = response.data.results.people.map((p: any) => ({
          id: p.id,
          title: p.name,
          posterUrl: p.photoUrl,
          type: 'person' as const,
        }));

        setResults([...movies, ...people]);
        setIsOpen(true);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (result: SearchResult) => {
    if (result.type === 'movie') {
      navigate(`/movie/${result.id}`);
    } else {
      navigate(`/person/${result.id}`);
    }
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          placeholder="Search movies, people... (Press /)"
          data-search-input
          className="w-full px-4 py-2 pl-10 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-600"
        />
        <svg
          className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        {isLoading && (
          <div className="absolute right-3 top-2.5">
            <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-h-96 overflow-y-auto dark:bg-gray-900 dark:border-gray-600">
          {results.map((result) => (
            <button
              key={result.id}
              onClick={() => handleSelect(result)}
              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-700 dark:hover:bg-gray-800 transition text-left"
            >
              {result.posterUrl ? (
                <img
                  src={result.posterUrl}
                  alt={result.title}
                  className="w-10 h-14 object-cover rounded"
                />
              ) : (
                <div className="w-10 h-14 bg-gray-700 dark:bg-gray-800 rounded flex items-center justify-center text-gray-400">
                  {result.type === 'movie' ? '🎬' : '👤'}
                </div>
              )}
              <div>
                <div className="text-white font-medium">{result.title}</div>
                {result.year && (
                  <div className="text-sm text-gray-400">{result.year}</div>
                )}
                <div className="text-xs text-gray-500 capitalize">{result.type}</div>
              </div>
            </button>
          ))}
          <div className="px-4 py-2 border-t border-gray-700 dark:border-gray-600">
            <button
              onClick={() => {
                navigate(`/browse?q=${encodeURIComponent(query)}`);
                setIsOpen(false);
              }}
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              See all results for "{query}"
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
