import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useSession } from '@clerk/nextjs';
import { useSupabase } from '@/utils/auth';
import { Modal, Button, Input, AutoComplete, useToasts, useTheme, Note, Toggle } from '@geist-ui/core';

interface AddWatchlistModalProps {
  user: {
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
  const [tags, setTags] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter();
  const { user: clerkUser } = useUser();
  const { session } = useSession();
  const { client: supabase } = useSupabase();
  const { setToast } = useToasts();
  const theme = useTheme();

  const handleCreateWatchlist = async () => {
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
      if (!session || !clerkUser) {
        throw new Error('User not authenticated');
      }

      // Call server-side API to create the watchlist and update profiles
      const token = await session.getToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/watchlists`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          watchlistName,
          description,
          tags,
          isPublic,
          userId: clerkUser.id,
          username: user.username,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create watchlist');
      }

      const newWatchlist = await response.json();
      setWatchlists([...watchlists, newWatchlist]);
      router.push(`/list/${user.username}/${encodeURIComponent(watchlistName)}/${newWatchlist.id}`);
      setToast({
        text: `Watchlist '${watchlistName}' created successfully!`,
        type: 'success',
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to create watchlist');
    }
  };

  return (
    <Modal visible={visible} onClose={onClose}>
      <Modal.Title>Create New Watchlist</Modal.Title>
      <Modal.Content>
        <Input
          label="Watchlist Name"
          placeholder="Enter watchlist name"
          value={watchlistName}
          onChange={(e) => setWatchlistName(e.target.value)}
          width="100%"
          mb={1}
        />
        <Input
          label="Description"
          placeholder="Enter description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          width="100%"
          mb={1}
        />
        <AutoComplete
          label="Tags"
          placeholder="Add tags (optional)"
          options={options}
          value={tags}
          onChange={setTags}
          onSearch={(value) => {
            // Update options based on search
            const newOptions = value
              ? options.filter(opt => opt.label.toLowerCase().includes(value.toLowerCase()))
              : options;
            setOptions(newOptions);
          }}
          width="100%"
          mb={1}
          clearable
          disableFreeSolo
        />
        <Toggle
          checked={isPublic}
          onChange={(e) => setIsPublic(e.target.checked)}
          label="Make Public"
        />
        {errorMessage && (
          <Note type="error" label="Error" className="mt-2">
            {errorMessage}
          </Note>
        )}
      </Modal.Content>
      <Modal.Action passive onClick={onClose}>
        Cancel
      </Modal.Action>
      <Modal.Action onClick={handleCreateWatchlist}>
        Create Watchlist
      </Modal.Action>
    </Modal>
  );
};

export default AddWatchlistModal; 