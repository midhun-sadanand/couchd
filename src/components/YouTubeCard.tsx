"use client";

import { useState, useEffect, useRef } from 'react';
import { Star, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { MediaItem, StatusType } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import VideoPlayer from './VideoPlayer';
import Rating from './Rating';
import NotesInput from './NotesInput';

interface YouTubeCardProps {
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

export default function YouTubeCard({
  item,
  onDelete,
  onNotesChange,
  onStatusChange,
  onRatingChange,
  isOpen,
  setIsOpen,
  isDropdownOpen,
  toggleDropdown,
}: YouTubeCardProps) {
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

  // Use local state with fallbacks
  const [localNotes, setLocalNotes] = useState<string>(notes ?? '');
  const [localRating, setLocalRating] = useState<number>(typeof rating === 'number' ? rating : 0);
  const [localStatus, setLocalStatus] = useState<StatusType>(status as StatusType);
  const [notesOpen, setNotesOpen] = useState(false);
  const hasChanges = useRef(false);
  const statusButtonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Update local state when props change
  useEffect(() => {
    setLocalRating(typeof rating === 'number' ? rating : 0);
  }, [rating]);

  useEffect(() => {
    setLocalStatus(status as StatusType);
  }, [status]);

  // Save changes before unload
  useEffect(() => {
    const handleUnload = async () => {
      if (hasChanges.current) {
        await pushChanges();
      }
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, []);

  // Click outside handler for dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        statusButtonRef.current &&
        !statusButtonRef.current.contains(event.target as Node)
      ) {
        toggleDropdown();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [toggleDropdown]);

  const pushChanges = async () => {
    if (localStatus !== status && id) {
      await onStatusChange(id, localStatus);
    }
    if (localRating !== rating && id) {
      await onRatingChange(id, localRating);
    }
    hasChanges.current = false;
  };

  const handleNotesChange = (notes: string) => {
    setLocalNotes(notes);
    if (id) onNotesChange(id, notes);
  };

  const handleRatingChange = (newRating: number) => {
    setLocalRating(newRating);
    hasChanges.current = true;
    if (id) onRatingChange(id, newRating);
  };

  const handleStatusChange = (newStatus: StatusType) => {
    const oldStatus = localStatus;
    setLocalStatus(newStatus);
    hasChanges.current = true;
    if (id) {
      onStatusChange(id, newStatus).catch((error) => {
        console.error('Error updating status:', error);
        setLocalStatus(oldStatus);
      });
    }
  };

  const handleToggle = async () => {
    if (isOpen) {
      await pushChanges();
    }
    if (id) setIsOpen(id, !isOpen);
  };

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
      case 'to consume': return 'bg-[#34d399]'; // green
      case 'consuming': return 'bg-[#fbbf24]'; // yellow
      case 'consumed': return 'bg-[#f87171]'; // red
      default: return 'bg-gray-500';
    }
  };

  const statusTextColor = (status: StatusType) => 'text-[#232323]';

  const statusOptions: StatusType[] = [
    'to consume',
    'consuming',
    'consumed',
  ];

  return (
    <div
      className="bg-[#232323] hover:bg-[#242424] transition-all duration-500 ease-in-out rounded-lg shadow-lg overflow-hidden border border-[#333] cursor-pointer ml-0"
      onClick={handleToggle}
    >
      <div className="p-4 relative">
        <div className="flex justify-between items-start">
          <div className="flex space-x-4 w-2/3">
            {image && (
              <img
                src={image}
                alt={title}
                className="w-32 h-40 object-cover rounded shadow-md"
                onError={e => (e.currentTarget.src = '/default-movie.jpg')}
              />
            )}
            <div className="flex flex-col space-y-2">
              <h3 className="text-xl font-bold text-[#e6e6e6]">{title}</h3>
              <p className="text-sm text-gray-400">{medium}</p>
              {release_date && (
                <p className="text-xs text-gray-500">Published: {formatDate(release_date)}</p>
              )}
              {length && <p className="text-xs text-gray-500">Length: {length}</p>}
              {creator && <p className="text-xs text-gray-500">Channel: {creator}</p>}
              <div className="flex items-center mt-2">
                <span className="text-xs text-gray-500">Added by <span className="underline">{added_by}</span> on {formatDate(created_at)}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end space-y-2">
            <div
              className="relative"
              id={`status-dropdown-${id}`}
            >
              <button
                className={`px-3 py-1 ${statusColorClass(localStatus)} rounded text-[#232323] text-xs font-semibold focus:outline-none w-[100px]`}
                type="button"
                onClick={e => { e.stopPropagation(); toggleDropdown(); }}
              >
                {localStatus}
              </button>
              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.18 }}
                    className="absolute right-0 mt-2 w-[100px] bg-[#3b3b3b] rounded-md shadow-lg z-10"
                    style={{ right: 0 }}
                  >
                    {statusOptions.map((option, idx) => (
                      <button
                        key={option}
                        onClick={e => { e.stopPropagation(); handleStatusChange(option); toggleDropdown(); }}
                        className={`block w-full text-left px-4 py-2 text-xs font-semibold hover:bg-[#4b4b4b] ${
                          option === 'to consume' ? 'text-[#34d399]' : option === 'consuming' ? 'text-[#fbbf24]' : option === 'consumed' ? 'text-[#f87171]' : 'text-[#232323]'
                        } ${idx === 0 ? 'first:rounded-t-md' : ''} ${idx === statusOptions.length - 1 ? 'last:rounded-b-md' : ''}`}
                      >
                        {option}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-4 space-y-4 relative"
            >
              {synopsis && (
                <div>
                  <h4 className="text-sm font-medium text-gray-300">Synopsis</h4>
                  <p className="text-sm text-gray-400">{synopsis}</p>
                </div>
              )}
              <div onClick={e => e.stopPropagation()} onPointerDown={e => e.stopPropagation()}>
                <h4 className="text-sm font-medium text-gray-300">Notes</h4>
                <NotesInput initialNotes={localNotes} onChange={handleNotesChange} />
              </div>
              <div className="mt-2 flex flex-row justify-between items-center w-full">
                <div className="mb-2">
                  <Rating rating={localRating} onRatingChange={handleRatingChange} />
                </div>
                <button
                  onClick={e => { e.stopPropagation(); onDelete(); }}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors duration-150 opacity-80 hover:opacity-100"
                >
                  <Trash2 size={20} />
                </button>
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