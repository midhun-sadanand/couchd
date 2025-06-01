"use client";

import { useState } from 'react';
import { Star, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { MediaItem, StatusType } from '@/types';

interface MovieCardProps {
  item: MediaItem;
  onDelete: () => void;
  onNotesChange: (id: string, notes: string) => void;
  onStatusChange: (id: string, status: StatusType) => void;
  onRatingChange: (id: string, rating: number) => void;
  isOpen: boolean;
  setIsOpen: (id: string, isOpen: boolean) => void;
  isDropdownOpen: boolean;
  toggleDropdown: () => void;
}

export default function MovieCard({
  item,
  onDelete,
  onNotesChange,
  onStatusChange,
  onRatingChange,
  isOpen,
  setIsOpen,
  isDropdownOpen,
  toggleDropdown,
}: MovieCardProps) {
  const [localNotes, setLocalNotes] = useState(item.notes || '');
  const [localRating, setLocalRating] = useState(item.rating || 0);

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalNotes(e.target.value);
    onNotesChange(item.id, e.target.value);
  };

  const handleRatingChange = (newRating: number) => {
    setLocalRating(newRating);
    onRatingChange(item.id, newRating);
  };

  const statusOptions: StatusType[] = [
    'to consume',
    'consuming',
    'consumed',
    'dropped',
    'on hold'
  ];

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex space-x-4">
            {item.image && (
              <img
                src={item.image}
                alt={item.title}
                className="w-32 h-24 object-cover rounded"
                onError={(e) => {
                  e.currentTarget.src = '/default-movie.jpg';
                }}
              />
            )}
            <div>
              <h3 className="text-lg font-semibold">{item.title}</h3>
              <p className="text-sm text-gray-600">{item.medium}</p>
              {item.release_date && (
                <p className="text-sm text-gray-600">
                  Released: {new Date(item.release_date).toLocaleDateString()}
                </p>
              )}
              {item.length && <p className="text-sm text-gray-600">Length: {item.length}</p>}
              {item.creator && <p className="text-sm text-gray-600">Director: {item.creator}</p>}
            </div>
          </div>
          <div className="flex space-x-2">
            <div className="relative">
              <button
                onClick={toggleDropdown}
                className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 text-sm"
              >
                {item.status}
                {isDropdownOpen ? <ChevronUp className="inline ml-1" size={16} /> : <ChevronDown className="inline ml-1" size={16} />}
              </button>
              {isDropdownOpen && (
                <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg z-10">
                  {statusOptions.map((option) => (
                    <button
                      key={option}
                      onClick={() => onStatusChange(item.id, option)}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={onDelete}
              className="p-1 text-red-500 hover:text-red-700"
            >
              <Trash2 size={20} />
            </button>
            <button
              onClick={() => setIsOpen(item.id, !isOpen)}
              className="p-1 text-gray-500 hover:text-gray-700"
            >
              {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          </div>
        </div>

        {isOpen && (
          <div className="mt-4 space-y-4">
            {item.synopsis && (
              <div>
                <h4 className="text-sm font-medium text-gray-700">Synopsis</h4>
                <p className="text-sm text-gray-600">{item.synopsis}</p>
              </div>
            )}
            <div>
              <h4 className="text-sm font-medium text-gray-700">Notes</h4>
              <textarea
                value={localNotes}
                onChange={handleNotesChange}
                className="w-full p-2 border rounded text-sm"
                rows={3}
                placeholder="Add your notes here..."
              />
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-700">Rating</h4>
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => handleRatingChange(star)}
                    className="text-gray-400 hover:text-yellow-400"
                  >
                    <Star
                      size={20}
                      className={star <= localRating ? 'fill-yellow-400 text-yellow-400' : ''}
                    />
                  </button>
                ))}
              </div>
            </div>
            {item.url && (
              <div>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  View Details
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 