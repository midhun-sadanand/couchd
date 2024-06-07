import React, { useState, useContext, useEffect } from 'react';
import { Modal, Button, Input, AutoComplete, useToasts, useTheme, Note } from '@geist-ui/core';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { SupabaseContext } from '../utils/auth';

const AddWatchlistModal = ({ user, visible, onClose, options, setOptions, setWatchlists, watchlists }) => {
  const [watchlistName, setWatchlistName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const { user: clerkUser } = useUser();
  const { client: supabase } = useContext(SupabaseContext);
  const { setToast } = useToasts();
  const theme = useTheme();
  const navigate = useNavigate();

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

    // Check if watchlist with the same name already exists
    if (watchlists.some(list => list.name === watchlistName)) {
      setErrorMessage(`A watchlist named '${watchlistName}' already exists!`);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('watchlists')
        .insert([{ name: watchlistName, user_id: clerkUser.id, description, tags }])
        .select();

      if (error) throw error;

      setWatchlists([...watchlists, ...data]);
      navigate(`/list/${user.username}/${watchlistName}`, { state: { successMessage: `Watchlist '${watchlistName}' created successfully!` } });
    } catch (error) {
      setErrorMessage(`Error creating watchlist: ${error.message}`);
    }
  };

  const handleTagInput = (currentValue) => {
    setTagInput(currentValue);
    if (!currentValue.trim()) {
      setOptions(options.length ? options : []);
      return;
    }
    const relatedOptions = [...new Set(watchlists.flatMap(list => list.tags))]
      .filter(tag => tag.toLowerCase().includes(currentValue.toLowerCase()))
      .map(tag => ({ label: tag, value: tag }));
    const createOption = { value: currentValue.trim(), label: `Add "${currentValue.trim()}"` };

    setOptions(relatedOptions.length ? [...relatedOptions, createOption] : [createOption]);
  };

  const addTag = (tag) => {
    if (tag && !tags.includes(tag.trim())) {
      setTags(prevTags => [...prevTags, tag.trim()]);
    }
    setTagInput('');
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && tagInput) {
      event.preventDefault();
      addTag(tagInput);
      setTimeout(() => setOptions([]), 100);
    }
  };

  const removeTag = (index) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const resetModal = () => {
    setWatchlistName('');
    setDescription('');
    setTags([]);
    setTagInput('');
    setOptions([]);
    setErrorMessage('');
    onClose();
  };

  return (
    <Modal visible={visible} onClose={resetModal} width="40rem" style={{ backgroundColor: theme.palette.background, color: theme.palette.foreground }}>
      <Modal.Title>Create A New Watchlist</Modal.Title>
      <Modal.Content>
        {errorMessage && (
          <Note className="custom-error-note" label={false}>
            {errorMessage}
          </Note>
        )}
        <Input
          width="100%"
          label="Watchlist Name"
          placeholder="Enter Watchlist Name"
          value={watchlistName}
          onChange={(e) => setWatchlistName(e.target.value)}
          mb={1}
        />
        <Input
          width="100%"
          label="Description"
          placeholder="Enter Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          mb={1}
        />
        <AutoComplete
          label="Tags"
          width="100%"
          options={options}
          placeholder="Enter tag and press enter"
          onSearch={handleTagInput}
          clearable
          disableFreeSolo
          value={tagInput}
          onChange={setTagInput}
          onKeyPress={handleKeyPress}
          mb={1}
        />
        <div className="flex flex-wrap mt-2">
          {tags.map((tag, index) => (
            <div key={index} className="modal-tag flex items-center mr-2 mb-2">
              {tag}
              <Button
                auto
                size="mini"
                type="abort"
                onClick={() => removeTag(index)}
                className="tag-button"
              >
                &times;
              </Button>
            </div>
          ))}
        </div>
      </Modal.Content>
      <Modal.Action onClick={resetModal} type="abort">Cancel</Modal.Action>
      <Modal.Action onClick={createWatchlist}>Create</Modal.Action>
    </Modal>
  );
};

export default AddWatchlistModal;
