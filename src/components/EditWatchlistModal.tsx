import React, { useState } from 'react';
import { useSupabase } from '../utils/auth'; // Import the useSupabase hook

interface EditWatchlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentName: string;
  currentDescription: string;
  currentTags: string[];
  onSubmit: (newName: string, newDescription: string, newTags: string[]) => void;
}

const EditWatchlistModal: React.FC<EditWatchlistModalProps> = ({
  isOpen,
  onClose,
  currentName,
  currentDescription,
  currentTags,
  onSubmit,
}) => {
  const [name, setName] = useState(currentName);
  const [description, setDescription] = useState(currentDescription);
  const [tags, setTags] = useState(currentTags);
  const { client: supabase, isLoading: supabaseLoading } = useSupabase();

  const handleSubmit = async () => {
    // Update the watchlist in the backend
    const { data, error } = await supabase
      .from('watchlists')
      .update({ name: name, description: description, tags: tags })
      .eq('name', currentName); // Update based on the current name or a unique identifier

    if (error) {
      console.error('Error updating watchlist:', error);
    } else {
      // Optimistically update the UI
      onSubmit(name, description, tags);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal">
      <div className="modal-content">
        <h2>Edit Watchlist</h2>
        <label>
          Name:
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label>
          Description:
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
        <label>
          Tags:
          <input
            type="text"
            value={tags.join(',')}
            onChange={(e) => setTags(e.target.value.split(','))}
          />
        </label>
        <button onClick={handleSubmit}>Submit</button>
        <button onClick={onClose}>Cancel</button>
      </div>
      <div>{supabaseLoading ? 'Loading...' : null}</div>
    </div>
  );
};

export default EditWatchlistModal; 