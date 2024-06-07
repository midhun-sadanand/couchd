import React, { useState } from 'react';

const MediaSearch = ({ onSelect }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [medium, setMedium] = useState('movie'); // Default search medium

    const fetchResults = async () => {
        let url;
        if (medium === 'movie') {
            url = `https://api.themoviedb.org/3/search/multi?api_key=89d44f8db4046fedba0c0d1a0ab8fc74&language=en-US&query=${encodeURIComponent(query)}&page=1&include_adult=false`;
        } else {
            const API_KEY = process.env.REACT_APP_YOUTUBE_API_KEY;
            url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=10&key=${API_KEY}`;
        }

        try {
            const response = await fetch(url);
            const data = await response.json();
            if (medium === 'movie') {
                const detailedResults = await Promise.all(data.results.map(async (item) => {
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
                setResults(detailedResults);
            } else {
                setResults(data.items);
            }
        } catch (error) {
            console.error('Failed to fetch results:', error);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (query.length >= 3) {
            fetchResults();
        }
    };

    const decodeHtml = (html) => {
        var txt = document.createElement("textarea");
        txt.innerHTML = html;
        return txt.value;
    };

    return (
        <div>
            <form onSubmit={handleSubmit}>
                <select value={medium} onChange={(e) => setMedium(e.target.value)} className="border p-2 w-full">
                    <option value="movie">Movies</option>
                    <option value="youtube">YouTube</option>
                </select>
                <input
                    type="text"
                    placeholder={`Search ${medium === 'movie' ? 'Movies/TV Shows' : 'YouTube Videos'}`}
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    className="border p-2 w-full mt-2"
                />
                <button type="submit" className="bg-blue-500 text-white p-2 mt-2 w-full">Search</button>
            </form>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }} className="mt-4">
                {medium === 'movie' && results.map((item) => (
                    <div
                        key={item.id}
                        className="cursor-pointer hover:bg-gray-200 p-2 flex"
                        onClick={() => {
                            onSelect(item, medium);
                            setQuery('');
                            setResults([]);
                        }}
                    >
                        <img src={item.poster_path ? `https://image.tmdb.org/t/p/w200${item.poster_path}` : ''} alt={item.title || item.name} style={{ width: '50px', marginRight: '10px' }} />
                        <div>
                            <div>{item.title || item.name} ({item.release_date ? item.release_date.substring(0, 4) : ''})</div>
                            <div>Director: {item.director || 'N/A'}</div>
                        </div>
                    </div>
                ))}
                {medium === 'youtube' && results.map((item) => (
                    <div
                        key={item.id.videoId}
                        className="cursor-pointer hover:bg-gray-200 p-2 flex"
                        onClick={() => {
                            onSelect(item, medium);
                            setQuery('');
                            setResults([]);
                        }}
                    >
                        <img src={item.snippet.thumbnails.default.url} alt="Thumbnail" style={{ width: '50px', marginRight: '10px' }} />
                        <div>
                            <div>{decodeHtml(item.snippet.title)}</div>
                            <div>{new Date(item.snippet.publishedAt).getFullYear()}</div>
                            <div>Channel: {item.snippet.channelTitle}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MediaSearch;
