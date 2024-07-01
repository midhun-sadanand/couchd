import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { Toggle } from '@geist-ui/core';
import supabase from '../utils/supabaseClient';
import debounce from 'lodash.debounce';
import ShareWatchlist from './common/ShareWatchlist';

const ImageUploadModal = ({
  watchlistId,
  onClose,
  onShare,
  onUnshare,
  sharedUsers,
  friends,
  onImageUpload,
  watchlistName,
  watchlistDescription,
  watchlistImage,
  username,
  addSharedUser,
  removeSharedUser,
}) => {
  const { user: clerkUser } = useUser();
  const navigate = useNavigate();
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(watchlistName);
  const [description, setDescription] = useState(watchlistDescription);
  const [currentImage, setCurrentImage] = useState(watchlistImage);
  const [isPublic, setIsPublic] = useState(false);
  const [toggleLoading, setToggleLoading] = useState(true);
  const [pendingShares, setPendingShares] = useState(sharedUsers.map(user => user.id));
  const [animationClass, setAnimationClass] = useState('modal-enter');
  const modalRef = useRef(null);

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
        console.error('Unexpected error fetching is_public state:', error.message);
      } finally {
        setToggleLoading(false);
      }
    };

    fetchPublicState();
  }, [watchlistName, watchlistDescription, watchlistImage, watchlistId, sharedUsers]);

  const handleShareToggle = (friendId) => {
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
        const fileName = `${clerkUser.id}_${watchlistId}_${Date.now()}.${fileExt}`;
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

      const sharedWith = [...pendingShares];
      const { error: sharedError } = await supabase
        .from('watchlists')
        .update({ shared_with: sharedWith })
        .eq('id', watchlistId);

      if (sharedError) {
        console.error('Error updating shared users:', sharedError.message);
        setLoading(false);
        return;
      }

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
      onClose(description, isPublic);
      navigate(`/list/${username}/${encodeURIComponent(name)}/${watchlistId}`);
    } catch (error) {
      console.error('Unexpected error:', error.message);
      setLoading(false);
    }
  };

  const updateDescription = useCallback(
    debounce(async (newDescription) => {
      try {
        const { error } = await supabase
          .from('watchlists')
          .update({ description: newDescription })
          .eq('id', watchlistId);

        if (error) {
          console.error('Error updating description:', error.message);
        }
      } catch (error) {
        console.error('Unexpected error updating description:', error.message);
      }
    }, 500),
    [watchlistId]
  );

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const handleDescriptionChange = (e) => {
    const newDescription = e.target.value;
    setDescription(newDescription);
    updateDescription(newDescription);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault(); // Prevent default focus behavior
      triggerClose();
    }
  };

  const handleClickOutside = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      triggerClose();
    }
  };

  const triggerClose = () => {
    setAnimationClass('modal-exit');
    setTimeout(() => {
      onClose(description, isPublic);
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
          <div className="flex items-center" style={{ marginTop: '-6px', marginRight: '52px' }}>
            {toggleLoading ? (
              <div className="w-12 h-6" />
            ) : (
              <>
                <Toggle
                  type="secondary"
                  initialChecked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                />
                <span className="mt-2 ml-2 text-[#f6f6f6]" style={{ fontFamily: 'EinaRegular' }}>
                  {isPublic ? 'Public' : 'Private'}
                </span>
              </>
            )}
          </div>
          <button onClick={triggerClose} className="text-[#f6f6f6]">
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
              onError={(e) => (e.target.src = 'https://via.placeholder.com/150')}
              onMouseEnter={(e) => e.target.classList.add('opacity-50')}
              onMouseLeave={(e) => e.target.classList.remove('opacity-50')}
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
              style={{
                fontFamily: 'EinaRegular',
              }}
            />
            <textarea
              value={description}
              onChange={handleDescriptionChange}
              className="w-full p-2 mb-2 border border-[#535353] rounded bg-[#3e3d3d] text-[#f6f6f6] focus:outline-none"
              placeholder="Description"
              style={{
                height: '6.40rem',
                fontFamily: 'EinaRegular',
              }}
            />
          </div>
        </div>
        <div className="flex items-center justify-end mt-4">
          <div className="flex items-center" style={{ marginRight: '295px' }}>
            <ShareWatchlist
              friends={friends}
              sharedWith={sharedUsers}
              onShareToggle={handleShareToggle}
              pendingShares={pendingShares}
            />
          </div>
          <button
            onClick={handleUpload}
            className="save-button text-white py-2 px-4 rounded-lg"
            disabled={loading}
            style={{ fontFamily: 'EinaRegular' }}
          >
            {loading ? 'Uploading...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageUploadModal;
