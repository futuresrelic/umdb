import { useState, useEffect } from 'react';
import axios from 'axios';
import api from '../services/api';

interface SourceMatch {
  source: string;
  externalId: string;
  title: string;
  year?: number;
  posterUrl?: string;
  rating?: number;
  confidence: number;
}

interface Props {
  movieId: string;
  movieTitle: string;
  movieYear?: number;
  isOpen: boolean;
  onClose: () => void;
  onMatchSaved: () => void;
}

function SourceMatchingModal({ movieId, movieTitle, movieYear, isOpen, onClose, onMatchSaved }: Props) {
  const [matches, setMatches] = useState<SourceMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<SourceMatch | null>(null);
  const [detailedData, setDetailedData] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    if (isOpen) {
      findMatches();
    }
  }, [isOpen]);

  const findMatches = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/external/movies/${movieId}/find-matches`);
      setMatches(response.data.matches || []);
    } catch (error) {
      console.error('Failed to find matches:', error);
      alert('Failed to find matches');
    } finally {
      setLoading(false);
    }
  };

  const loadDetails = async (match: SourceMatch) => {
    try {
      setSelectedMatch(match);
      setLoadingDetails(true);
      const response = await api.get(`/external/sources/${match.source}/${match.externalId}`);
      setDetailedData(response.data);
    } catch (error) {
      console.error('Failed to load details:', error);
      alert('Failed to load details');
    } finally {
      setLoadingDetails(false);
    }
  };

  const saveMatch = async (match: SourceMatch) => {
    try {
      setSaving(match.source);
      await api.post(`/external/movies/${movieId}/matches`, {
        source: match.source,
        externalId: match.externalId
      });
      alert(`Match saved from ${match.source}!`);
      onMatchSaved();
    } catch (error: any) {
      console.error('Failed to save match:', error);
      alert(`Failed to save match: ${error.response?.data?.message || error.message}`);
    } finally {
      setSaving(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Find External Sources</h2>
            <p className="text-gray-600">
              {movieTitle} {movieYear && `(${movieYear})`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-3xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-12">Searching for matches...</div>
          ) : matches.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No matches found</div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {matches.map((match, idx) => (
                <div
                  key={`${match.source}-${idx}`}
                  className="border rounded-lg p-4 hover:shadow-lg transition"
                >
                  <div className="flex gap-4">
                    <div className="w-24 flex-shrink-0">
                      {match.posterUrl ? (
                        <img
                          src={match.posterUrl}
                          alt={match.title}
                          className="w-full rounded"
                        />
                      ) : (
                        <div className="w-full aspect-[2/3] bg-gray-200 rounded flex items-center justify-center">
                          🎬
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-bold">{match.title}</h3>
                          {match.year && (
                            <p className="text-sm text-gray-600">{match.year}</p>
                          )}
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            match.source === 'TMDB'
                              ? 'bg-green-100 text-green-800'
                              : match.source === 'OMDB'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {match.source}
                        </span>
                      </div>

                      <div className="mb-3">
                        <div className="text-xs text-gray-500 mb-1">Match Confidence</div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              match.confidence >= 70
                                ? 'bg-green-500'
                                : match.confidence >= 50
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${match.confidence}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {match.confidence}% confidence
                        </div>
                      </div>

                      {match.rating && (
                        <div className="text-sm mb-3">
                          ⭐ {match.rating.toFixed(1)}
                        </div>
                      )}

                      <div className="flex gap-2">
                        <button
                          onClick={() => loadDetails(match)}
                          className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded hover:bg-gray-200"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => saveMatch(match)}
                          disabled={saving === match.source}
                          className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:bg-gray-400"
                        >
                          {saving === match.source ? 'Saving...' : 'Save Match'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedMatch && (
          <div className="border-t p-6 bg-gray-50">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold">
                {selectedMatch.title} - {selectedMatch.source}
              </h3>
              <button
                onClick={() => {
                  setSelectedMatch(null);
                  setDetailedData(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                Close Details
              </button>
            </div>

            {loadingDetails ? (
              <div className="text-center py-4">Loading details...</div>
            ) : detailedData ? (
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p><strong>Title:</strong> {detailedData.data.title}</p>
                  {detailedData.data.originalTitle && (
                    <p><strong>Original Title:</strong> {detailedData.data.originalTitle}</p>
                  )}
                  <p><strong>Year:</strong> {detailedData.data.year}</p>
                  <p><strong>Runtime:</strong> {detailedData.data.runtime} min</p>
                  {detailedData.data.rating && (
                    <p><strong>Rating:</strong> ⭐ {detailedData.data.rating.toFixed(1)}</p>
                  )}
                </div>
                <div>
                  {detailedData.data.language && (
                    <p><strong>Language:</strong> {detailedData.data.language}</p>
                  )}
                  {detailedData.data.country && (
                    <p><strong>Country:</strong> {detailedData.data.country}</p>
                  )}
                  {detailedData.data.director && (
                    <p><strong>Director:</strong> {detailedData.data.director}</p>
                  )}
                  {detailedData.data.genres && (
                    <p><strong>Genres:</strong> {detailedData.data.genres.map((g: any) => g.name).join(', ')}</p>
                  )}
                </div>
                {detailedData.data.plot && (
                  <div className="md:col-span-2">
                    <p><strong>Plot:</strong></p>
                    <p className="text-gray-700">{detailedData.data.plot}</p>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

export default SourceMatchingModal;
