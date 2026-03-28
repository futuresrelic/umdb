import { Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';

interface BreadcrumbItem {
  label: string;
  path: string;
}

export default function Breadcrumbs() {
  const location = useLocation();
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);

  useEffect(() => {
    const paths = location.pathname.split('/').filter(Boolean);
    const items: BreadcrumbItem[] = [{ label: 'Home', path: '/' }];

    let currentPath = '';
    for (let i = 0; i < paths.length; i++) {
      currentPath += `/${paths[i]}`;

      // Convert path segment to readable label
      let label = paths[i]
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      // Handle special cases
      if (paths[i] === 'add' && paths[i - 1] === 'movie') {
        label = 'Add Movie';
      } else if (paths[i].match(/^[a-z0-9]{25}$/)) {
        // Skip showing long IDs as breadcrumbs
        continue;
      }

      items.push({ label, path: currentPath });
    }

    setBreadcrumbs(items);
  }, [location]);

  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-400 dark:text-gray-500 mb-4">
      {breadcrumbs.map((item, index) => (
        <div key={item.path} className="flex items-center">
          {index > 0 && (
            <svg
              className="w-4 h-4 mx-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
          )}
          {index === breadcrumbs.length - 1 ? (
            <span className="text-white dark:text-gray-300 font-medium">
              {item.label}
            </span>
          ) : (
            <Link
              to={item.path}
              className="hover:text-blue-400 dark:hover:text-blue-300 transition"
            >
              {item.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}
