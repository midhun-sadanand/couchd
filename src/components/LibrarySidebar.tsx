import React from 'react';
import { Sidebar } from '@geist-ui/icons';
import { useRouter } from 'next/navigation';

interface Watchlist {
  id: string;
  name: string;
  image?: string;
  ownerName: string;
}

interface LibrarySidebarProps {
  watchlists: Watchlist[];
  username: string;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}

const LibrarySidebar: React.FC<LibrarySidebarProps> = ({ 
  watchlists, 
  username, 
  sidebarOpen, 
  toggleSidebar 
}) => {
  const router = useRouter();

  return (
    <div className="relative z-40">
      <div 
        className={`rounded-lg fixed top-24 left-0 h-[calc(100vh-6rem)] bg-[#232323] p-4 transition-transform duration-300 transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`} 
        style={{ width: '240px' }}
      >
        <div className="flex justify-between items-center mb-4" style={{ marginTop: '-8px' }}>
          <h2 className="text-xl text-white">Your Library</h2>
          <button onClick={toggleSidebar} className="text-white">
            <Sidebar size={28} color="#f6f6f6" />
          </button>
        </div>
        <ul>
          {watchlists?.map(list => (
            <li 
              key={list.id} 
              className="cursor-pointer mb-2 flex flex-col items-start text-[#f6f6f6]" 
              onClick={() => router.push(`/list/${username}/${encodeURIComponent(list.name)}/${list.id}`)}
            >
              <div className="flex items-center">
                <img 
                  src={list.image || 'https://via.placeholder.com/150'} 
                  alt={list.name} 
                  className="w-14 h-14 object-cover rounded mr-2" 
                  style={{ aspectRatio: '1/1' }} 
                />
                <div>
                  <div className="text-lg font-semibold">{list.name}</div>
                  <div className="text-sm text-gray-400">Playlist • {list.ownerName}</div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default LibrarySidebar; 