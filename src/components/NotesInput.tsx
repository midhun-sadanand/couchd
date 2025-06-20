import React, { useState, useEffect } from 'react';

interface NotesInputProps {
  initialNotes: string;
  onChange: (notes: string) => void;
  onBlur?: () => void;
  fullHeight?: boolean;
}

const NotesInput: React.FC<NotesInputProps> = ({ initialNotes, onChange, onBlur, fullHeight }) => {
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
    <div className={fullHeight ? "relative h-full flex-1" : "relative"}>
      <textarea
        className={fullHeight ? "notes w-full h-full min-h-0 p-2 bg-[#1a1a1a] text-white rounded border border-[#333] focus:border-[#444] focus:outline-none resize-none" : "notes w-full p-2 bg-[#1a1a1a] text-white rounded border border-[#333] focus:border-[#444] focus:outline-none resize-none"}
        value={notes}
        onChange={handleChange}
        onBlur={onBlur}
        placeholder="Add your notes here..."
        style={fullHeight ? { minHeight: 0, height: '100%' } : { minHeight: 0 }}
      />
    </div>
  );
};

export default NotesInput; 