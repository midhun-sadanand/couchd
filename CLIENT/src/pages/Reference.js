import React, { useState, useEffect, useCallback, useRef } from 'react';
import defaultProfile from './assets/images/pfp.png';

const SearchModal = ({ onSelect, onClose }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [medium, setMedium] = useState('movie'); // Default search medium
    const [youtubeType, setYoutubeType] = useState('video');
    const [movieFilter, setMovieFilter] = useState('movie');
    const [showFilterOptions, setShowFilterOptions] = useState(false);
    const [selectedDirector, setSelectedDirector] = useState(null);
    const [directorName, setDirectorName] = useState('');
    const [selectedActor, setSelectedActor] = useState(null);
    const [actorName, setActorName] = useState('');
    const [selectedChannel, setSelectedChannel] = useState(null);
    const [channelName, setChannelName] = useState('');
    const [isFetching, setIsFetching] = useState(false);
    const [sortOption, setSortOption] = useState('relevance'); // New state for sort option
    const fetchController = useRef(null);
    const previousResults = useRef([]); // Store previous results to avoid flickering

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
        if (!query && !selectedDirector && !selectedActor && !selectedChannel) return;

        if (fetchController.current) {
            fetchController.current.abort(); // Abort previous fetch if still ongoing
        }

        fetchController.current = new AbortController();
        const { signal } = fetchController.current;
        setIsFetching(true);

        let url;
        if (medium === 'movie' || medium === 'tv') {
            if (selectedDirector) {
                url = `https://api.themoviedb.org/3/person/${selectedDirector}/movie_credits?api_key=89d44f8db4046fedba0c0d1a0ab8fc74`;
            } else if (selectedActor) {
                url = `https://api.themoviedb.org/3/person/${selectedActor}/movie_credits?api_key=89d44f8db4046fedba0c0d1a0ab8fc74`;
            } else if (movieFilter === 'movie') {
                url = `https://api.themoviedb.org/3/search/movie?api_key=89d44f8db4046fedba0c0d1a0ab8fc74&language=en-US&query=${encodeURIComponent(query)}&page=1&include_adult=false`;
            } else if (movieFilter === 'director' || movieFilter === 'cast') {
                url = `https://api.themoviedb.org/3/search/person?api_key=89d44f8db4046fedba0c0d1a0ab8fc74&language=en-US&query=${encodeURIComponent(query)}&page=1&include_adult=false`;
            }
        } else {
            const API_KEY = process.env.REACT_APP_YOUTUBE_API_KEY;
            const maxResults = 10;
            const order = sortOption; // Using the sortOption state for sorting
            if (selectedChannel) {
                url = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${selectedChannel}&type=video&q=${encodeURIComponent(query)}&maxResults=${maxResults}&order=${order}&key=${API_KEY}`;
            } else {
                url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=${youtubeType}&maxResults=${maxResults}&order=${order}&key=${API_KEY}`;
            }
        }

        try {
            const response = await fetch(url, { signal });
            const data = await response.json();

            if (medium === 'movie' || medium === 'tv') {
                let detailedResults = [];
                if (selectedDirector) {
                    detailedResults = (data.crew || []).filter(movie => movie.job === 'Director' && (!query || movie.title.toLowerCase().includes(query.toLowerCase())));
                } else if (selectedActor) {
                    detailedResults = (data.cast || []).filter(movie => (!query || movie.title.toLowerCase().includes(query.toLowerCase())));
                    detailedResults = detailedResults.map(movie => ({
                        ...movie,
                        actor: actorName
                    }));
                } else if (movieFilter === 'movie') {
                    detailedResults = await Promise.all((data.results || []).map(async (item) => {
                        const detailsUrl = `https://api.themoviedb.org/3/${medium === 'movie' ? 'movie' : 'tv'}/${item.id}?api_key=89d44f8db4046fedba0c0d1a0ab8fc74&append_to_response=credits`;
                        const detailsResponse = await fetch(detailsUrl);
                        const detailsData = await detailsResponse.json();
                        return {
                            ...item,
                            director: detailsData.credits?.crew.find(c => c.job === "Director")?.name || ''
                        };
                    }));
                } else if (movieFilter === 'director') {
                    detailedResults = (data.results || []).filter(person => person.known_for_department === 'Directing');
                } else if (movieFilter === 'cast') {
                    detailedResults = (data.results || []).filter(person => person.known_for_department === 'Acting');
                }
                previousResults.current = detailedResults; // Update previous results
            } else {
                previousResults.current = data.items || [];
            }
            setResults(previousResults.current); // Update results with fetched data
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Failed to fetch results:', error);
            }
        } finally {
            setIsFetching(false);
        }
    };

    const fetchMoviesByDirector = async (directorId, directorName) => {
        const url = `https://api.themoviedb.org/3/person/${directorId}/movie_credits?api_key=89d44f8db4046fedba0c0d1a0ab8fc74`;
        try {
            const response = await fetch(url);
            const data = await response.json();
            const directorMovies = data.crew.filter(movie => movie.job === 'Director').map(movie => ({
                ...movie,
                director: directorName
            }));
            previousResults.current = directorMovies; // Update previous results
            setResults(previousResults.current); // Update results with fetched data
        } catch (error) {
            console.error('Failed to fetch movies by director:', error);
        }
    };

    const fetchMoviesByActor = async (actorId, actorName) => {
        const url = `https://api.themoviedb.org/3/person/${actorId}/movie_credits?api_key=89d44f8db4046fedba0c0d1a0ab8fc74`;
        try {
            const response = await fetch(url);
            const data = await response.json();
            const actorMovies = data.cast.map(movie => ({
                ...movie,
                actor: actorName
            }));
            previousResults.current = actorMovies; // Update previous results
            setResults(previousResults.current); // Update results with fetched data
        } catch (error) {
            console.error('Failed to fetch movies by actor:', error);
        }
    };

    const debouncedFetchResults = useCallback(debounce(fetchResults, 1000), [query, medium, youtubeType, movieFilter, selectedChannel, selectedDirector, selectedActor, sortOption]);

    useEffect(() => {
        if (selectedChannel || selectedDirector || selectedActor) {
            fetchResults();
        } else {
            setResults([]);
        }
    }, [selectedChannel, selectedDirector, selectedActor, sortOption, debouncedFetchResults]);

    const decodeHtml = (html) => {
        var txt = document.createElement("textarea");
        txt.innerHTML = html;
        return txt.value;
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        if (query.length >= 3 || selectedChannel || selectedDirector || selectedActor) {
            fetchResults();
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleFormSubmit(e);
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

    const handleSortSelect = (sortOption) => {
        setSortOption(sortOption);
        fetchResults();
    };

    const handleDirectorSelect = async (directorId, directorName) => {
        setSelectedDirector(directorId);
        setDirectorName(directorName);
        setQuery('');
        await fetchMoviesByDirector(directorId, directorName);
        setMovieFilter('movie'); // Switch to movie filter to search within the director's movies
    };

    const handleActorSelect = async (actorId, actorName) => {
        setSelectedActor(actorId);
        setActorName(actorName);
        setQuery('');
        await fetchMoviesByActor(actorId, actorName);
        setMovieFilter('movie'); // Switch to movie filter to search within the actor's movies
    };

    const handleChannelSelect = async (channelId, channelName) => {
        setSelectedChannel(channelId);
        setChannelName(channelName);
        setYoutubeType('video'); // Automatically set filter to video after selecting a channel
        setQuery('');
        await fetchResults();
    };

    const handleExitDirectorSearch = () => {
        setSelectedDirector(null);
        setDirectorName('');
        setQuery('');
        setResults([]);
    };

    const handleExitActorSearch = () => {
        setSelectedActor(null);
        setActorName('');
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
                        setSelectedDirector(null); // Reset director selection when changing medium
                        setSelectedActor(null); // Reset actor selection when changing medium
                        setQuery(''); // Reset query when changing medium
                    }} className="border p-2 mr-2">
                        <option value="movie">Movies</option>
                        <option value="tv">TV Shows</option>
                        <option value="youtube">YouTube</option>
                    </select>
                    <div className="flex flex-grow items-center border p-2">
                        <input
                            type="text"
                            placeholder={
                                selectedChannel
                                    ? `Search ${channelName}'s videos...`
                                    : selectedDirector
                                    ? `Searching movies by ${directorName}...`
                                    : selectedActor
                                    ? `Searching movies with ${actorName}...`
                                    : "Search..."
                            }
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            onKeyPress={handleKeyPress}
                            className="flex-grow focus:outline-none"
                        />
                        {selectedChannel && (
                            <button type="button" onClick={handleExitChannelSearch} className="text-gray-600 hover:text-gray-900 ml-2">&times;</button>
                        )}
                        {selectedDirector && (
                            <button type="button" onClick={handleExitDirectorSearch} className="text-gray-600 hover:text-gray-900 ml-2">&times;</button>
                        )}
                        {selectedActor && (
                            <button type="button" onClick={handleExitActorSearch} className="text-gray-600 hover:text-gray-900 ml-2">&times;</button>
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
                    {isFetching && results.length === 0 ? (
                        <div className="text-center text-gray-600">Loading...</div>
                    ) : (
                        results.map((item) => (
                            <div
                            key={medium === 'youtube' ? item.id.videoId : item.id}
                            className="cursor-pointer hover:bg-gray-200 p-2 flex items-center"
                            onClick={() => {
                                if (medium === 'youtube' && youtubeType === 'channel') {
                                handleChannelSelect(item.snippet.channelId, item.snippet.channelTitle);
                                } else if (medium === 'youtube' && youtubeType === 'video') {
                                onSelect(item, 'youtube');
                                onClose();
                                } else if (movieFilter === 'director' && !selectedDirector) {
                                handleDirectorSelect(item.id, item.name);
                                } else if (movieFilter === 'cast' && !selectedActor) {
                                handleActorSelect(item.id, item.name);
                                } else {
                                onSelect(item, medium);
                                onClose();
                                }
                            }}
                            >
                                {medium === 'youtube' ? (
                                    <>
                                        {item.snippet.thumbnails ? (
                                            <img src={item.snippet.thumbnails.default.url} alt="Thumbnail" className="w-24 h-16 mr-4 rounded-md object-contain" />
                                        ) : (
                                            <div className="w-24 h-16 mr-4 rounded-md object-contain bg-gray-200">No Image</div>
                                        )}
                                        <div className="flex flex-col flex-grow">
                                            <div className="font-bold text-left">{decodeHtml(item.snippet.title)}</div>
                                            <div className="text-sm text-gray-600 text-left">{item.snippet.channelTitle} - {new Date(item.snippet.publishedAt).getFullYear()}</div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        {movieFilter === 'director' || movieFilter === 'cast' ? (
                                            <img src={item.profile_path ? `https://image.tmdb.org/t/p/w200${item.profile_path}` : defaultProfile} alt={item.name} className="w-16 h-16 mr-4 rounded-full object-cover" />
                                        ) : (
                                            <img src={item.poster_path ? `https://image.tmdb.org/t/p/w200${item.poster_path}` : 'https://via.placeholder.com/200?text=No+Image+Available'} alt={item.title || item.name} className="w-24 h-auto mr-4 rounded-md object-contain" />
                                        )}
                                        <div className="flex flex-col flex-grow">
                                            {movieFilter === 'director' ? (
                                                <div className="font-bold text-left">{item.name}</div>
                                            ) : movieFilter === 'cast' ? (
                                                <div className="font-bold text-left">{item.name}</div>
                                            ) : (
                                                <>
                                                    <div className="font-bold text-left">{item.title || item.name} {item.release_date ? `(${item.release_date.substring(0, 4)})` : ''}</div>
                                                    {item.director && <div className="text-sm text-gray-600 text-left pl-5">Director: {item.director}</div>}
                                                    {selectedDirector && <div className="text-sm text-gray-600 text-left pl-5">Directed by: {directorName}</div>}
                                                    {selectedActor && <div className="text-sm text-gray-600 text-left pl-5">Starring: {actorName}</div>}
                                                </>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        ))
                    )}
                    {isFetching && results.length > 0 && (
                        <div className="text-center text-gray-600">Loading more results...</div>
                    )}
                </div>
                {medium === 'youtube' && (
                    <div className="flex justify-end mt-4">
                        <select value={sortOption} onChange={(e) => handleSortSelect(e.target.value)} className="border p-2">
                            <option value="relevance">Relevance</option>
                            <option value="date">Newest</option>
                            <option value="viewCount">Most Popular</option>
                            <option value="rating">Top Rated</option>
                        </select>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SearchModal;