import React, { useState, useEffect, useCallback } from 'react';

const SearchModal = ({ onSelect, onClose }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [medium, setMedium] = useState('movie'); // Default search medium
    const [youtubeType, setYoutubeType] = useState('video');
    const [movieFilter, setMovieFilter] = useState('movie');
    const [showFilterOptions, setShowFilterOptions] = useState(false);
    const [selectedChannel, setSelectedChannel] = useState(null);
    const [channelName, setChannelName] = useState('');

    const debounce = (func, delay) => {
        let timeout;
        return (...args) => {
            if (timeout) clearTimeout(timeout);
            timeout = setTimeout(() => {
                func(...args);
            }, delay);
        };
    };

    const fetchResults = async () => {
        let url;
        if (medium === 'movie' || medium === 'tv') {
            if (movieFilter === 'movie') {
                url = `https://api.themoviedb.org/3/search/multi?api_key=89d44f8db4046fedba0c0d1a0ab8fc74&language=en-US&query=${encodeURIComponent(query)}&page=1&include_adult=false`;
            } else if (movieFilter === 'director' || movieFilter === 'cast') {
                url = `https://api.themoviedb.org/3/search/person?api_key=89d44f8db4046fedba0c0d1a0ab8fc74&language=en-US&query=${encodeURIComponent(query)}&page=1&include_adult=false`;
            }
        } else {
            const API_KEY = process.env.REACT_APP_YOUTUBE_API_KEY;
            if (selectedChannel) {
                url = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${selectedChannel}&type=video&q=${encodeURIComponent(query)}&maxResults=10&key=${API_KEY}`;
            } else {
                url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=${youtubeType}&maxResults=10&key=${API_KEY}`;
            }
        }
    
        try {
            const response = await fetch(url);
            const data = await response.json();
            
            if (medium === 'movie' || medium === 'tv') {
                let detailedResults = [];
                if (movieFilter === 'movie') {
                    detailedResults = await Promise.all((data.results || []).map(async (item) => {
                        if (item.media_type === "movie" || item.media_type === "tv") {
                            const detailsUrl = `https://api.themoviedb.org/3/${item.media_type}/${item.id}?api_key=89d44f8db4046fedba0c0d1a0ab8fc74&append_to_response=credits`;
                            const detailsResponse = await fetch(detailsUrl);
                            const detailsData = await detailsResponse.json();
                            return {
                                ...item,
                                director: detailsData.credits?.crew.find(c => c.job === "Director")?.name || ''
                            };
                        }
                        return item;
                    }));
                } else {
                    detailedResults = await Promise.all((data.results || []).map(async (person) => {
                        const filmographyUrl = `https://api.themoviedb.org/3/person/${person.id}/movie_credits?api_key=89d44f8db4046fedba0c0d1a0ab8fc74`;
                        const filmographyResponse = await fetch(filmographyUrl);
                        const filmographyData = await filmographyResponse.json();
                        if (movieFilter === 'director') {
                            return (filmographyData.crew || []).filter(film => film.job === 'Director').map(film => ({
                                ...film,
                                director: person.name
                            }));
                        } else if (movieFilter === 'cast') {
                            return Promise.all((filmographyData.cast || []).map(async film => {
                                const detailsUrl = `https://api.themoviedb.org/3/${film.media_type}/${film.id}?api_key=89d44f8db4046fedba0c0d1a0ab8fc74&append_to_response=credits`;
                                const detailsResponse = await fetch(detailsUrl);
                                const detailsData = await detailsResponse.json();
                                return {
                                    ...film,
                                    director: detailsData.credits?.crew.find(c => c.job === "Director")?.name || ''
                                };
                            }));
                        }
                    }));
                    detailedResults = detailedResults.flat();
                }
                setResults(detailedResults);
            } else {
                setResults(data.items || []);
            }
        } catch (error) {
            console.error('Failed to fetch results:', error);
        }
    };    

    const debouncedFetchResults = useCallback(debounce(fetchResults, 500), [query, medium, youtubeType, movieFilter, selectedChannel]);

    useEffect(() => {
        if (selectedChannel || query.length >= 3) {
            debouncedFetchResults();
        } else {
            setResults([]);
        }
    }, [query, medium, youtubeType, movieFilter, selectedChannel, debouncedFetchResults]);

    const decodeHtml = (html) => {
        var txt = document.createElement("textarea");
        txt.innerHTML = html;
        return txt.value;
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        if (query.length >= 3 || selectedChannel) {
            fetchResults();
        }
    };

    const handleFilterSelect = (filter) => {
        if (medium === 'youtube') {
            setYoutubeType(filter);
        } else {
            setMovieFilter(filter);
        }
        setShowFilterOptions(false);
    };

    const handleChannelSelect = (channelId, channelName) => {
        setSelectedChannel(channelId);
        setChannelName(channelName);
        setQuery('');
        setResults([]);
    };

    const handleExitChannelSearch = () => {
        setSelectedChannel(null);
        setChannelName('');
        setQuery('');
        setResults([]);
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-lg w-11/12 max-w-2xl p-4" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Search Media</h2>
                    <button onClick={onClose} className="text-gray-600 hover:text-gray-900">&times;</button>
                </div>
                <form onSubmit={handleFormSubmit} className="flex mb-4">
                    <select value={medium} onChange={(e) => {
                        setMedium(e.target.value);
                        setSelectedChannel(null); // Reset channel selection when changing medium
                    }} className="border p-2 mr-2">
                        <option value="movie">Movies</option>
                        <option value="tv">TV Shows</option>
                        <option value="youtube">YouTube</option>
                    </select>
                    <div className="flex flex-grow items-center border p-2">
                        <input
                            type="text"
                            placeholder={selectedChannel ? `Search ${channelName}'s videos...` : "Search..."}
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            className="flex-grow focus:outline-none"
                        />
                        {selectedChannel && (
                            <button type="button" onClick={handleExitChannelSearch} className="text-gray-600 hover:text-gray-900 ml-2">&times;</button>
                        )}
                    </div>
                    <div className="relative">
                        <button
                            type="button"
                            className="bg-blue-500 text-white p-2 ml-2 flex items-center"
                            onClick={() => setShowFilterOptions(!showFilterOptions)}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6 mr-2">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
                            </svg>
                            Filter
                        </button>
                        {showFilterOptions && (
                            <div className="absolute top-full mt-2 right-0 bg-white border rounded shadow-lg p-2 z-10">
                                {medium === 'youtube' ? (
                                    <div className="mb-2">
                                        <div
                                            onClick={() => handleFilterSelect('video')}
                                            className={`p-2 cursor-pointer hover:bg-gray-200 ${youtubeType === 'video' ? 'underline' : ''}`}
                                        >
                                            Video
                                        </div>
                                        <div
                                            onClick={() => handleFilterSelect('channel')}
                                            className={`p-2 cursor-pointer hover:bg-gray-200 ${youtubeType === 'channel' ? 'underline' : ''}`}
                                        >
                                            Channel
                                        </div>
                                        <div
                                            onClick={() => handleFilterSelect('playlist')}
                                            className={`p-2 cursor-pointer hover:bg-gray-200 ${youtubeType === 'playlist' ? 'underline' : ''}`}
                                        >
                                            Playlist
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mb-2">
                                        <div
                                            onClick={() => handleFilterSelect('movie')}
                                            className={`p-2 cursor-pointer hover:bg-gray-200 ${movieFilter === 'movie' ? 'underline' : ''}`}
                                        >
                                            Title
                                        </div>
                                        <div
                                            onClick={() => handleFilterSelect('director')}
                                            className={`p-2 cursor-pointer hover:bg-gray-200 ${movieFilter === 'director' ? 'underline' : ''}`}
                                        >
                                            Director
                                        </div>
                                        <div
                                            onClick={() => handleFilterSelect('cast')}
                                            className={`p-2 cursor-pointer hover:bg-gray-200 ${movieFilter === 'cast' ? 'underline' : ''}`}
                                        >
                                            Cast
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </form>
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {results.map((item) => (
                        <div
                            key={medium === 'youtube' ? item.id.videoId : item.id}
                            className="cursor-pointer hover:bg-gray-200 p-2 flex items-center"
                            onClick={() => {
                                if (medium === 'youtube' && item.snippet.channelId) {
                                    handleChannelSelect(item.snippet.channelId, item.snippet.channelTitle);
                                } else {
                                    onSelect(item, medium);
                                    onClose();
                                }
                            }}
                        >
                            {medium === 'youtube' ? (
                                <>
                                    <img src={item.snippet.thumbnails.default.url} alt="Thumbnail" className="w-24 h-16 mr-4 rounded-md object-contain" />
                                    <div className="flex flex-col">
                                        <div className="font-bold text-left">{decodeHtml(item.snippet.title)}</div>
                                        <div className="text-sm text-gray-600 text-left">{item.snippet.channelTitle} - {new Date(item.snippet.publishedAt).getFullYear()}</div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <img src={item.poster_path ? `https://image.tmdb.org/t/p/w200${item.poster_path}` : ''} alt={item.title || item.name} className="w-24 h-auto mr-4 rounded-md object-contain" />
                                    <div className="flex flex-col">
                                        <div className="font-bold text-left">{item.title || item.name} {item.release_date ? `(${item.release_date.substring(0, 4)})` : ''}</div>
                                        {item.director && <div className="text-sm text-gray-600 text-left pl-5">Director: {item.director}</div>}
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SearchModal;
