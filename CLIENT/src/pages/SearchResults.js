import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import defaultProfile from '../components/assets/images/pfp.png';
import { useNavigate } from 'react-router-dom';

const SearchResults = () => {
    const location = useLocation();
    const query = new URLSearchParams(location.search).get('query');
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (!query) return;

        const fetchResults = async () => {
            setIsLoading(true);

            try {
                const response = await fetch(`http://localhost:3001/api/users?query=${query}`);
                const data = await response.json();
                setResults(data);
            } catch (error) {
                console.error('Error fetching search results:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchResults();
    }, [query]);

    return (
        <div className="search-results-page">
            <h1>Search Results for "{query}"</h1>
            {isLoading ? (
                <p>Loading...</p>
            ) : (
                <div className="results-list">
                    {results.map((result, index) => (
                        <div
                            key={index}
                            className="result-item"
                            onClick={() => navigate(`/profile/${result.id}`)}
                        >
                            <img
                                src={result.profile_image_url || defaultProfile}
                                alt={result.name}
                            />
                            <div className="result-info">
                                <h2>{result.name}</h2>
                                <p>{result.followers_count} followers, following {result.following_count}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SearchResults;
