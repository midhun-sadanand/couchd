import React, { useState, useEffect, useRef } from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { motion, AnimatePresence } from 'framer-motion';
import VideoPlayer from './VideoPlayer'; // Adjust the path as needed
import NotesInput from './common/Notes'; // Ensure this path is correct
import Rating from './Rating'; // Ensure this path is correct

const YouTubeCard = ({
  id, title, medium, length, date, created_at, synopsis, image, url, creator, addedBy, status, notes, rating, onDelete, onNotesChange, onStatusChange, onRatingChange, index, isOpen, setIsOpen
}) => {
  const [localRating, setLocalRating] = useState(rating || 0); // Default rating to 0
  const [localStatus, setLocalStatus] = useState(status || 'to consume');
  const [notesOpen, setNotesOpen] = useState(false);
  const hasChanges = useRef(false);

  useEffect(() => {
    setLocalRating(rating || 0);
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

  return (
    <Draggable draggableId={id.toString()} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className="movie-card p-1 overflow-hidden flex flex-col relative"
          style={{ marginBottom: '10px', transform: `translateY(${index * -5}px)` }}
        >
          <div className="movie-card-header w-auto justify-between flex items-center">
            <div className="flex items-center">
              <div className="medium-icon pl-3 cursor-move" {...provided.dragHandleProps}>
                <svg height="25px" width="25px" viewBox="0 0 461.001 461.001" fill="#000000" xmlns="http://www.w3.org/2000/svg">
                  <path d="M365.257,67.393H95.744C42.866,67.393,0,110.259,0,163.137v134.728c0,52.878,42.866,95.744,95.744,95.744h269.513c52.878,0,95.744-42.866,95.744-95.744V163.137C461.001,110.259,418.135,67.393,365.257,67.393z M300.506,237.056l-126.06,60.123c-3.359,1.602-7.239-0.847-7.239-4.568V168.607c0-3.774,3.982-6.22,7.348-4.514l126.06,63.881C304.363,229.873,304.298,235.248,300.506,237.056z" fill="currentColor"/>
                </svg>
              </div>
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
                  <div className="w-1/2 mb-4">
                    <VideoPlayer url={url} title={title} />
                  </div>
                  <div className="w-1/2 pl-4 flex flex-col justify-between">
                    <div>
                      <div className="text-sm text-gray-400 text-right">
                        Added by <span className="underline">{addedBy}</span>
                        <div>{formatDate(created_at)}</div>
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

export default YouTubeCard;
