import React from 'react';
import { Movie } from '../types';
import { formatDuration, formatPrice } from '../utils/format';
import styles from './RecommendationCard.module.css';

interface RecommendationCardProps {
  movie: Movie;
  onViewDetails: (movie: Movie) => void;
  onViewShowtimes: (movie: Movie) => void;
  showReason?: string;
  compact?: boolean;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({
  movie,
  onViewDetails,
  onViewShowtimes,
  showReason,
  compact = false
}) => {
  const placeholderImage = `https://via.placeholder.com/300x450/e2e8f0/64748b?text=${encodeURIComponent(movie.title)}`;

  return (
    <div className={`${styles.recommendationCard} ${compact ? styles.compact : ''}`}>
      {/* Movie Poster */}
      <div className={styles.moviePoster}>
        <img
          src={movie.posterUrl || placeholderImage}
          alt={movie.title}
          onError={(e) => {
            (e.target as HTMLImageElement).src = placeholderImage;
          }}
        />

        {movie.currentlyShowing && (
          <div className={styles.nowShowingBadge}>Now Showing</div>
        )}

        {showReason && (
          <div className={styles.recommendationReason}>
            {showReason}
          </div>
        )}
      </div>

      {/* Movie Info */}
      <div className={styles.movieInfo}>
        <h3 className={styles.movieTitle} title={movie.title}>
          {movie.title}
        </h3>

        <div className={styles.movieMeta}>
          <span className={styles.director}>Dir: {movie.director}</span>
          <span className={styles.genre}>{movie.genre}</span>
          {movie.durationMinutes && (
            <span className={styles.duration}>{formatDuration(movie.durationMinutes)}</span>
          )}
        </div>

        {/* Rating */}
        <div className={styles.movieRating}>
          <div className={styles.stars}>
            {Array.from({ length: 5 }, (_, i) => (
              <svg
                key={i}
                className={`${styles.star} ${i < Math.floor(movie.averageRating || 0) ? styles.filled : ''}`}
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            ))}
          </div>
          <span className={styles.ratingText}>
            {movie.averageRating ? movie.averageRating.toFixed(1) : '0.0'}
            {movie.reviewCount && movie.reviewCount > 0 && (
              <span className={styles.reviewCount}>({movie.reviewCount})</span>
            )}
          </span>
        </div>

        {/* Price */}
        <div className={styles.moviePrice}>
          From {formatPrice(movie.priceBase)}
        </div>

        {/* Action Buttons */}
        <div className={styles.movieActions}>
          <button
            className={`${styles.btn} ${styles.btnOutline}`}
            onClick={() => onViewDetails(movie)}
          >
            Details
          </button>
          <button
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={() => onViewShowtimes(movie)}
          >
            Showtimes
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecommendationCard;