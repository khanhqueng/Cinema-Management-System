import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { recommendationService, MixedRecommendationResponse, RecommendationResponse } from '../../services/recommendationService';
import { authService } from '../../services/authService';
import RecommendationCard from '../../components/RecommendationCard';
import { Movie } from '../../types';
import styles from './RecommendationPage.module.css';

const RecommendationPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mixedRecommendations, setMixedRecommendations] = useState<MixedRecommendationResponse | null>(null);
  const [aiRecommendations, setAiRecommendations] = useState<RecommendationResponse | null>(null);
  const [semanticSearchQuery, setSemanticSearchQuery] = useState('');
  const [semanticResults, setSemanticResults] = useState<RecommendationResponse | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if user is authenticated
      const authenticated = authService.isAuthenticated();
      setIsAuthenticated(authenticated);

      if (authenticated) {
        // Load personalized recommendations
        const [mixed, aiPersonalized] = await Promise.all([
          recommendationService.getMixedRecommendations(15),
          recommendationService.getAIPersonalizedRecommendations(12)
        ]);

        setMixedRecommendations(mixed);
        setAiRecommendations(aiPersonalized);
      } else {
        // Load new user recommendations
        const newUserRecs = await recommendationService.getNewUserRecommendations(20);
        setMixedRecommendations({
          sections: [{
            title: 'Discover Great Movies',
            movies: newUserRecs.movies,
            description: 'Popular movies to get you started'
          }]
        });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load recommendations');
      console.error('Error loading recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSemanticSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!semanticSearchQuery.trim()) return;

    try {
      setSearchLoading(true);
      const results = await recommendationService.semanticMovieSearch(semanticSearchQuery, 12);
      setSemanticResults(results);
    } catch (err: any) {
      console.error('Semantic search failed:', err);
      setSemanticResults({
        title: 'Search Results',
        movies: [],
        reasons: ['Search failed - please try again'],
        type: 'SEMANTIC_SEARCH'
      });
    } finally {
      setSearchLoading(false);
    }
  };

  const handleViewDetails = (movie: Movie) => {
    navigate(`/movies/${movie.id}`);
  };

  const handleViewShowtimes = (movie: Movie) => {
    navigate(`/movies/${movie.id}/showtimes`);
  };

  if (loading) {
    return (
      <div className={styles.recommendationPage}>
        <div className={styles.container}>
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Loading your personalized recommendations...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.recommendationPage}>
        <div className={styles.container}>
          <div className={styles.error}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
            <h2>Failed to Load Recommendations</h2>
            <p>{error}</p>
            <button className={styles.retryBtn} onClick={loadRecommendations}>
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.recommendationPage}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.pageHeader}>
          <div className={styles.headerContent}>
            <h1>
              {isAuthenticated ? 'Your Recommendations' : 'Discover Movies'}
            </h1>
            <p>
              {isAuthenticated
                ? 'Personalized movie recommendations based on your preferences'
                : 'Popular movies and trending content to get you started'
              }
            </p>
          </div>
        </div>

        {/* AI Semantic Search */}
        <section className={styles.searchSection}>
          <div className={styles.searchHeader}>
            <h2>🤖 AI Movie Search</h2>
            <p>Describe what you're in the mood for - our AI will find the perfect movie</p>
          </div>

          <form onSubmit={handleSemanticSearch} className={styles.searchForm}>
            <div className={styles.searchInput}>
              <input
                type="text"
                value={semanticSearchQuery}
                onChange={(e) => setSemanticSearchQuery(e.target.value)}
                placeholder="e.g., 'funny romantic comedy with great chemistry' or 'dark thriller with plot twists'"
                className={styles.searchField}
                disabled={searchLoading}
              />
              <button
                type="submit"
                disabled={searchLoading || !semanticSearchQuery.trim()}
                className={styles.searchBtn}
              >
                {searchLoading ? (
                  <div className={styles.spinnerSmall}></div>
                ) : (
                  'Search'
                )}
              </button>
            </div>
          </form>

          {/* Semantic Search Results */}
          {semanticResults && (
            <div className={styles.searchResults}>
              <h3>{semanticResults.title}</h3>
              <p className={styles.searchResultsDesc}>
                {semanticResults.reasons.join(' • ')}
              </p>
              {semanticResults.movies.length > 0 ? (
                <div className={styles.movieGrid}>
                  {semanticResults.movies.map((movie) => (
                    <RecommendationCard
                      key={movie.id}
                      movie={movie}
                      onViewDetails={handleViewDetails}
                      onViewShowtimes={handleViewShowtimes}
                      compact
                      showReason="AI Match"
                    />
                  ))}
                </div>
              ) : (
                <div className={styles.noResults}>
                  <p>No movies found matching your description. Try a different search!</p>
                </div>
              )}
            </div>
          )}
        </section>

        {/* AI Personalized Recommendations */}
        {isAuthenticated && aiRecommendations && aiRecommendations.movies.length > 0 && (
          <section className={styles.recommendationSection}>
            <div className={styles.sectionHeader}>
              <h2>🎯 AI-Powered Picks for You</h2>
              <p>{aiRecommendations.reasons.join(' • ')}</p>
            </div>
            <div className={styles.movieGrid}>
              {aiRecommendations.movies.map((movie) => (
                <RecommendationCard
                  key={movie.id}
                  movie={movie}
                  onViewDetails={handleViewDetails}
                  onViewShowtimes={handleViewShowtimes}
                  showReason="AI Personalized"
                />
              ))}
            </div>
          </section>
        )}

        {/* Mixed Recommendations Sections */}
        {mixedRecommendations?.sections.map((section, index) => (
          section.movies.length > 0 && (
            <section key={index} className={styles.recommendationSection}>
              <div className={styles.sectionHeader}>
                <h2>{section.title}</h2>
                <p>{section.description}</p>
              </div>
              <div className={styles.movieGrid}>
                {section.movies.map((movie) => (
                  <RecommendationCard
                    key={movie.id}
                    movie={movie}
                    onViewDetails={handleViewDetails}
                    onViewShowtimes={handleViewShowtimes}
                  />
                ))}
              </div>
            </section>
          )
        ))}

        {/* Empty State */}
        {(!mixedRecommendations?.sections || mixedRecommendations.sections.every(s => s.movies.length === 0)) && (
          <div className={styles.emptyState}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            <h2>No Recommendations Available</h2>
            <p>We're still learning your preferences. Try browsing movies and rating them to get better recommendations!</p>
            <button
              className={styles.browseBtn}
              onClick={() => navigate('/movies')}
            >
              Browse Movies
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecommendationPage;