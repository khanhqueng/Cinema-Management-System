import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { movieService } from '../../services/movieService';
import { Movie } from '../../types';
import styles from './HomePage.module.css';
import movieCardStyles from './MovieCard.module.css';

const HomePage: React.FC = () => {
  const [featuredMovie, setFeaturedMovie] = useState<Movie | null>(null);
  const [currentlyShowing, setCurrentlyShowing] = useState<Movie[]>([]);
  const [allMovies, setAllMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        // Fetch currently showing movies for the hero section and trending
        const currentlyShowingResponse = await movieService.getCurrentlyShowingMoviesEnhanced({
          page: 0,
          size: 8
        });

        // Fetch all movies for new releases section
        const allMoviesResponse = await movieService.getAllMoviesEnhanced({
          page: 0,
          size: 12,
          sortBy: 'createdAt',
          sortDir: 'desc'
        });

        if (currentlyShowingResponse.content.length > 0) {
          setFeaturedMovie(currentlyShowingResponse.content[0]);
          setCurrentlyShowing(currentlyShowingResponse.content.slice(1));
        }

        setAllMovies(allMoviesResponse.content);
      } catch (err) {
        setError('Failed to load movies');
        console.error('Error fetching movies:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
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

      {/* Movie Rows */}
      <div className={styles.movieSections}>
        <div className="container">
          {/* Currently Showing */}
          {currentlyShowing.length > 0 && (
            <section className={styles.movieRow}>
              <h2 className={styles.rowTitle}>Currently Showing</h2>
              <div className={styles.movieCarousel}>
                <div className={styles.movieList}>
                  {currentlyShowing.map((movie, index) => (
                    <MovieCard key={movie.id} movie={movie} index={index} />
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* All Movies */}
          {allMovies.length > 0 && (
            <section className={styles.movieRow}>
              <h2 className={styles.rowTitle}>All Movies</h2>
              <div className={styles.movieCarousel}>
                <div className={styles.movieList}>
                  {allMovies.slice(0, 8).map((movie, index) => (
                    <MovieCard key={movie.id} movie={movie} index={index} />
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Browse All */}
          <section className={styles.browseSection}>
            <div className={styles.browseCard}>
              <h2>Explore Our Full Collection</h2>
              <p>Discover thousands of movies across all genres</p>
              <Link to="/movies" className="btn btn-large">
                Browse All Movies
              </Link>
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
