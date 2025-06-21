import React from 'react';
import { MediaItem } from '@/types';

const IMDbIcon = () => <span className="font-bold text-lg leading-none text-black bg-yellow-400 px-1 rounded-sm">IMDb</span>;
const RottenTomatoesIcon = () => <span className="text-xl leading-none">🍅</span>;
const LetterboxdIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="inline-block">
        <circle cx="6" cy="6" r="5" fill="white"/>
        <circle cx="18" cy="6" r="5" fill="white"/>
        <circle cx="6" cy="18" r="5" fill="white"/>
        <circle cx="18" cy="18" r="5" fill="white"/>
    </svg>
);
const WikipediaIcon = () => <span className="font-serif font-bold text-xl leading-none">W</span>;

interface MediaInfoPanelProps {
  mediaItem: MediaItem;
}

const MediaInfoPanel: React.FC<MediaInfoPanelProps> = ({ mediaItem }) => {
  const { title, creator, synopsis, thumbnail_url, url } = mediaItem;
  const posterUrl = thumbnail_url || (url && !url.includes('youtube.com') ? url : null);

  const generateLink = (platform: 'letterboxd' | 'rottentomatoes' | 'wikipedia' | 'imdb') => {
    const query = encodeURIComponent(`${title} ${creator || ''}`.trim());
    const movieQuery = encodeURIComponent(title);
    switch (platform) {
      case 'letterboxd':
        return `https://letterboxd.com/search/films/${movieQuery}/`;
      case 'rottentomatoes':
        return `https://www.rottentomatoes.com/search?search=${movieQuery}`;
      case 'imdb':
          return `https://www.imdb.com/find?q=${query}`;
      case 'wikipedia':
        return `https://en.wikipedia.org/wiki/Special:Search?search=${query}`;
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-transparent text-white overflow-y-auto no-scrollbar p-2">
      {posterUrl && (
        <img
            src={posterUrl}
            alt={`Poster for ${title}`}
            className="w-full h-48 rounded-lg object-cover mb-4"
        />
      )}
      
      {synopsis && (
        <div className="mb-6 flex-shrink-0">
          <p className="text-sm text-gray-300 leading-relaxed">{synopsis}</p>
        </div>
      )}

      <div className="mt-auto pt-4 border-t border-[#484848]">
        <h5 className="font-semibold mb-3 text-gray-400 text-xs uppercase tracking-wider">Find on</h5>
        <div className="flex items-center gap-4">
          <a href={generateLink('imdb')} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center h-10 w-10 bg-[#333] rounded-full hover:bg-[#444] transition-colors" title="IMDb">
            <IMDbIcon />
          </a>
          <a href={generateLink('letterboxd')} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center h-10 w-10 bg-[#333] rounded-full hover:bg-[#444] transition-colors" title="Letterboxd">
            <LetterboxdIcon />
          </a>
          <a href={generateLink('rottentomatoes')} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center h-10 w-10 bg-[#333] rounded-full hover:bg-[#444] transition-colors" title="Rotten Tomatoes">
            <RottenTomatoesIcon />
          </a>
          <a href={generateLink('wikipedia')} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center h-10 w-10 bg-[#333] rounded-full hover:bg-[#444] transition-colors" title="Wikipedia">
            <WikipediaIcon />
          </a>
        </div>
      </div>
    </div>
  );
};

export default MediaInfoPanel; 