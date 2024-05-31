import React, { useState, useEffect, useRef } from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { motion, AnimatePresence } from 'framer-motion';
import VideoPlayer from './VideoPlayer'; // Adjust the path as needed
import NotesInput from './Notes'; // Ensure this path is correct
import Rating from './Rating'; // Ensure this path is correct

const MovieCard = ({
  id, title, medium, length, date, synopsis, image, url, creator, addedBy, status, notes, rating, onDelete, onNotesChange, onStatusChange, onRatingChange, index, isOpen, setIsOpen
}) => {
  const [localRating, setLocalRating] = useState(rating);
  const [localStatus, setLocalStatus] = useState(status);
  const [notesOpen, setNotesOpen] = useState(false);
  const hasChanges = useRef(false);

  useEffect(() => {
    setLocalRating(rating);
  }, [rating]);

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

  const pushChanges = async () => {
    if (localStatus !== status) {
      await onStatusChange(id, localStatus);
    }
    if (localRating !== rating) {
      await onRatingChange(id, localRating);
    }
    hasChanges.current = false;
  };

  const handleRatingChange = (newRating) => {
    setLocalRating(newRating);
    hasChanges.current = true;
  };

  const handleStatusChange = (newStatus) => {
    setLocalStatus(newStatus);
    hasChanges.current = true;
  };

  const handleToggle = async () => {
    if (isOpen) {
      await pushChanges();
    }
    setIsOpen(id, !isOpen);
  };

  const formatDate = (date) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Intl.DateTimeFormat('en-US', options).format(new Date(date));
  };

  const handleIcon = (medium) => {
    switch (medium) {
      case 'Book':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
          </svg>
        );
      case 'Movie':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5A1.125 1.125 0 0 1 18 18.375M20.625 4.5H3.375m17.25 0c.621 0 1.125.504 1.125 1.125M20.625 4.5h-1.5C18.504 4.5 18 5.004 18 5.625m3.75 0v1.5c0 .621-.504 1.125-1.125 1.125M3.375 4.5c-.621 0-1.125.504-1.125 1.125M3.375 4.5h1.5C5.496 4.5 6 5.004 6 5.625m-3.75 0v1.5c0 .621.504 1.125 1.125 1.125m0 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m1.5-3.75C5.496 8.25 6 7.746 6 7.125v-1.5M4.875 8.25C5.496 8.25 6 8.754 6 9.375v1.5m0-5.25v5.25m0-5.25C6 5.004 6.504 4.5 7.125 4.5h9.75c.621 0 1.125.504 1.125 1.125m1.125 2.625h1.5m-1.5 0A1.125 1.125 0 0 1 18 7.125v-1.5m1.125 2.625c-.621 0-1.125.504-1.125 1.125v1.5m2.625-2.625c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125M18 5.625v5.25M7.125 12h9.75m-9.75 0A1.125 1.125 0 0 1 6 10.875M7.125 12C6.504 12 6 12.504 6 13.125m0-2.25C6 11.496 5.496 12 4.875 12M18 10.875c0 .621-.504 1.125-1.125 1.125M18 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m-12 5.25v-5.25m0 5.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125m-12 0v-1.5c0-.621-.504-1.125-1.125-1.125M18 18.375v-5.25m0 5.25v-1.5c0-.621.504-1.125 1.125-1.125M18 13.125v1.5c0 .621.504 1.125 1.125 1.125M18 13.125c0-.621.504-1.125 1.125-1.125M6 13.125v1.5c0 .621-.504 1.125-1.125 1.125M6 13.125C6 12.504 5.496 12 4.875 12m-1.5 0 h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M19.125 12h1.5m0 0c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h1.5m14.25 0h1.5" />
          </svg>
        );
      case 'YouTube':
        return (
          <svg height="25px" width="25px" viewBox="0 0 461.001 461.001" fill="#000000" xmlns="http://www.w3.org/2000/svg">
            <path d="M365.257,67.393H95.744C42.866,67.393,0,110.259,0,163.137v134.728 c0,52.878,42.866,95.744,95.744,95.744h269.513c52.878,0,95.744-42.866,95.744-95.744V163.137 C461.001,110.259,418.135,67.393,365.257,67.393z M300.506,237.056l-126.06,60.123c-3.359,1.602-7.239-0.847-7.239-4.568V168.607 c0-3.774,3.982-6.22,7.348-4.514l126.06,63.881C304.363,229.873,304.298,235.248,300.506,237.056z" fill="currentColor"/>
          </svg>
        );
      case 'TV':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 20.25h12m-7.5-3v3m3-3v3m-10.125-3h17.25c.621 0 1.125-.504 1.125-1.125V4.875c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125Z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <Draggable draggableId={id.toString()} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className="movie-card p-2 overflow-hidden flex flex-col relative"
          style={{ marginBottom: '10px', transform: `translateY(${index * -5}px)` }}
        >
          <div className="movie-card-header w-auto justify-between flex items-center">
            <div className="flex items-center">
              <div className="medium-icon pl-3 cursor-move" {...provided.dragHandleProps}>{handleIcon(medium)}</div>
              <div className="item-title font-bold px-3 text-xl text-left flex items-center">
                <div>
                  <div>{title}</div>
                  <div className="text-sm text-gray-400">
                    {creator} &middot; {formatDate(date)}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center">
              <select
                className={`status-indicator ${localStatus ? `status-${localStatus.toLowerCase().replace(' ', '-')}` : ''}`}
                value={localStatus}
                onChange={(e) => handleStatusChange(e.target.value)}
              >
                <option value="to consume">to consume</option>
                <option value="consuming">consuming</option>
                <option value="consumed">consumed</option>
              </select>
              <button onClick={() => onDelete(id)} className="remove-button py-2 px-4">Delete</button>
              <button onClick={handleToggle} className="p-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={`w-6 h-6 arrow ${isOpen ? 'arrow-down' : 'arrow-up'}`}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
                </svg>
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
                className="p-4 flex flex-col"
              >
                <div className="flex">
                  {url && url.includes('youtube') && (
                    <div className="w-1/2 mb-4">
                      <VideoPlayer url={url} title={title} />
                    </div>
                  )}
                  <div className="w-1/2 pl-4 flex flex-col justify-between">
                    <div>
                      <div className="text-sm text-gray-400 text-right">
                        Added by <span className="underline">{addedBy}</span>
                        <div>{formatDate(new Date())}</div>
                      </div>
                      <div className="mt-2 flex justify-end">
                        <Rating rating={localRating} onRatingChange={handleRatingChange} />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="w-full pt-4 mt-auto">
                  <div className="flex items-center cursor-pointer" onClick={() => setNotesOpen(!notesOpen)}>
                    <div className="text-sm text-gray-400">thoughts</div>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={`w-4 h-4 ml-1 ${notesOpen ? 'transform rotate-180' : ''}`}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
                    </svg>
                  </div>
                  {notesOpen && (
                    <NotesInput initialNotes={notes} onChange={(newNotes) => onNotesChange(id, newNotes)} />
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </Draggable>
  );
};

export default MovieCard;
