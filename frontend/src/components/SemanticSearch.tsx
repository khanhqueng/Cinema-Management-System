import React, { useState } from 'react';
import { aiService, AIRecommendationResponse } from '../services/aiService';
import { Movie } from '../types';
import styles from './SemanticSearch.module.css';

interface SemanticSearchProps {
  onResults?: (results: Movie[]) => void;
  className?: string;
}

const SemanticSearch: React.FC<SemanticSearchProps> = ({ onResults, className = '' }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AIRecommendationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!query.trim()) {
      setError('Please enter a search query');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const searchResults = await aiService.semanticSearch(query.trim(), 12);
      setResults(searchResults);

      // Call parent callback if provided
      if (onResults) {
        onResults(searchResults.movies);
      }
    } catch (err: any) {
      setError('Search failed. Please try again.');
      console.error('Semantic search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setQuery('');
    setResults(null);
    setError(null);
    if (onResults) {
      onResults([]);
    }
  };

  const exampleQueries = [
    "action movies with superheroes",
    "romantic comedies from the 2020s",
    "horror movies with high ratings",
    "sci-fi movies about time travel",
    "animated movies for families"
  ];

  return (
    <div className={`${styles.semanticSearch} ${className}`}>
      <div className={styles.searchHeader}>
        <h2 className={styles.searchTitle}>
          <span className={styles.aiBadge}>AI</span>
          Smart Movie Search
        </h2>
        <p className={styles.searchSubtitle}>
          Describe what you're looking for in natural language
        </p>
      </div>

      <form onSubmit={handleSearch} className={styles.searchForm}>
        <div className={styles.searchInputContainer}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g., 'action movies with superheroes and great visual effects'"
            className={styles.searchInput}
            disabled={loading}
          />
          {query && (
            <button
              type="button"
              onClick={clearSearch}
              className={styles.clearButton}
              disabled={loading}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || !query.trim()}
          className={styles.searchButton}
        >
          {loading ? (
            <>
              <span className={styles.spinner}></span>
              Searching...
            </>
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
              </svg>
              AI Search
            </>
          )}
        </button>
      </form>

      {/* Example queries */}
      <div className={styles.exampleQueries}>
        <p className={styles.examplesLabel}>Try these examples:</p>
        <div className={styles.examplesList}>
          {exampleQueries.map((example, index) => (
            <button
              key={index}
              onClick={() => setQuery(example)}
              className={styles.exampleQuery}
              disabled={loading}
            >
              "{example}"
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className={styles.searchError}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
          {error}
        </div>
      )}

      {results && (
        <div className={styles.searchResults}>
          <div className={styles.resultsHeader}>
            <h3>{results.title}</h3>
            <p className={styles.resultsCount}>
              {results.movies.length} result{results.movies.length !== 1 ? 's' : ''} found
            </p>
            {results.reasons.length > 0 && (
              <div className={styles.searchReasons}>
                {results.reasons.map((reason, index) => (
                  <span key={index} className={styles.reasonBadge}>
                    {reason}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default SemanticSearch;