import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';

interface AddWatchlistModalProps {
  user: {
    id: string;
    username: string;
  };
  visible: boolean;
  onClose: () => void;
  options: { label: string; value: string }[];
  setOptions: (options: { label: string; value: string }[]) => void;
  setWatchlists: (watchlists: any[]) => void;
  watchlists: any[];
}

const AddWatchlistModal: React.FC<AddWatchlistModalProps> = ({ 
  user, 
  visible, 
  onClose, 
  options, 
  setOptions, 
  setWatchlists, 
  watchlists 
}) => {
  const [watchlistName, setWatchlistName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!visible) {
      resetModal();
    }
  }, [visible]);

  const createWatchlist = async () => {
    if (!watchlistName.trim()) {
      setErrorMessage('Watchlist name cannot be empty.');
      return;
    }
    if (watchlists.some(list => list.name === watchlistName)) {
      setErrorMessage(`A watchlist named '${watchlistName}' already exists!`);
      return;
    }
    
    setIsCreating(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/watchlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: watchlistName,
          description,
          isPublic,
          userId: user.id,
          tags,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create watchlist');
      }

      const newWatchlist = await response.json();
      setWatchlists([...watchlists, newWatchlist]);
      
      // Invalidate watchlists cache to refetch data
      queryClient.invalidateQueries({ queryKey: ['watchlists', user.id] });
      
      router.push(`/watchlist/${newWatchlist.id}`);
      resetModal();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to create watchlist');
    } finally {
      setIsCreating(false);
    }
  };

  const handleTagInput = (value: string) => {
    setTagInput(value);
    if (!value.trim()) {
      setOptions([]);
      return;
    }
    const relatedOptions = [...new Set(watchlists.flatMap((list: any) => list.tags || []))]
      .filter((tag: string) => tag.toLowerCase().includes(value.toLowerCase()))
      .map((tag: string) => ({ label: tag, value: tag }));
    setOptions(relatedOptions);
  };

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags(prev => [...prev, trimmed]);
    }
    setTagInput('');
    setOptions([]);
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && tagInput.trim()) {
      event.preventDefault();
      addTag(tagInput);
    }
  };

  const removeTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const resetModal = () => {
    setWatchlistName('');
    setDescription('');
    setTags([]);
    setTagInput('');
    setOptions([]);
    setErrorMessage('');
    setIsPublic(false);
    onClose();
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm">
      <div className="bg-[#1a1a1a] rounded-2xl p-8 w-full max-w-2xl relative shadow-2xl border border-[#333333]">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-eina-bold text-white">Create A New Watchlist</h2>
          <div className="flex items-center gap-4">
            {/* Private/Public Toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPublic(!isPublic)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  isPublic ? 'bg-[#4a4a4a]' : 'bg-[#2a2a2a]'
                } border border-[#3a3a3a]`}
              >
                <div
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                    isPublic ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
              <span className="text-sm text-[#cccccc] font-eina">{isPublic ? 'Public' : 'Private'}</span>
            </div>
            <button 
              onClick={resetModal}
              className="text-[#666666] hover:text-white transition-colors text-2xl font-light w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#2a2a2a]"
            >
              ×
            </button>
          </div>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="mb-4 px-4 py-3 bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg">
            <p className="text-[#d4a5a5] text-sm font-eina">{errorMessage}</p>
          </div>
        )}

        {/* Form */}
        <div className="space-y-5">
          {/* Watchlist Name */}
          <div>
            <label className="block text-[#cccccc] text-sm font-eina-bold mb-2">
              Watchlist Name
            </label>
            <input
              type="text"
              value={watchlistName}
              onChange={(e) => setWatchlistName(e.target.value)}
              placeholder="Enter Watchlist Name"
              className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg text-white placeholder-[#666666] px-4 py-3 focus:outline-none focus:border-[#4a4a4a] focus:bg-[#2f2f2f] transition-all font-eina"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[#cccccc] text-sm font-eina-bold mb-2">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter Description"
              className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg text-white placeholder-[#666666] px-4 py-3 focus:outline-none focus:border-[#4a4a4a] focus:bg-[#2f2f2f] transition-all font-eina"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-[#cccccc] text-sm font-eina-bold mb-2">
              Tags
            </label>
            <div className="relative">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => handleTagInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter tag and press enter"
                className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg text-white placeholder-[#666666] px-4 py-3 focus:outline-none focus:border-[#4a4a4a] focus:bg-[#2f2f2f] transition-all font-eina"
              />
              
              {/* Tag suggestions dropdown */}
              {options.length > 0 && tagInput && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg shadow-2xl max-h-40 overflow-y-auto z-10">
                  {options.map((option, idx) => (
                    <button
                      key={idx}
                      onClick={() => addTag(option.value)}
                      className="w-full px-4 py-2 text-left text-white hover:bg-[#3a3a3a] transition-colors text-sm font-eina"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selected tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {tags.map((tag, index) => (
                  <div 
                    key={index} 
                    className="flex items-center gap-2 px-3 py-1.5 bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg text-white text-sm font-eina"
                  >
                    {tag}
                    <button
                      onClick={() => removeTag(index)}
                      className="text-[#999999] hover:text-white transition-colors"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-[#3a3a3a]">
          <button
            onClick={resetModal}
            className="px-6 py-2.5 bg-[#2a2a2a] border border-[#3a3a3a] text-white rounded-lg hover:bg-[#363636] transition-colors font-einasemibold"
          >
            Cancel
          </button>
          <button
            onClick={createWatchlist}
            disabled={isCreating || !watchlistName.trim()}
            className="px-6 py-2.5 bg-[#3a3a3a] text-white rounded-lg hover:bg-[#454545] disabled:bg-[#2a2a2a] disabled:text-[#666666] disabled:cursor-not-allowed transition-colors font-einasemibold"
          >
            {isCreating ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddWatchlistModal;
