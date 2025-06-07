"use client";

import { useState } from 'react';
import { Star, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { MediaItem, StatusType } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import Rating from './Rating';
import NotesInput from './NotesInput';

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
  // Defensive guard: if item is missing, don't render
  if (!item) return null;

  // Defensive fallback values for all fields
  const {
    id = '',
    title = '',
    medium = '',
    length = '',
    release_date = '',
    created_at = '',
    synopsis = '',
    image = '',
    url = '',
    creator = '',
    status = 'to consume',
    notes = '',
    rating = 0,
    added_by = 'Guest',
  } = item || {};

  // Use local state for notes and rating, fallback to empty string/0
  const [localNotes, setLocalNotes] = useState<string>(notes ?? '');
  const [localRating, setLocalRating] = useState<number>(typeof rating === 'number' ? rating : 0);
  const [localStatus, setLocalStatus] = useState<StatusType>(status as StatusType);
  const [notesOpen, setNotesOpen] = useState(false);

  // Defensive event handlers
  const handleNotesChange = (notes: string) => {
    setLocalNotes(notes);
    if (id) onNotesChange(id, notes);
  };

  const handleRatingChange = (newRating: number) => {
    setLocalRating(newRating);
    if (id) onRatingChange(id, newRating);
  };

  const handleStatusChange = (newStatus: StatusType) => {
    setLocalStatus(newStatus);
    if (id) onStatusChange(id, newStatus);
  };

  const handleToggle = () => { if (id) setIsOpen(id, !isOpen); };

  const statusOptions: StatusType[] = [
    'to consume',
    'consuming',
    'consumed',
    'dropped',
    'on hold',
  ];

  // Defensive: only call onDelete if id exists
  const handleDelete = () => {
    if (id) onDelete();
  };

  // Defensive: format date
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return '';
    }
  };

  const statusColorClass = (status: StatusType) => {
    switch (status) {
      case 'to consume': return 'bg-[#B4B4B4]';
      case 'consuming': return 'bg-[#909090]';
      case 'consumed': return 'bg-[#636363]';
      default: return 'bg-gray-500';
    }
  };

  // Defensive: only call toggleDropdown if defined
  const handleToggleDropdown = () => {
    if (toggleDropdown) toggleDropdown();
  };

  // Defensive: fallback for image error
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = '/default-movie.jpg';
  };

  return (
    <div className="bg-[#232323] rounded-lg shadow-lg overflow-hidden border border-[#333]">
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex space-x-4 w-2/3">
            {image && (
              <img
                src={image}
                alt={title}
                className="w-32 h-40 object-cover rounded shadow-md"
                onError={handleImageError}
              />
            )}
            <div className="flex flex-col space-y-2">
              <h3 className="text-xl font-bold text-[#e6e6e6]">{title}</h3>
              <p className="text-sm text-gray-400">{medium}</p>
              {release_date && (
                <p className="text-xs text-gray-500">
                  Released: {formatDate(release_date)}
                </p>
              )}
              {length && <p className="text-xs text-gray-500">Length: {length}</p>}
              {creator && <p className="text-xs text-gray-500">Director: {creator}</p>}
              <div className="flex items-center space-x-2 mt-2">
                <span className="text-xs text-gray-500">Added by <span className="underline">{added_by}</span></span>
                <span className="text-xs text-gray-500">{formatDate(created_at)}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end space-y-2">
            <button
              onClick={handleToggleDropdown}
              className={`px-3 py-1 ${statusColorClass(localStatus)} rounded text-white text-xs font-semibold`}
            >
              {localStatus}
              {isDropdownOpen ? <ChevronUp className="inline ml-1" size={16} /> : <ChevronDown className="inline ml-1" size={16} />}
            </button>
            {isDropdownOpen && (
              <div className="absolute right-0 mt-8 w-40 bg-[#3b3b3b] rounded-md shadow-lg z-10">
                {statusOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleStatusChange(option)}
                    className="block w-full text-left px-4 py-2 text-xs text-gray-300 hover:bg-[#4b4b4b]"
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={handleDelete}
              className="p-1 text-red-500 hover:text-red-700"
            >
              <Trash2 size={20} />
            </button>
            <button
              onClick={handleToggle}
              className="p-1 text-gray-400 hover:text-gray-200"
            >
              {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          </div>
        </div>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-4 space-y-4"
            >
              {synopsis && (
                <div>
                  <h4 className="text-sm font-medium text-gray-300">Synopsis</h4>
                  <p className="text-sm text-gray-400">{synopsis}</p>
                </div>
              )}
              <div>
                <h4 className="text-sm font-medium text-gray-300">Notes</h4>
                <NotesInput initialNotes={localNotes} onChange={handleNotesChange} />
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-300">Rating</h4>
                <Rating rating={localRating} onRatingChange={handleRatingChange} />
              </div>
              {url && (
                <div>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 text-sm"
                  >
                    View Details
                  </a>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
} 