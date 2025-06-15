import React, { useState, useEffect } from 'react';

interface NotesInputProps {
  initialNotes: string;
  onChange: (notes: string) => void;
}

const NotesInput: React.FC<NotesInputProps> = ({ initialNotes, onChange }) => {
  const [notes, setNotes] = useState(initialNotes);

  // Update local state when initialNotes changes
  useEffect(() => {
    setNotes(initialNotes);
  }, [initialNotes]);

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newNotes = event.target.value;
    setNotes(newNotes);
    onChange(newNotes); // Call onChange immediately to update parent state
  };

  return (
    <div className="relative h-full flex-1">
      <textarea
        className="notes w-full h-full p-2 bg-[#1a1a1a] text-white rounded border border-[#333] focus:border-[#444] focus:outline-none resize-none"
        value={notes}
        onChange={handleChange}
        placeholder="Add your notes here..."
        style={{ minHeight: 0 }}
      />
    </div>
  );
};

export default NotesInput; 