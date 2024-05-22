import React, { useState, useEffect } from 'react';

const Search = ({ onSelect }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);

    useEffect(() => {
        if (query.length < 3) {
            setResults([]);
            return;
        }

        const fetchResults = async () => {
            const url = `https://api.themoviedb.org/3/search/multi?api_key=89d44f8db4046fedba0c0d1a0ab8fc74&language=en-US&query=${encodeURIComponent(query)}&page=1&include_adult=false`;
            const response = await fetch(url);
            const data = await response.json();
            if (data.results) {
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
            }
        };

        const timer = setTimeout(() => {
            fetchResults();
        }, 250);
        return () => clearTimeout(timer);
    }, [query]);

    return (
        <div>
            <input
                type="text"
                placeholder="Search for a movie or TV show"
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="border p-2 w-full"
            />
            <div style={{ maxHeight: '200px', overflowY: 'auto' }}> 
                {results.map((item) => (
                    <div
                        key={item.id}
                        className="cursor-pointer hover:bg-gray-200 p-2"
                        onClick={() => {
                            onSelect(item);
                            setQuery(''); // Clear the input bar after selection
                            setResults([]); // Clear results after selection
                        }}
                    >
                        {`${item.title || item.name}${item.release_date ? ` (${item.release_date.substring(0, 4)})` : ''}${item.director ? `, Creator: ${item.director}` : ''}`}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Search;
