import { useState } from 'react';

interface ExternalMatch {
  id: string;
  source: string;
  externalId: string;
  url?: string;
  title?: string;
  originalTitle?: string;
  year?: number;
  runtime?: number;
  plot?: string;
  tagline?: string;
  language?: string;
  country?: string;
  posterUrl?: string;
  backdropUrl?: string;
  rating?: number;
  voteCount?: number;
  releaseDate?: string;
  cachedData?: any;
}

interface Props {
  matches: ExternalMatch[];
  umdbData: {
    title: string;
    originalTitle?: string;
    year?: number;
    runtime?: number;
    plot?: string;
    tagline?: string;
    language?: string;
    country?: string;
    rating?: number;
    posterUrl?: string;
    backdropUrl?: string;
    voteCount?: number;
    releaseDate?: string;
    url?: string;
  };
}

function SourceDataTabs({ matches, umdbData }: Props) {
  const [activeTab, setActiveTab] = useState<string>('UMDB');

  // Extract data from external match, handling cachedData properly
  const extractMatchData = (match: ExternalMatch) => {
    const cached = match.cachedData;

    if (match.source === 'TMDB' && cached) {
      // TMDB cachedData structure
      return {
        title: cached.title || match.title,
        originalTitle: cached.original_title || match.originalTitle,
        year: cached.release_date ? parseInt(cached.release_date.split('-')[0]) : match.year,
        runtime: cached.runtime || match.runtime,
        plot: cached.overview || match.plot,
        tagline: cached.tagline || match.tagline,
        language: cached.original_language || match.language,
        country: cached.production_countries?.[0]?.name || match.country,
        rating: cached.vote_average || match.rating,
        voteCount: cached.vote_count || match.voteCount,
        posterUrl: cached.poster_path ? `https://image.tmdb.org/t/p/w500${cached.poster_path}` : match.posterUrl,
        backdropUrl: cached.backdrop_path ? `https://image.tmdb.org/t/p/w1280${cached.backdrop_path}` : match.backdropUrl,
        releaseDate: cached.release_date || match.releaseDate,
        url: match.url || `https://www.themoviedb.org/movie/${match.externalId}`,
      };
    } else if (match.source === 'OMDB' && cached) {
      // OMDB cachedData structure
      return {
        title: cached.Title || match.title,
        originalTitle: match.originalTitle,
        year: cached.Year ? parseInt(cached.Year) : match.year,
        runtime: cached.Runtime ? parseInt(cached.Runtime.replace(' min', '')) : match.runtime,
        plot: cached.Plot || match.plot,
        tagline: match.tagline,
        language: cached.Language || match.language,
        country: cached.Country || match.country,
        rating: cached.imdbRating ? parseFloat(cached.imdbRating) : match.rating,
        voteCount: cached.imdbVotes ? parseInt(cached.imdbVotes.replace(/,/g, '')) : match.voteCount,
        posterUrl: cached.Poster !== 'N/A' ? cached.Poster : match.posterUrl,
        backdropUrl: match.backdropUrl,
        releaseDate: cached.Released || match.releaseDate,
        url: match.url,
      };
    } else if (match.source === 'IMDB' && cached) {
      // IMDB structure (if we have it)
      return {
        title: cached.title || match.title,
        originalTitle: cached.originalTitle || match.originalTitle,
        year: cached.year || match.year,
        runtime: cached.runtime || match.runtime,
        plot: cached.plot || match.plot,
        tagline: cached.tagline || match.tagline,
        language: cached.language || match.language,
        country: cached.country || match.country,
        rating: cached.rating || match.rating,
        voteCount: cached.voteCount || match.voteCount,
        posterUrl: cached.posterUrl || match.posterUrl,
        backdropUrl: cached.backdropUrl || match.backdropUrl,
        releaseDate: cached.releaseDate || match.releaseDate,
        url: match.url || `https://www.imdb.com/title/${match.externalId}`,
      };
    } else {
      // Fallback to top-level properties
      return {
        title: match.title,
        originalTitle: match.originalTitle,
        year: match.year,
        runtime: match.runtime,
        plot: match.plot,
        tagline: match.tagline,
        language: match.language,
        country: match.country,
        rating: match.rating,
        voteCount: match.voteCount,
        posterUrl: match.posterUrl,
        backdropUrl: match.backdropUrl,
        releaseDate: match.releaseDate,
        url: match.url,
      };
    }
  };

  const allSources = [
    { id: 'UMDB', name: 'UMDB', data: umdbData, color: 'bg-blue-100 text-blue-800' },
    ...matches.map(match => ({
      id: match.source,
      name: match.source,
      data: extractMatchData(match),
      color: match.source === 'TMDB'
        ? 'bg-green-100 text-green-800'
        : match.source === 'OMDB'
        ? 'bg-yellow-100 text-yellow-800'
        : 'bg-gray-100 text-gray-800'
    }))
  ];

  const activeSource = allSources.find(s => s.id === activeTab);

  return (
    <div className="mb-6">
      <h2 className="text-xl font-bold mb-3">Source Data Comparison</h2>

      {/* Tab buttons */}
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {allSources.map(source => (
          <button
            key={source.id}
            onClick={() => setActiveTab(source.id)}
            className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
              activeTab === source.id
                ? source.color
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {source.name}
            {source.id !== 'UMDB' && activeTab === source.id && (
              <span className="ml-2 text-xs opacity-75">
                (Matched)
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Active tab content */}
      {activeSource && (
        <div className="bg-white border rounded-lg p-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Left column - poster/backdrop */}
            <div>
              {activeSource.data.posterUrl && (
                <div className="mb-4">
                  <h3 className="font-bold mb-2">Poster</h3>
                  <img
                    src={activeSource.data.posterUrl}
                    alt={activeSource.data.title || 'Poster'}
                    className="w-full max-w-sm rounded-lg shadow-lg"
                  />
                </div>
              )}
              {activeSource.data.backdropUrl && (
                <div>
                  <h3 className="font-bold mb-2">Backdrop</h3>
                  <img
                    src={activeSource.data.backdropUrl}
                    alt="Backdrop"
                    className="w-full rounded-lg shadow-lg"
                  />
                </div>
              )}
            </div>

            {/* Right column - data */}
            <div className="space-y-3">
              {activeSource.data.url && (
                <div className="mb-4">
                  <a
                    href={activeSource.data.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    View on {activeSource.name} →
                  </a>
                </div>
              )}

              <div>
                <strong className="text-gray-700">Title:</strong>
                <p className="text-gray-900">{activeSource.data.title || 'N/A'}</p>
              </div>

              {activeSource.data.originalTitle && (
                <div>
                  <strong className="text-gray-700">Original Title:</strong>
                  <p className="text-gray-900">{activeSource.data.originalTitle}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <strong className="text-gray-700">Year:</strong>
                  <p className="text-gray-900">{activeSource.data.year || 'N/A'}</p>
                </div>
                <div>
                  <strong className="text-gray-700">Runtime:</strong>
                  <p className="text-gray-900">
                    {activeSource.data.runtime ? `${activeSource.data.runtime} min` : 'N/A'}
                  </p>
                </div>
              </div>

              {activeSource.data.rating && (
                <div>
                  <strong className="text-gray-700">Rating:</strong>
                  <p className="text-gray-900">
                    ⭐ {activeSource.data.rating.toFixed(1)}
                    {activeSource.data.voteCount && (
                      <span className="text-gray-500 text-sm ml-2">
                        ({activeSource.data.voteCount.toLocaleString()} votes)
                      </span>
                    )}
                  </p>
                </div>
              )}

              {activeSource.data.tagline && (
                <div>
                  <strong className="text-gray-700">Tagline:</strong>
                  <p className="text-gray-900 italic">"{activeSource.data.tagline}"</p>
                </div>
              )}

              {activeSource.data.plot && (
                <div>
                  <strong className="text-gray-700">Plot:</strong>
                  <p className="text-gray-900">{activeSource.data.plot}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                {activeSource.data.language && (
                  <div>
                    <strong className="text-gray-700">Language:</strong>
                    <p className="text-gray-900">{activeSource.data.language}</p>
                  </div>
                )}
                {activeSource.data.country && (
                  <div>
                    <strong className="text-gray-700">Country:</strong>
                    <p className="text-gray-900">{activeSource.data.country}</p>
                  </div>
                )}
              </div>

              {activeSource.data.releaseDate && (
                <div>
                  <strong className="text-gray-700">Release Date:</strong>
                  <p className="text-gray-900">
                    {new Date(activeSource.data.releaseDate).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Comparison note */}
      {matches.length > 0 && (
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            💡 <strong>Tip:</strong> Switch between tabs to compare data from different sources.
            Each source may have different information - use this to get the most complete picture of your movie.
          </p>
        </div>
      )}
    </div>
  );
}

export default SourceDataTabs;
