import React, { useState } from 'react';

interface NotesInputProps {
  initialNotes: string;
  onChange: (notes: string) => void;
}

const NotesInput: React.FC<NotesInputProps> = ({ initialNotes, onChange }) => {
  const [notes, setNotes] = useState(initialNotes);

  const handleBlur = () => {
    onChange(notes);
  };

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(event.target.value);
  };

  return (
    <div className="">
      <textarea
        className="notes w-full p-2 bg-gray-500 text-gray-800 rounded"
        rows={4}
        value={notes}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder="Add your notes here..."
      />
    </div>
  );
};

export default NotesInput; 