import React, { useState, useEffect } from 'react';
import { Modal, Button, Input, AutoComplete, useToasts, useTheme, Note, Toggle } from '@geist-ui/core';
import { useRouter } from 'next/navigation';

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

const AddWatchlistModal: React.FC<AddWatchlistModalProps> = ({ user, visible, onClose, options, setOptions, setWatchlists, watchlists }) => {
  const [watchlistName, setWatchlistName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const { setToast } = useToasts();
  const theme = useTheme();
  const router = useRouter();

  useEffect(() => {
    if (!visible) {
      resetModal();
    }
  }, [visible]);

  const createWatchlist = async () => {
    if (!watchlistName) {
      setErrorMessage('Watchlist name cannot be empty.');
      return;
    }
    if (watchlists.some(list => list.name === watchlistName)) {
      setErrorMessage(`A watchlist named '${watchlistName}' already exists!`);
      return;
    }
    try {
      const response = await fetch('/api/watchlists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: watchlistName,
          description,
          isPublic,
          userId: user.id,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create watchlist');
      }
      const newWatchlist = await response.json();
      setWatchlists([...watchlists, newWatchlist]);
      router.push(`/watchlist/${newWatchlist.id}`);
      setToast({
        text: `Watchlist '${watchlistName}' created successfully!`,
        type: 'success',
      });
      resetModal();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to create watchlist');
    }
  };

  const handleTagInput = (currentValue: string) => {
    setTagInput(currentValue);
    if (!currentValue.trim()) {
      setOptions(options.length ? options : []);
      return;
    }
    const relatedOptions = [...new Set(watchlists.flatMap((list: any) => list.tags || []))]
      .filter((tag: string) => tag.toLowerCase().includes(currentValue.toLowerCase()))
      .map((tag: string) => ({ label: tag, value: tag }));
    const createOption = { value: currentValue.trim(), label: `Add "${currentValue.trim()}"` };
    setOptions(relatedOptions.length ? [...relatedOptions, createOption] : [createOption]);
  };

  const addTag = (tag: string) => {
    if (tag && !tags.includes(tag.trim())) {
      setTags(prevTags => [...prevTags, tag.trim()]);
    }
    setTagInput('');
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && tagInput) {
      event.preventDefault();
      addTag(tagInput);
      setTimeout(() => setOptions([]), 100);
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

  return (
    <Modal visible={visible} onClose={resetModal} width="40rem">
      <div className="modal-header">
        <Modal.Title>Create A New Watchlist</Modal.Title>
        <div className="toggle-wrapper">
          <Toggle initialChecked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
          <span className="toggle-label">{isPublic ? 'Public' : 'Private'}</span>
        </div>
      </div>
      <Modal.Content>
        {errorMessage && (
          <Note className="custom-error-note" label={false} type="error">
            {errorMessage}
          </Note>
        )}
        <div style={{ marginBottom: '0.5rem' }}>
          <label htmlFor="watchlist-name" className="input-label">Watchlist Name</label>
          <Input
            id="watchlist-name"
            width="100%"
            placeholder="Enter Watchlist Name"
            value={watchlistName}
            onChange={(e) => setWatchlistName(e.target.value)}
            onPointerEnterCapture={() => {}}
            onPointerLeaveCapture={() => {}}
            crossOrigin="anonymous"
          />
        </div>
        <div style={{ marginBottom: '0.5rem' }}>
          <label htmlFor="watchlist-description" className="input-label">Description</label>
          <Input
            id="watchlist-description"
            width="100%"
            placeholder="Enter Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onPointerEnterCapture={() => {}}
            onPointerLeaveCapture={() => {}}
            crossOrigin="anonymous"
          />
        </div>
        <div style={{ marginBottom: '0.5rem' }}>
          <label htmlFor="watchlist-tags" className="input-label">Tags</label>
          <AutoComplete
            id="watchlist-tags"
            width="100%"
            options={options}
            placeholder="Enter tag and press enter"
            onSearch={handleTagInput}
            clearable
            disableFreeSolo
            value={tagInput}
            onChange={setTagInput}
            onKeyPress={handleKeyPress}
            onPointerEnterCapture={() => {}}
            onPointerLeaveCapture={() => {}}
            crossOrigin="anonymous"
          />
        </div>
        <div className="flex flex-wrap mt-2">
          {tags.map((tag, index) => (
            <div key={index} className="modal-tag flex items-center mr-2 mb-2">
              {tag}
              <Button
                auto
                type="abort"
                onClick={() => removeTag(index)}
                className="tag-button"
                onPointerEnterCapture={() => {}}
                onPointerLeaveCapture={() => {}}
                placeholder=""
              >
                &times;
              </Button>
            </div>
          ))}
        </div>
      </Modal.Content>
      <Modal.Action onClick={resetModal} type="abort" onPointerEnterCapture={() => {}} onPointerLeaveCapture={() => {}} placeholder="">Cancel</Modal.Action>
      <Modal.Action onClick={createWatchlist} onPointerEnterCapture={() => {}} onPointerLeaveCapture={() => {}} placeholder="">Create</Modal.Action>
      <style jsx>{`
        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
        }
        .toggle-wrapper {
          display: flex;
          align-items: center;
        }
        .toggle-label {
          margin-left: 8px;
          font-size: 14px;
          color: ${theme.palette.accents_6};
          margin-top: 0;
        }
        .input-label {
          display: block;
          margin-bottom: 0.25rem;
          color: ${theme.palette.accents_6};
          font-size: 1rem;
        }
      `}</style>
    </Modal>
  );
};

export default AddWatchlistModal; 