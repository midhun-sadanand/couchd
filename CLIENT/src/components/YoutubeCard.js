import React, { useState, useEffect, useRef } from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { motion, AnimatePresence } from 'framer-motion';
import { CSSTransition } from 'react-transition-group'; 
import VideoPlayer from './VideoPlayer'; // Adjust the path as needed
import NotesInput from './common/Notes'; // Ensure this path is correct
import Rating from './Rating'; // Ensure this path is correct
import { createPortal } from 'react-dom';

const YouTubeCard = ({
  id, title, medium, length, date, created_at, synopsis, image, url, creator, addedBy, status, notes, rating, onDelete, onNotesChange, onStatusChange, onRatingChange, index, isOpen, setIsOpen
}) => {
  const [localRating, setLocalRating] = useState(rating || 0); // Default rating to 0
  const [localStatus, setLocalStatus] = useState(status || 'to consume');
  const [notesOpen, setNotesOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const hasChanges = useRef(false);
  const statusButtonRef = useRef(null);
  const dropdownRef = useRef(null);

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
    const oldStatus = localStatus;
    setLocalStatus(newStatus);
    setIsStatusDropdownOpen(false);
    hasChanges.current = true;

    onStatusChange(id, newStatus, oldStatus).catch((error) => {
      setLocalStatus(oldStatus);
      console.error('Error updating status:', error.message);
    });
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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        !statusButtonRef.current.contains(event.target)
      ) {
        setIsStatusDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleStatusDropdown = () => {
    setIsStatusDropdownOpen((prev) => !prev);
  };

  const statusColorClass = (status) => {
    switch (status) {
      case 'to consume':
        return 'bg-[#B4B4B4]';
      case 'consuming':
        return 'bg-[#909090]';
      case 'consumed':
        return 'bg-[#636363]';
      default:
        return 'bg-gray-500';
    }
  };

  const renderDropdown = () => {
    const otherStatuses = ['to consume', 'consuming', 'consumed'].filter(
      (option) => option !== localStatus
    );
  
    return createPortal(
      <CSSTransition
        in={isStatusDropdownOpen}
        timeout={200}
        classNames="dropdown"
        unmountOnExit
      >
        <div
          ref={dropdownRef}
          className="absolute w-40 bg-[#3b3b3b] text-white rounded-md shadow-lg z-50"
          style={{
            top: `${statusButtonRef.current?.getBoundingClientRect().bottom + window.scrollY + 4}px`,
            left: `${statusButtonRef.current?.getBoundingClientRect().left}px`,
            zIndex: 1000,
            width: `${statusButtonRef.current?.getBoundingClientRect().width}px`,
          }}
        >
          <ul className="py-1 text-sm">
            {otherStatuses.map((option) => (
              <li
                key={option}
                className="status-dropdown-item hover:bg-gray-600"
                onClick={() => handleStatusChange(option)}
              >
                {option}
              </li>
            ))}
          </ul>
        </div>
      </CSSTransition>,
      document.body
    );
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
            <div className="flex items-center relative">
              <div className="relative">
                <button
                  ref={statusButtonRef}
                  className={`status-indicator ${statusColorClass(localStatus)} text-white px-3 py-2 rounded focus:outline-none flex items-center justify-between w-40`}
                  onClick={toggleStatusDropdown}
                  style={{ width: '125px' }} // Adjust this value to make the button narrower

                >
                  <span className="">{localStatus}</span>
                  <svg
                    className={`w-5 h-5 ml-2 transition-transform duration-200 ${
                      isStatusDropdownOpen ? 'rotate-180' : 'rotate-0'
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {renderDropdown()}
              </div>
              <button onClick={() => onDelete(id)} className="remove-button py-2 px-4 ml-2 text-red-500 hover:text-red-700 focus:outline-none">
                Delete
              </button>
              <button onClick={handleToggle} className="p-2 ml-2 focus:outline-none">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={`w-6 h-6 transition-transform duration-200 ${isOpen ? 'rotate-180' : 'rotate-0'}`}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
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
                  <AnimatePresence>
                    {notesOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <NotesInput
                          initialNotes={notes}
                          onChange={(newNotes) => onNotesChange(id, newNotes)}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
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
