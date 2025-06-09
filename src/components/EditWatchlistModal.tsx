import React, { useState, useEffect } from 'react';
import { useSupabase } from '../utils/auth'; // Import the useSupabase hook
import ShareWatchlist from './ShareWatchlist';

interface User {
  id: string;
  username: string;
}

interface EditWatchlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentName: string;
  currentDescription: string;
  currentTags: string[];
  watchlistId: string;
  currentImage?: string;
  onSubmit: (newName: string, newDescription: string, newTags: string[], newImage?: string) => void;
}

const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const EditWatchlistModal: React.FC<EditWatchlistModalProps> = ({
  isOpen,
  onClose,
  currentName,
  currentDescription,
  currentTags,
  watchlistId,
  currentImage = '',
  onSubmit,
}) => {
  const [newName, setNewName] = useState(currentName);
  const [newDescription, setNewDescription] = useState(currentDescription);
  const [newTags, setNewTags] = useState(Array.isArray(currentTags) ? currentTags.join(', ') : '');
  const [friends, setFriends] = useState<User[]>([]);
  const [sharedUsers, setSharedUsers] = useState<User[]>([]);
  const [pendingShares, setPendingShares] = useState<string[]>([]);
  const [image, setImage] = useState<File | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState(currentImage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { client: supabase } = useSupabase();

  // Fetch friends and shared users when the modal opens
  useEffect(() => {
    if (isOpen) {
      fetchFriends();
      fetchSharedUsers();
    }
  }, [isOpen, watchlistId]);

  const fetchFriends = async () => {
    try {
      const { data: friendsData, error: friendsError } = await supabase
        .from('friends')
        .select('friend_id, profiles:friend_id (id, username)')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

      if (friendsError) throw friendsError;

      const formattedFriends = friendsData
        .map((friend: any) => friend.profiles)
        .filter(Boolean);
      setFriends(formattedFriends);
    } catch (error) {
      console.error('Error fetching friends:', error);
    }
  };

  const fetchSharedUsers = async () => {
    try {
      const { data: sharedData, error: sharedError } = await supabase
        .from('watchlist_sharing')
        .select('shared_with_user_id, profiles:shared_with_user_id (id, username)')
        .eq('watchlist_id', watchlistId);

      if (sharedError) throw sharedError;

      const formattedSharedUsers = sharedData
        .map((share: any) => share.profiles)
        .filter(Boolean);
      setSharedUsers(formattedSharedUsers);
      setPendingShares(formattedSharedUsers.map((user: User) => user.id));
    } catch (error) {
      console.error('Error fetching shared users:', error);
    }
  };

  const validateFile = (file: File): boolean => {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setError('Please upload a valid image file (JPEG, PNG, GIF, or WebP)');
      return false;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError('File size should be less than 5MB');
      return false;
    }

    return true;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!validateFile(file)) {
      e.target.value = ''; // Reset input
      return;
    }

    setImage(file);
    setError(null);

    const reader = new FileReader();
    reader.onload = () => {
      setCurrentImageUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleShareToggle = async (userId: string) => {
    try {
      if (pendingShares.includes(userId)) {
        // Remove share
        const { error } = await supabase
          .from('watchlist_sharing')
          .delete()
          .match({ watchlist_id: watchlistId, shared_with_user_id: userId });

        if (error) throw error;
        setPendingShares(pendingShares.filter(id => id !== userId));
        setSharedUsers(sharedUsers.filter(user => user.id !== userId));
      } else {
        // Add share
        const { error } = await supabase
          .from('watchlist_sharing')
          .insert([{ watchlist_id: watchlistId, shared_with_user_id: userId }]);

        if (error) throw error;
        setPendingShares([...pendingShares, userId]);
        const newSharedUser = friends.find(friend => friend.id === userId);
        if (newSharedUser) {
          setSharedUsers([...sharedUsers, newSharedUser]);
        }
      }
    } catch (error) {
      console.error('Error toggling share:', error);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setUploadProgress(0);

    try {
      let publicUrl = currentImageUrl;

      if (image) {
        const fileExt = image.name.split('.').pop();
        const fileName = `user_${(await supabase.auth.getUser()).data.user?.id}_${Date.now()}.${fileExt}`;
        const filePath = fileName;

        // Delete old image if it exists
        if (currentImageUrl && currentImageUrl !== currentImage) {
          const oldFilePath = currentImageUrl.split('/').pop()?.split('?')[0];
          if (oldFilePath) {
            const { error: deleteError } = await supabase.storage
              .from('images')
              .remove([oldFilePath]);

            if (deleteError) {
              console.error('Error deleting old image:', deleteError.message);
            }
          }
        }

        // Upload new image with progress tracking
        const { error: uploadError } = await supabase.storage
          .from('images')
          .upload(filePath, image, {
            cacheControl: '3600',
            upsert: false,
            onUploadProgress: (progress: { loaded: number; total: number }) => {
              const percent = (progress.loaded / progress.total) * 100;
              setUploadProgress(Math.round(percent));
            },
          });

        if (uploadError) {
          throw new Error(`Error uploading image: ${uploadError.message}`);
        }

        // Get signed URL
        const { data: { signedUrl }, error: urlError } = await supabase.storage
          .from('images')
          .createSignedUrl(filePath, 31536000); // 1 year expiry

        if (urlError) {
          throw new Error(`Error getting signed URL: ${urlError.message}`);
        }

        publicUrl = signedUrl;
      }

      // Parse tags
      const parsedTags = newTags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      // Update the watchlist in the backend
      const { error: updateError } = await supabase
        .from('watchlists')
        .update({ 
          name: newName, 
          description: newDescription, 
          tags: parsedTags,
          image: publicUrl
        })
        .eq('id', watchlistId);

      if (updateError) {
        throw new Error(`Error updating watchlist: ${updateError.message}`);
      }

      // Optimistically update the UI
      onSubmit(newName, newDescription, parsedTags, publicUrl);
      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
      console.error('Upload error:', error);
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 z-50">
      <div className="bg-[#262626] rounded-lg p-4 w-200 transform transition-transform duration-300">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl text-[#f6f6f6]">Edit watchlist</h2>
          <button onClick={onClose} className="text-[#f6f6f6]">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        )}

        <div className="flex space-x-4">
          <div className="relative w-40 h-40">
            <img
              src={currentImageUrl || 'https://via.placeholder.com/150'}
              alt="Watchlist"
              className="w-full h-full object-cover rounded-lg transition-all duration-300"
              onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/150')}
            />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-all duration-300 hover:opacity-100 bg-black/50 backdrop-blur-sm rounded-lg group">
              <label className="cursor-pointer flex flex-col items-center text-white">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6 mb-2">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                </svg>
                <span className="text-sm font-medium">Choose photo</span>
                <input 
                  type="file" 
                  className="hidden" 
                  onChange={handleImageChange}
                  accept={ALLOWED_FILE_TYPES.join(',')}
                  disabled={loading}
                />
              </label>
            </div>
          </div>
          <div className="flex flex-col space-y-2 flex-grow">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full p-2 mb-2 border border-[#535353] rounded bg-[#3e3d3d] text-[#f6f6f6] focus:outline-none"
              placeholder="Name"
              disabled={loading}
            />
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              className="w-full p-2 mb-2 border border-[#535353] rounded bg-[#3e3d3d] text-[#f6f6f6] focus:outline-none"
              placeholder="Description"
              style={{ height: '6.40rem' }}
              disabled={loading}
            />
            <input
              type="text"
              value={newTags}
              onChange={(e) => setNewTags(e.target.value)}
              className="w-full p-2 mb-2 border border-[#535353] rounded bg-[#3e3d3d] text-[#f6f6f6] focus:outline-none"
              placeholder="Tags (comma-separated)"
              disabled={loading}
            />
          </div>
        </div>

        <div className="mt-4">
          <ShareWatchlist
            friends={friends}
            sharedUsers={sharedUsers}
            onShareToggle={handleShareToggle}
            pendingShares={pendingShares}
          />
        </div>

        {loading && (
          <div className="mt-4">
            <div className="w-full bg-[#3e3d3d] rounded-full h-2">
              <div
                className="bg-[#1DB954] h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-sm text-[#f6f6f6] mt-2 text-center">
              {uploadProgress === 100 ? 'Finalizing...' : `Uploading... ${uploadProgress}%`}
            </p>
          </div>
        )}

        <div className="flex items-center justify-end mt-4">
          <button
            onClick={handleSubmit}
            className="save-button text-white py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditWatchlistModal; 