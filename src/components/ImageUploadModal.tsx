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

  const handleUpload = async () => {
    setLoading(true);
    try {
      let publicUrl = currentImage;

      if (image) {
        const fileExt = image.name.split('.').pop();
        const fileName = `${watchlistId}_${Date.now()}.${fileExt}`;
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

      setLoading(false);
      onImageUpload(publicUrl);
      onClose();
    } catch (error) {
      console.error('Unexpected error:', error);
      setLoading(false);
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
    if (e.target.files && e.target.files[0]) {
      const selectedImage = e.target.files[0];
      setImage(selectedImage);

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
                <input type="file" className="hidden" onChange={handleImageChange} />
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
            />
            <textarea
              value={description}
              onChange={handleDescriptionChange}
              className="w-full p-2 mb-2 border border-[#535353] rounded bg-[#3e3d3d] text-[#f6f6f6] focus:outline-none"
              placeholder="Description"
              style={{ height: '6.40rem' }}
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
          />
          <div className="mt-2 space-y-2">
            {filteredFriends.map((friend) => (
              <div key={friend.id} className="flex justify-between items-center">
                <span className="text-[#f6f6f6]">{friend.username}</span>
                <button
                  onClick={() => handleShareToggle(friend.id)}
                  className={`px-2 py-1 rounded ${
                    pendingShares.includes(friend.id) ? 'bg-green-500' : 'bg-blue-500'
                  } text-white`}
                >
                  {pendingShares.includes(friend.id) ? 'Shared' : 'Share'}
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-end mt-4">
          <button
            onClick={handleUpload}
            className="save-button text-white py-2 px-4 rounded-lg"
            disabled={loading}
          >
            {loading ? 'Uploading...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageUploadModal; 