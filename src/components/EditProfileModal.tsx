import React, { useState, useRef, useEffect } from 'react';
import { X } from '@geist-ui/icons';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (avatarFile: File | null, newBio: string, newUsername: string) => Promise<void>;
  initialAvatarUrl: string;
  initialBio: string;
  initialUsername: string;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialAvatarUrl,
  initialBio,
  initialUsername,
}) => {
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [bio, setBio] = useState(initialBio);
  const [username, setUsername] = useState(initialUsername);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Debug log to check what is being passed from the database
  console.log('EditProfileModal initialBio:', initialBio);
  // Update state when initial values change
  useEffect(() => {
    setAvatarUrl(initialAvatarUrl && initialAvatarUrl.trim() !== '' ? initialAvatarUrl : '/default_pfp.png');
    setBio(initialBio);
    setUsername(initialUsername);
  }, [initialAvatarUrl, initialBio, initialUsername]);

  // Reset file input when modal opens
  useEffect(() => {
    if (isOpen && fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [isOpen]);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const file = fileInputRef.current?.files?.[0] || null;
      await onSave(file, bio, username);
      onClose();
    } catch (err) {
      setError('Failed to save profile changes. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-[#181818] border border-[#232323] rounded-2xl shadow-lg p-6 w-full max-w-md relative flex flex-col items-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X size={24} />
        </button>

        <h2 className="text-2xl font-bold mb-4 text-white text-center">Edit Profile</h2>

        <form onSubmit={handleSubmit} className="space-y-5 w-full">
          <div className="flex flex-col items-center">
            <div
              className="w-20 h-20 rounded-full overflow-hidden cursor-pointer relative group border-2 border-[#444] shadow"
              onClick={handleImageClick}
            >
              <img
                src={avatarUrl || '/default_pfp.png'}
                alt="Profile"
                className="w-full h-full object-cover"
                onError={() => setAvatarUrl('/default_pfp.png')}
              />
              <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <span className="text-white text-xs">Change Photo</span>
              </div>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
          </div>

          <div className="space-y-3">
            <div>
              <label htmlFor="username" className="block text-xs font-medium text-gray-400 mb-1">
                Username
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 bg-[#232323] border border-[#333] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#444] focus:border-[#444] text-base"
                required
              />
            </div>

            <div>
              <label htmlFor="bio" className="block text-xs font-medium text-gray-400 mb-1">
                Bio
              </label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-[#232323] border border-[#333] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#444] focus:border-[#444] text-base"
              />
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}

          <div className="flex justify-end space-x-3 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-[#363636] text-white hover:bg-[#232323] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 rounded-lg bg-[#363636] text-white hover:bg-[#232323] focus:outline-none focus:ring-2 focus:ring-[#444] focus:ring-offset-2 disabled:opacity-50 transition-colors"
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal; 