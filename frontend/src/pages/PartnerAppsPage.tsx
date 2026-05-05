import { useEffect, useState } from 'react';
import { partnerAppApi } from '../services/api';

interface PartnerApp {
  id: string;
  name: string;
  tagline?: string;
  description?: string;
  iconUrl?: string;
  installUrl?: string;
  openUrl?: string;
  platforms: string[];
  price: string;
  features: string[];
  promoVideoUrl?: string;
  integrationNotes?: string;
  isUmdbIntegrated: boolean;
  isFeatured: boolean;
  status: 'ACTIVE' | 'COMING_SOON' | 'DEPRECATED';
  screenshots: {
    id: string;
    url: string;
    caption?: string;
    sortOrder: number;
  }[];
}

export default function PartnerAppsPage() {
  const [apps, setApps] = useState<PartnerApp[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadApps();
  }, []);

  const loadApps = async () => {
    try {
      setLoading(true);
      const data = await partnerAppApi.getAll({ status: 'ACTIVE' });
      setApps(data.apps || []);
    } catch (error) {
      console.error('Failed to load partner apps:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-600">Loading partner apps...</p>
      </div>
    );
  }

  const featuredApps = apps.filter(app => app.isFeatured);
  const otherApps = apps.filter(app => !app.isFeatured);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Partner Apps</h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Discover apps and tools that integrate with UMDB to enhance your physical media collection experience.
        </p>
      </div>

      {/* Featured Apps */}
      {featuredApps.length > 0 && (
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Featured Apps</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {featuredApps.map(app => (
              <div key={app.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition">
                <div className="p-8">
                  <div className="flex items-start gap-6">
                    {app.iconUrl && (
                      <img
                        src={app.iconUrl}
                        alt={app.name}
                        className="w-20 h-20 rounded-2xl flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">{app.name}</h3>
                      {app.tagline && (
                        <p className="text-gray-600 mb-4">{app.tagline}</p>
                      )}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {app.platforms.map((platform, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                          >
                            {platform}
                          </span>
                        ))}
                        <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full font-medium">
                          {app.price}
                        </span>
                        {app.isUmdbIntegrated && (
                          <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full font-medium">
                            🔗 UMDB Integrated
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {app.description && (
                    <p className="text-gray-700 mb-6 leading-relaxed">
                      {app.description}
                    </p>
                  )}

                  {app.features.length > 0 && (
                    <div className="mb-6">
                      <h4 className="font-semibold text-gray-900 mb-3">Features:</h4>
                      <ul className="grid md:grid-cols-2 gap-2">
                        {app.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                            <span className="text-blue-600 mt-0.5">✓</span>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex gap-3">
                    {app.installUrl && (
                      <a
                        href={app.installUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition text-center"
                      >
                        Install {app.name}
                      </a>
                    )}
                    {app.openUrl && (
                      <a
                        href={app.openUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition"
                      >
                        Open App
                      </a>
                    )}
                  </div>
                </div>

                {app.screenshots.length > 0 && (
                  <div className="px-8 pb-8">
                    <div className="grid grid-cols-3 gap-4">
                      {app.screenshots.slice(0, 3).map(screenshot => (
                        <img
                          key={screenshot.id}
                          src={screenshot.url}
                          alt={screenshot.caption || ''}
                          className="w-full h-48 object-cover rounded-lg"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Other Apps */}
      {otherApps.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">More Apps</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {otherApps.map(app => (
              <div key={app.id} className="bg-white rounded-lg shadow hover:shadow-lg transition p-6">
                <div className="flex items-start gap-4 mb-4">
                  {app.iconUrl && (
                    <img
                      src={app.iconUrl}
                      alt={app.name}
                      className="w-16 h-16 rounded-xl flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-900">{app.name}</h3>
                    {app.tagline && (
                      <p className="text-sm text-gray-600 mt-1">{app.tagline}</p>
                    )}
                  </div>
                </div>

                {app.description && (
                  <p className="text-sm text-gray-700 mb-4 line-clamp-3">
                    {app.description}
                  </p>
                )}

                <div className="flex gap-2">
                  {app.installUrl && (
                    <a
                      href={app.installUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition text-center"
                    >
                      Install
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {apps.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-600">No partner apps available at this time.</p>
        </div>
      )}
    </div>
  );
}
