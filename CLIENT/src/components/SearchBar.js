import React from 'react';
import { Search, Command } from '@geist-ui/icons';

const SearchBar = ({ onSearchClick }) => {
    return (
        <div className="search-bar" onClick={onSearchClick}>
            <Search className="search-icon" color="#888888"/>
            <span className="search-placeholder">Search...</span>
            <kbd className="kbd" size={12}>
                <div className="command-icon-container">
                    <Command className="command-icon" />
                    <span className="K">K</span>
                </div>
            </kbd>
        </div>
    );
};

export default SearchBar;

// import React, { useState, useEffect } from 'react';

// const SearchBar = ({ onSelect }) => {
//     const [query, setQuery] = useState('');
//     const [results, setResults] = useState([]);
//     const [medium, setMedium] = useState('movie'); // Default search medium

//     useEffect(() => {
//         if (query.length < 3) {
//             setResults([]);
//             return;
//         }

//         const fetchResults = async () => {
//             let url;
//             if (medium === 'movie') {
//                 url = `https://api.themoviedb.org/3/search/multi?api_key=89d44f8db4046fedba0c0d1a0ab8fc74&language=en-US&query=${encodeURIComponent(query)}&page=1&include_adult=false`;
//             } else {
//                 const API_KEY = process.env.REACT_APP_YOUTUBE_API_KEY;
//                 url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=10&key=${API_KEY}`;
//             }

//             try {
//                 const response = await fetch(url);
//                 const data = await response.json();
//                 if (medium === 'movie') {
//                     const detailedResults = await Promise.all(data.results.map(async (item) => {
//                         if (item.media_type === "movie" || item.media_type === "tv") {
//                             const detailsUrl = `https://api.themoviedb.org/3/${item.media_type}/${item.id}?api_key=89d44f8db4046fedba0c0d1a0ab8fc74&append_to_response=credits`;
//                             const detailsResponse = await fetch(detailsUrl);
//                             const detailsData = await detailsResponse.json();
//                             return {
//                                 ...item,
//                                 director: detailsData.credits?.crew.find(c => c.job === "Director")?.name || ''
//                             };
//                         }
//                         return item;
//                     }));
//                     setResults(detailedResults);
//                 } else {
//                     setResults(data.items);
//                 }
//             } catch (error) {
//                 console.error('Failed to fetch results:', error);
//             }
//         };

//         const timer = setTimeout(() => {
//             fetchResults();
//         }, 250);
//         return () => clearTimeout(timer);
//     }, [query, medium]);

//     const decodeHtml = (html) => {
//         var txt = document.createElement("textarea");
//         txt.innerHTML = html;
//         return txt.value;
//     };

//     return (
//         <div className="search-bar-container">
//             <div className="search-bar">
//                 <select value={medium} onChange={(e) => setMedium(e.target.value)} className="border p-2">
//                     <option value="movie">Movies</option>
//                     <option value="youtube">YouTube</option>
//                 </select>
//                 <input
//                     type="text"
//                     placeholder="Search..."
//                     value={query}
//                     onChange={e => setQuery(e.target.value)}
//                     className="border p-2"
//                 />
//                 <kbd className="kbd"><span>⌘ K</span></kbd>
//             </div>
//             <div className="search-results" style={{ maxHeight: '200px', overflowY: 'auto' }}>
//                 {results.map((item) => (
//                     <div
//                         key={medium === 'movie' ? item.id : item.id.videoId}
//                         className="cursor-pointer hover:bg-gray-200 p-2 flex"
//                         onClick={() => {
//                             onSelect(item, medium);
//                             setQuery('');
//                             setResults([]);
//                         }}
//                     >
//                         {medium === 'movie' ? (
//                             `${item.title || item.name}${item.release_date ? ` (${item.release_date.substring(0, 4)})` : ''}${item.director ? `, Creator: ${item.director}` : ''}`
//                         ) : (
//                             <>
//                                 <img src={item.snippet.thumbnails.default.url} alt="Thumbnail" style={{ width: '50px', marginRight: '10px' }} />
//                                 {decodeHtml(item.snippet.title)} - {new Date(item.snippet.publishedAt).getFullYear()}
//                             </>
//                         )}
//                     </div>
//                 ))}
//             </div>
//         </div>
//     );
// };

// export default SearchBar;