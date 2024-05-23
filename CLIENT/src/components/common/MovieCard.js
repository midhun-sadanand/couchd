import React, { useState } from 'react';
import { sortableHandle } from 'react-sortable-hoc';
import { supabase } from '../../supabaseClient'; // Adjust the path as needed

// Drag handle component
const DragHandle = sortableHandle(() => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="cursor-move w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16"/>
    </svg>
));

const MovieCard = ({ id, title, medium, length, date, synopsis, image, url, onDelete }) => {
    const [open, setOpen] = useState(false);

    const handleIcon = (medium) => {
        switch (medium) {
            case 'Book':
                return <span>📚</span>;
            case 'Movie':
                return <span>🎬</span>;
            case 'YouTube':
                return <span>🎥</span>;
            case 'TV':
                return <span>📺</span>;
            default:
                return null;
        }
    };

    const handleDelete = async () => {
        const { error } = await supabase.from('media_items').delete().match({ id: id });
        if (error) {
            console.error('Error deleting media item:', error.message);
        } else {
            onDelete(id);
        }
    };
    const imageElement = medium === 'YouTube' ? (
        <a href={url} target="_blank" rel="noopener noreferrer">
            <img src={image} alt={title} style={{ width: '10%', height: 'auto' }} />
        </a>
    ) : (
        <a href={`https://myflixerz.to/search/${title.toLowerCase().replace(/ /g, '-')}-${date ? date.substring(0, 4) : ''}`} target="_blank" rel="noopener noreferrer">
            <img src={image} alt={title} style={{ width: '10%', height: 'auto' }} />
        </a>
    );
    

    return (
        <div className="movie-card p-2 overflow-hidden flex flex-col">
            <div className="movie-card-header w-auto justify-between flex items-center">
                <DragHandle />
                <div className="justify-between flex items-center">
                    <div className="medium-icon pl-3">{handleIcon(medium)}</div>
                    <div className="item-title font-bold float-left px-10 py-3 text-xl text-left">
                        {imageElement}
                        {title} {date ? `(${date})` : ''}
                    </div>
                </div>
                <div className="flex items-center float-right">
                    <button onClick={handleDelete} className="remove-button py-2 pr-5 pl-12">Delete</button>
                    <button onClick={() => setOpen(!open)} className="p-2">{open ? 'Hide Details' : 'Show Details'}</button>
                </div>
            </div>
            {open && (
                <div className="p-4">
                    <p>Date Added: {date}</p>
                    <p>Length: {length}</p>
                    <p>Synopsis: {synopsis}</p>
                </div>
            )}
        </div>
    );
};

export default MovieCard;
