import React, { useState, useEffect } from 'react';

const YoutubeSearch = ({ onSelect }) => {
    const [query, setQuery] = useState('');
    const [videos, setVideos] = useState([]);
    const [timer, setTimer] = useState(null);

    useEffect(() => {
        if (timer) {
            clearTimeout(timer);
        }

        if (query.length < 3) {
            setVideos([]);
            return;
        }

        const newTimer = setTimeout(() => {
            fetchVideos();
        }, 250);

        setTimer(newTimer);

        return () => clearTimeout(newTimer);
    }, [query]);

    const fetchVideos = async () => {
        const API_KEY = 'AIzaSyAjxXnuRYFH5M8w8-QAZ7yXt1Di8b1OH70';  // Ensure to replace this with your actual YouTube API key
        const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=10&key=${API_KEY}`;

        try {
            const response = await fetch(url);
            const data = await response.json();
            if (data.items) {
                const decodedVideos = data.items.map(video => ({
                    ...video,
                    snippet: {
                        ...video.snippet,
                        title: decodeHtml(video.snippet.title)
                    }
                }));
                setVideos(decodedVideos);
            }
        } catch (error) {
            console.error('Failed to fetch videos:', error);
        }
    };

    // Helper function to decode HTML entities
    const decodeHtml = html => {
        var txt = document.createElement("textarea");
        txt.innerHTML = html;
        return txt.value;
    };

    return (
        <div>
            <input
                type="text"
                placeholder="Search YouTube Videos"
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="border p-2 w-full"
            />
            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {videos.map((video) => (
                    <div
                        key={video.id.videoId}
                        className="cursor-pointer hover:bg-gray-200 p-2 flex"
                        onClick={() => {
                            onSelect(video);
                            setQuery('');
                            setVideos([]);
                        }}
                    >
                        <img src={video.snippet.thumbnails.default.url} alt="Thumbnail" style={{ width: '50px', marginRight: '10px' }} />
                        {video.snippet.title} - {new Date(video.snippet.publishedAt).getFullYear()}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default YoutubeSearch;
