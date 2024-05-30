import React, { useState } from 'react';

const NotesInput = ({ initialNotes, onChange }) => {
  const [notes, setNotes] = useState(initialNotes);

  const handleBlur = () => {
    onChange(notes);
  };

  const handleChange = (event) => {
    setNotes(event.target.value);
  };

  return (
    <div className="mt-2">
      <textarea
        className="notes w-full p-2 bg-gray-200 text-gray-800 rounded"
        rows="4"
        value={notes}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder="Add your notes here..."
      />
    </div>
  );
};

export default NotesInput;
