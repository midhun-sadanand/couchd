import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from '@geist-ui/icons';

const LibrarySidebar = ({ watchlists, username, sidebarOpen, toggleSidebar }) => {
  const navigate = useNavigate();

  return (
    <div className="relative z-40">
      <div className={`fixed top-24 left-0 h-[calc(100vh-6rem)] bg-[#232323] p-4 transition-transform duration-300 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`} style={{ width: '240px' }}>
        <div className="flex justify-between items-center mb-4" style={{ marginTop: '-8px' }}>
          <h2 className="text-xl text-white">Your Library</h2>
          <button onClick={toggleSidebar} className="text-white">
            <ChevronLeft />
          </button>
        </div>
        <ul>
          {watchlists?.map(list => (
            <li key={list.id} className="cursor-pointer mb-2 flex items-center" onClick={() => navigate(`/list/${username}/${encodeURIComponent(list.name)}/${list.id}`)}>
              <img src={list.image || 'https://via.placeholder.com/150'} alt={list.name} className="w-14 h-14 object-cover rounded mr-2" style={{ aspectRatio: '1/1' }} />
              {list.name}
            </li>
          ))}
        </ul>
      </div>
      {!sidebarOpen && (
        <button
          onClick={toggleSidebar}
          className="fixed top-24 left-0 p-2 bg-[#121212] text-white rounded-r-lg z-50"
        >
          <ChevronRight />
        </button>
      )}
    </div>
  );
};

export default LibrarySidebar;
