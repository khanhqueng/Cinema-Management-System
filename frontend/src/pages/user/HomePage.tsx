import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { movieService } from '../../services/movieService';
import { aiService, MixedRecommendationResponse } from '../../services/aiService';
import { authService } from '../../services/authService';
import { Movie } from '../../types';
import styles from './HomePage.module.css';
import movieCardStyles from './MovieCard.module.css';

const HomePage: React.FC = () => {
  const [featuredMovie, setFeaturedMovie] = useState<Movie | null>(null);
  const [recommendations, setRecommendations] = useState<MixedRecommendationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHomepageData = async () => {
      try {
        const isAuthenticated = authService.getToken() !== null;

        if (isAuthenticated) {
          // Get AI-powered mixed recommendations for logged-in users
          const homepageRecommendations = await aiService.getHomepageRecommendations();
          setRecommendations(homepageRecommendations);

          // Set featured movie from the first recommendation section
          if (homepageRecommendations.sections.length > 0 && homepageRecommendations.sections[0].movies.length > 0) {
            setFeaturedMovie(homepageRecommendations.sections[0].movies[0]);
          }
        } else {
          // Fallback for non-authenticated users - use traditional movie fetching
          const currentlyShowingResponse = await movieService.getCurrentlyShowingMoviesEnhanced({
            page: 0,
            size: 8
          });

          if (currentlyShowingResponse.content.length > 0) {
            setFeaturedMovie(currentlyShowingResponse.content[0]);

            // Create a basic recommendation structure for consistency
            setRecommendations({
              sections: [
                {
                  title: 'Currently Showing',
                  movies: currentlyShowingResponse.content.slice(1, 6),
                  description: 'Movies currently playing in theaters'
                }
              ]
            });
          }
        }
      } catch (err) {
        console.error('Error fetching homepage data:', err);
        // Fallback to basic movie data
        try {
          const currentlyShowingResponse = await movieService.getCurrentlyShowingMoviesEnhanced({
            page: 0,
            size: 8
          });

          if (currentlyShowingResponse.content.length > 0) {
            setFeaturedMovie(currentlyShowingResponse.content[0]);
            setRecommendations({
              sections: [
                {
                  title: 'Currently Showing',
                  movies: currentlyShowingResponse.content.slice(1, 6),
                  description: 'Movies currently playing in theaters'
                }
              ]
            });
          }
        } catch (fallbackErr) {
          setError('Failed to load movies');
          console.error('Fallback also failed:', fallbackErr);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchHomepageData();
  }, []);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className="spinner"></div>
        <p>Loading amazing content...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <h2>Something went wrong</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="btn">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className={styles.homepage}>
      {/* Hero Section */}
      {featuredMovie && (
        <section className={styles.heroSection}>
          <div className={styles.heroBackground}>
            <img
              src={featuredMovie.posterUrl || 'https://via.placeholder.com/1920x1080/141414/E50914?text=Featured+Movie'}
              alt={featuredMovie.title}
              className={styles.heroImage}
            />
            <div className={styles.heroGradient}></div>
          </div>

          <div className={styles.heroContent}>
            <div className="container">
              <div className={styles.heroInfo}>
                <h1 className={styles.heroTitle}>{featuredMovie.title}</h1>
                <div className={styles.heroMeta}>
                  <span className={styles.heroRating}>
                    {movieService.getStarRating(featuredMovie.averageRating)} {movieService.formatRating(featuredMovie.averageRating)}
                  </span>
                  <span className={styles.heroDuration}>{featuredMovie.formattedDuration}</span>
                  <span className={styles.heroGenre}>{featuredMovie.genre}</span>
                  <span className={styles.heroDirector}>By {featuredMovie.director}</span>
                  {featuredMovie.reviewCount > 0 && (
                    <span className={styles.heroReviews}>({featuredMovie.reviewCount} reviews)</span>
                  )}
                </div>
                <p className={styles.heroDescription}>
                  {featuredMovie.description?.length > 200
                    ? `${featuredMovie.description.substring(0, 200)}...`
                    : featuredMovie.description || 'An incredible cinematic experience awaits.'}
                </p>
                <div className={styles.heroButtons}>
                  <button className={`btn btn-large ${styles.playBtn}`}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                    Play
                  </button>
                  <Link to={`/movies/${featuredMovie.id}`} className="btn btn-secondary btn-large">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                    More Info
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* AI-Powered Recommendation Sections */}
      <div className={styles.movieSections}>
        <div className="container">
          {recommendations?.sections.map((section, sectionIndex) => (
            section.movies.length > 0 && (
              <section key={sectionIndex} className={styles.movieRow}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.rowTitle}>
                    {section.title}
                    {section.title.toLowerCase().includes('ai') && (
                      <span className={styles.aiBadge}>AI</span>
                    )}
                  </h2>
                  <p className={styles.sectionDescription}>{section.description}</p>
                </div>
                <div className={styles.movieCarousel}>
                  <div className={styles.movieList}>
                    {section.movies.map((movie, index) => (
                      <MovieCard key={movie.id} movie={movie} index={index} />
                    ))}
                  </div>
                </div>
              </section>
            )
          ))}

          {/* Browse All Section */}
          <section className={styles.browseSection}>
            <div className={styles.browseCard}>
              <h2>Explore Our Full Collection</h2>
              <p>Discover thousands of movies across all genres with AI-powered search</p>
              <div className={styles.browseButtons}>
                <Link to="/movies" className="btn btn-large">
                  Browse All Movies
                </Link>
                <Link to="/movies?search=true" className="btn btn-secondary btn-large">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                  </svg>
                  AI Smart Search
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

// Enhanced Movie Card Component
const MovieCard: React.FC<{ movie: Movie; index: number }> = ({ movie, index }) => {
  return (
    <Link
      to={`/movies/${movie.id}`}
      className={movieCardStyles.movieCard}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <div className={movieCardStyles.movieImage}>
        <img
          src={movie.posterUrl || `https://via.placeholder.com/300x450/141414/E50914?text=${encodeURIComponent(movie.title)}`}
          alt={movie.title}
          loading="lazy"
        />
        {movie.currentlyShowing && (
          <div className={movieCardStyles.nowShowingBadge}>Now Showing</div>
        )}
        <div className={movieCardStyles.movieOverlay}>
          <div className={movieCardStyles.movieInfo}>
            <h3>{movie.title}</h3>
            <div className={movieCardStyles.movieMeta}>
              <span>{movie.genre}</span>
              <span>{movie.formattedDuration}</span>
              {movie.averageRating > 0 && (
                <span className={movieCardStyles.rating}>
                  ★ {movieService.formatRating(movie.averageRating)}
                </span>
              )}
            </div>
            <div className={movieCardStyles.movieDetails}>
              <p className={movieCardStyles.director}>By {movie.director}</p>
              <p className={movieCardStyles.price}>
                From {movieService.formatPrice(movie.priceBase)}
              </p>
              {movie.reviewCount > 0 && (
                <p className={movieCardStyles.reviews}>
                  {movie.reviewCount} review{movie.reviewCount !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
          <div className={movieCardStyles.movieActions}>
            <button className={movieCardStyles.playBtnSmall} title="View Details">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default HomePage;
