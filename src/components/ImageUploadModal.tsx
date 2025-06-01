import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useUser, useSession } from '@clerk/clerk-react';
import { useRouter } from 'next/router';
import { Toggle } from '@geist-ui/core';
import { useSupabase } from '../utils/auth';
import debounce from 'lodash/debounce';
import ShareWatchlist from './ShareWatchlist';

interface User {
  id: string;
  username: string;
  // Add other user properties as needed
}

interface ImageUploadModalProps {
  watchlistId: string;
  onClose: (description: string, isPublic: boolean, sharedUsers: User[]) => void;
  sharedUsers: User[];
  friends: User[];
  onImageUpload: (imageUrl: string) => void;
  watchlistName: string;
  watchlistDescription: string;
  watchlistImage: string;
  username: string;
  addSharedUser: (user: User) => void;
  removeSharedUser: (userId: string) => void;
  updateSharedUsers: (users: User[]) => void;
}

const ImageUploadModal: React.FC<ImageUploadModalProps> = ({
  watchlistId,
  onClose,
  sharedUsers,
  friends,
  onImageUpload,
  watchlistName,
  watchlistDescription,
  watchlistImage,
  username,
  addSharedUser,
  removeSharedUser,
  updateSharedUsers,
}) => {
  const { user: clerkUser } = useUser();
  const { session } = useSession();
  const router = useRouter();
  const supabase = useSupabase();
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(watchlistName);
  const [description, setDescription] = useState(watchlistDescription);
  const [currentImage, setCurrentImage] = useState(watchlistImage);
  const [isPublic, setIsPublic] = useState(false);
  const [toggleLoading, setToggleLoading] = useState(true);
  const [pendingShares, setPendingShares] = useState(sharedUsers.map(user => user.id));
  const [animationClass, setAnimationClass] = useState('modal-enter');
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setName(watchlistName);
    setDescription(watchlistDescription);
    setCurrentImage(watchlistImage);
    setPendingShares(sharedUsers.map(user => user.id));

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
      } finally {
        setToggleLoading(false);
      }
    };

    fetchPublicState();
  }, [watchlistName, watchlistDescription, watchlistImage, watchlistId, sharedUsers, supabase]);

  const handleShareToggle = (friendId: string) => {
    setPendingShares(prev => {
      if (prev.includes(friendId)) {
        return prev.filter(id => id !== friendId);
      } else {
        return [...prev, friendId];
      }
    });
  };

  const handleUpload = async () => {
    setLoading(true);
    try {
      let publicUrl = currentImage;

      if (image) {
        const fileExt = image.name.split('.').pop();
        const fileName = `${clerkUser?.id}_${watchlistId}_${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { data: oldImage, error: fetchError } = await supabase
          .from('watchlists')
          .select('image')
          .eq('id', watchlistId)
          .single();

        if (fetchError) {
          console.error('Error fetching existing image:', fetchError.message);
        } else if (oldImage && oldImage.image) {
          const oldFilePath = oldImage.image.split('/').pop();
          const { error: deleteError } = await supabase.storage
            .from('images')
            .remove([oldFilePath]);

          if (deleteError) {
            console.error('Error deleting old image:', deleteError.message);
          }
        }

        const { error: uploadError } = await supabase.storage
          .from('images')
          .upload(filePath, image);

        if (uploadError) {
          console.error('Error uploading image:', uploadError.message);
          setLoading(false);
          return;
        }

        const { data: { signedUrl }, error: urlError } = await supabase.storage
          .from('images')
          .createSignedUrl(filePath, 60 * 60 * 24 * 10000);

        if (urlError) {
          console.error('Error generating signed URL:', urlError.message);
          setLoading(false);
          return;
        }

        publicUrl = signedUrl;
      }

      const { error: updateError } = await supabase
        .from('watchlists')
        .update({ image: publicUrl, name, description, is_public: isPublic })
        .eq('id', watchlistId);

      if (updateError) {
        console.error('Error updating watchlist with image URL:', updateError.message);
        setLoading(false);
        return;
      }

      const token = await session?.getToken();
      const payload = { watchlistId, sharedWith: pendingShares };

      await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/watchlists/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const originalSharedUserIds = sharedUsers.map(user => user.id);
      const toShare = pendingShares.filter(id => !originalSharedUserIds.includes(id));
      const toUnshare = originalSharedUserIds.filter(id => !pendingShares.includes(id));

      toShare.forEach(id => {
        const user = friends.find(friend => friend.id === id);
        if (user) addSharedUser(user);
      });

      toUnshare.forEach(id => {
        removeSharedUser(id);
      });

      setLoading(false);
      onImageUpload(publicUrl);
      onClose(description, isPublic, sharedUsers);
      router.push(`/list/${username}/${encodeURIComponent(name)}/${watchlistId}`);
    } catch (error) {
      console.error('Unexpected error:', error);
      setLoading(false);
    }
  };

  const updateDescription = useCallback(
    debounce(async (newDescription: string) => {
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
    }, 500),
    [watchlistId, supabase]
  );

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedImage = e.target.files[0];
      setImage(selectedImage);

      // Optimistically update the current image to the selected image
      const reader = new FileReader();
      reader.onload = () => {
        setCurrentImage(reader.result as string);
      };
      reader.readAsDataURL(selectedImage);
    }
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newDescription = e.target.value;
    setDescription(newDescription);
    updateDescription(newDescription);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault(); // Prevent default focus behavior
      triggerClose();
    }
  };

  const handleClickOutside = (e: MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      triggerClose();
    }
  };

  const triggerClose = () => {
    setAnimationClass('modal-exit');
    setTimeout(() => {
      onClose(description, isPublic, sharedUsers);
    }, 300); // Match the duration of the animation
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [description, isPublic]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 z-50">
      <div
        ref={modalRef}
        className={`bg-[#262626] rounded-lg p-4 w-200 transform transition-transform duration-300 ${animationClass}`}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl text-[#f6f6f6]" style={{ fontFamily: 'EinaSemibold' }}>
            Edit watchlist
          </h2>
          <button
            onClick={() => triggerClose()}
            className="text-gray-400 hover:text-white"
          >
            ×
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded-md text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={handleDescriptionChange}
              className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded-md text-white"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded-md text-white"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Toggle
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              disabled={toggleLoading}
            />
            <span className="text-gray-300">Make public</span>
          </div>
          <ShareWatchlist
            friends={friends}
            sharedUsers={sharedUsers}
            onShareToggle={handleShareToggle}
            pendingShares={pendingShares}
          />
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => triggerClose()}
              className="px-4 py-2 text-gray-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageUploadModal; 