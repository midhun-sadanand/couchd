"use client";

import { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import { MediumType, SearchResult } from '@/types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: SearchResult) => void;
  medium: MediumType;
}

export default function SearchModal({ isOpen, onClose, onSelect, medium }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
      setError(null);
    }
  }, [isOpen]);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      // TODO: Implement actual API calls based on medium
      // This is a placeholder for demonstration
      const searchResults = await mockSearchAPI(query, medium);
      setResults(searchResults);
    } catch (err) {
      setError('Failed to fetch results. Please try again.');
      console.error('Search failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">Search {medium}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X size={24} />
            </button>
          </div>

          <div className="mb-6">
            <div className="flex space-x-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={`Search for ${medium}...`}
                  className="w-full p-3 border rounded-lg"
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <Search size={20} />
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {isLoading && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Searching...</p>
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-4">
              {results.map((result) => (
                <div
                  key={result.id}
                  className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => {
                    onSelect(result);
                    onClose();
                  }}
                >
                  {result.image && (
                    <img
                      src={result.image}
                      alt={result.title}
                      className="w-16 h-16 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <h4 className="font-medium">{result.title}</h4>
                    {result.release_date && (
                      <p className="text-sm text-gray-600">
                        {new Date(result.release_date).toLocaleDateString()}
                      </p>
                    )}
                    {result.creator && (
                      <p className="text-sm text-gray-600">
                        Creator: {result.creator}
                      </p>
                    )}
                    {result.length && (
                      <p className="text-sm text-gray-600">
                        Length: {result.length}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLoading && query && results.length === 0 && (
            <div className="text-center py-4 text-gray-600">
              No results found for "{query}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Placeholder function for demonstration
async function mockSearchAPI(query: string, medium: MediumType): Promise<SearchResult[]> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return [
    {
      id: '1',
      title: `${query} - ${medium}`,
      medium,
      image: 'https://via.placeholder.com/150',
      release_date: new Date().toISOString(),
      creator: 'Sample Creator',
      length: '2h 30m',
    },
    // Add more mock results as needed
  ];
} 