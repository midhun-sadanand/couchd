import React, { useState } from 'react';
import supabase from '../utils/supabaseClient'; // Import your Supabase client

const EditNameModal = ({ isOpen, onClose, currentName, currentDescription, currentTags, onSubmit }) => {
  const [newName, setNewName] = useState(currentName);
  const [newDescription, setNewDescription] = useState(currentDescription);
  const [newTags, setNewTags] = useState(currentTags);

  const handleSubmit = async () => {
    // Update the watchlist in the backend
    const { data, error } = await supabase
      .from('watchlists')
      .update({ name: newName, description: newDescription, tags: newTags })
      .eq('name', currentName); // Update based on the current name or a unique identifier

    if (error) {
      console.error('Error updating watchlist:', error);
    } else {
      // Optimistically update the UI
      onSubmit(newName, newDescription, newTags);
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
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
        </label>
        <label>
          Description:
          <input
            type="text"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
          />
        </label>
        <label>
          Tags:
          <input
            type="text"
            value={newTags}
            onChange={(e) => setNewTags(e.target.value.split(','))}
          />
        </label>
        <button onClick={handleSubmit}>Submit</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
};

export default EditNameModal;
