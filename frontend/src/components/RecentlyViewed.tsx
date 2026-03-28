import { Link } from 'react-router-dom';
import { useRecentlyViewed } from '../hooks/useRecentlyViewed';

export default function RecentlyViewed() {
  const { recentItems, clearRecentItems } = useRecentlyViewed();

  if (recentItems.length === 0) {
    return null;
  }

  return (
    <div className="bg-gray-800 dark:bg-gray-900 rounded-lg p-4 border border-gray-700 dark:border-gray-600">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Recently Viewed
        </h3>
        <button
          onClick={clearRecentItems}
          className="text-xs text-gray-400 hover:text-gray-300 transition"
        >
          Clear
        </button>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800">
        {recentItems.slice(0, 10).map((item) => (
          <Link
            key={item.id}
            to={`/${item.type === 'movie' ? 'movie' : item.type === 'person' ? 'person' : 'box-set'}/${item.id}`}
            className="flex-shrink-0 w-24 group"
          >
            {item.posterUrl ? (
              <img
                src={item.posterUrl}
                alt={item.title}
                className="w-full h-36 object-cover rounded shadow-lg group-hover:opacity-80 transition"
              />
            ) : (
              <div className="w-full h-36 bg-gray-700 dark:bg-gray-800 rounded flex items-center justify-center text-3xl group-hover:opacity-80 transition">
                {item.type === 'movie' ? '🎬' : item.type === 'person' ? '👤' : '📦'}
              </div>
            )}
            <div className="mt-1 text-xs text-gray-300 dark:text-gray-400 truncate">
              {item.title}
            </div>
            {item.year && (
              <div className="text-xs text-gray-500">{item.year}</div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
