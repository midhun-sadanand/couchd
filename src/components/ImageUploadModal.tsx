import React, { useState, useEffect, useRef } from 'react';
import { useSupabaseClient } from '@/utils/auth';
import debounce from 'lodash/debounce';

interface ImageUploadModalProps {
  watchlistId: string;
  onClose: () => void;
  sharedUsers: any[];
  friends: any[];
  onImageUpload: (imageUrl: string) => void;
  watchlistName: string;
  watchlistDescription: string;
  watchlistImage: string;
}

const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const ImageUploadModal: React.FC<ImageUploadModalProps> = ({
  watchlistId,
  onClose,
  sharedUsers,
  friends,
  onImageUpload,
  watchlistName,
  watchlistDescription,
  watchlistImage,
}) => {
  const supabase = useSupabaseClient();
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(watchlistName);
  const [description, setDescription] = useState(watchlistDescription);
  const [currentImage, setCurrentImage] = useState(watchlistImage);
  const [isPublic, setIsPublic] = useState(false);
  const [pendingShares, setPendingShares] = useState(sharedUsers.map(user => user.id));
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredFriends, setFilteredFriends] = useState(friends);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setName(watchlistName);
    setDescription(watchlistDescription);
    setCurrentImage(watchlistImage);
    setPendingShares(sharedUsers.map(user => user.id));
    setError(null);
    setUploadProgress(0);

    const fetchPublicState = async () => {
      try {
        const { data: watchlist, error } = await supabase
          .from('watchlists')
          .select('is_public')
          .eq('id', watchlistId)
          .single();

        if (error) {
          console.error('Error fetching is_public state:', error.message);
        } else {
          setIsPublic(watchlist.is_public);
        }
      } catch (error) {
        console.error('Unexpected error fetching is_public state:', error);
      }
    };

    fetchPublicState();
  }, [watchlistName, watchlistDescription, watchlistImage, watchlistId, sharedUsers, supabase]);

  useEffect(() => {
    const filtered = friends.filter(friend =>
      friend.username.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredFriends(filtered);
  }, [searchQuery, friends]);

  const handleShareToggle = (friendId: string) => {
    setPendingShares(prev => {
      if (prev.includes(friendId)) {
        return prev.filter(id => id !== friendId);
      } else {
        return [...prev, friendId];
      }
    });
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

  const handleUpload = async () => {
    setLoading(true);
    setError(null);
    setUploadProgress(0);

    try {
      let publicUrl = currentImage;

      if (image) {
        if (!validateFile(image)) {
          setLoading(false);
          return;
        }

        const fileExt = image.name.split('.').pop();
        const fileName = `${watchlistId}_${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        // Delete old image if it exists
        if (currentImage && currentImage !== watchlistImage) {
          const oldFilePath = currentImage.split('/').pop();
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

        // Get public URL
        const { data: { publicUrl: newPublicUrl }, error: urlError } = await supabase.storage
          .from('images')
          .getPublicUrl(filePath);

        if (urlError) {
          throw new Error(`Error getting public URL: ${urlError.message}`);
        }

        publicUrl = newPublicUrl;
      }

      // Update watchlist details
      const { error: updateError } = await supabase
        .from('watchlists')
        .update({ 
          image: publicUrl, 
          name, 
          description, 
          is_public: isPublic 
        })
        .eq('id', watchlistId);

      if (updateError) {
        throw new Error(`Error updating watchlist: ${updateError.message}`);
      }

      // Update sharing settings
      const { error: shareError } = await supabase
        .from('watchlist_sharing')
        .upsert(
          pendingShares.map(userId => ({
            watchlist_id: watchlistId,
            user_id: userId,
          }))
        );

      if (shareError) {
        console.error('Error updating sharing settings:', shareError.message);
      }

      onImageUpload(publicUrl);
      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
      console.error('Upload error:', error);
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const updateDescription = debounce(async (newDescription: string) => {
    try {
      const { error } = await supabase
        .from('watchlists')
        .update({ description: newDescription })
        .eq('id', watchlistId);

      if (error) {
        console.error('Error updating description:', error.message);
      }
    } catch (error) {
      console.error('Unexpected error updating description:', error);
    }
  }, 500);

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
      setCurrentImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newDescription = e.target.value;
    setDescription(newDescription);
    updateDescription(newDescription);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  const handleClickOutside = (e: MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown as any);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown as any);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [description, isPublic]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 z-50">
      <div
        ref={modalRef}
        className="bg-[#262626] rounded-lg p-4 w-200 transform transition-transform duration-300"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl text-[#f6f6f6]">Edit watchlist</h2>
          <div className="flex items-center">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="mr-2"
              />
              <span className="text-[#f6f6f6]">Public</span>
            </label>
          </div>
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
              src={currentImage}
              alt="Watchlist"
              className="w-full h-full object-cover rounded-lg transition-opacity duration-300"
              onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/150')}
              onMouseEnter={(e) => e.currentTarget.classList.add('opacity-50')}
              onMouseLeave={(e) => e.currentTarget.classList.remove('opacity-50')}
            />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 hover:opacity-100">
              <label className="cursor-pointer flex flex-col items-center text-white">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                </svg>
                <span>Choose photo</span>
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
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 mb-2 border border-[#535353] rounded bg-[#3e3d3d] text-[#f6f6f6] focus:outline-none"
              placeholder="Name"
              disabled={loading}
            />
            <textarea
              value={description}
              onChange={handleDescriptionChange}
              className="w-full p-2 mb-2 border border-[#535353] rounded bg-[#3e3d3d] text-[#f6f6f6] focus:outline-none"
              placeholder="Description"
              style={{ height: '6.40rem' }}
              disabled={loading}
            />
          </div>
        </div>

        <div className="mt-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-2 border border-[#535353] rounded bg-[#3e3d3d] text-[#f6f6f6] focus:outline-none"
            placeholder="Search friends..."
            disabled={loading}
          />
          <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
            {filteredFriends.map((friend) => (
              <div key={friend.id} className="flex justify-between items-center">
                <span className="text-[#f6f6f6]">{friend.username}</span>
                <button
                  onClick={() => handleShareToggle(friend.id)}
                  className={`px-2 py-1 rounded ${
                    pendingShares.includes(friend.id) ? 'bg-green-500' : 'bg-blue-500'
                  } text-white`}
                  disabled={loading}
                >
                  {pendingShares.includes(friend.id) ? 'Shared' : 'Share'}
                </button>
              </div>
            ))}
          </div>
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
            onClick={handleUpload}
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

export default ImageUploadModal; 