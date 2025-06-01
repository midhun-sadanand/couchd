"use client";

import { useState } from 'react';
import { X, Search, Upload } from 'lucide-react';
import { MediaItem, MediumType, SearchResult } from '@/types';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (item: Omit<MediaItem, 'id' | 'created_at' | 'status'>) => void;
}

export default function AddItemModal({ isOpen, onClose, onAdd }: AddItemModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMedium, setSelectedMedium] = useState<MediumType>('movie');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      // TODO: Implement actual API calls based on medium
      // This is a placeholder for demonstration
      const results = await mockSearchAPI(searchQuery, selectedMedium);
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddItem = (item: SearchResult) => {
    onAdd({
      title: item.title,
      medium: selectedMedium,
      image: item.image,
      url: item.url,
      synopsis: item.synopsis,
      release_date: item.release_date,
      length: item.length,
      creator: item.creator,
    });
    onClose();
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // TODO: Implement actual file upload
      // This is a placeholder for demonstration
      const uploadedUrl = await mockUploadAPI(file);
      handleAddItem({
        id: 'temp',
        title: file.name,
        medium: selectedMedium,
        image: uploadedUrl,
      });
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">Add New Item</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X size={24} />
            </button>
          </div>

          <div className="mb-6">
            <div className="flex space-x-4 mb-4">
              {(['movie', 'tv', 'youtube', 'book', 'podcast'] as MediumType[]).map((medium) => (
                <button
                  key={medium}
                  onClick={() => setSelectedMedium(medium)}
                  className={`px-4 py-2 rounded-full capitalize ${
                    selectedMedium === medium
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {medium}
                </button>
              ))}
            </div>

            <div className="flex space-x-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Search for ${selectedMedium}...`}
                  className="w-full p-3 border rounded-lg"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={isSearching}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <Search size={20} />
              </button>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Or upload an image
            </label>
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-2 text-gray-500" />
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">PNG, JPG or GIF (MAX. 800x400px)</p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleUpload}
                  disabled={isUploading}
                />
              </label>
            </div>
          </div>

          {isSearching && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Searching...</p>
            </div>
          )}

          {searchResults.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Search Results</h3>
              {searchResults.map((result) => (
                <div
                  key={result.id}
                  className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleAddItem(result)}
                >
                  {result.image && (
                    <img
                      src={result.image}
                      alt={result.title}
                      className="w-16 h-16 object-cover rounded"
                    />
                  )}
                  <div>
                    <h4 className="font-medium">{result.title}</h4>
                    {result.release_date && (
                      <p className="text-sm text-gray-600">
                        {new Date(result.release_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Placeholder functions for demonstration
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
    },
    // Add more mock results as needed
  ];
}

async function mockUploadAPI(file: File): Promise<string> {
  // Simulate upload delay
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return 'https://via.placeholder.com/150';
}