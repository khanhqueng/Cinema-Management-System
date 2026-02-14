import React, { useState } from 'react';
import { MOVIE_GENRES, GENRE_DESCRIPTIONS, GENRE_ICONS, MovieGenre } from '../types/genres';
import styles from './GenreSelector.module.css';

interface GenreSelectorProps {
  selectedGenres: string[];
  onGenresChange: (genres: string[]) => void;
  title?: string;
  subtitle?: string;
  maxSelections?: number;
  minSelections?: number;
  disabled?: boolean;
}

const GenreSelector: React.FC<GenreSelectorProps> = ({
  selectedGenres,
  onGenresChange,
  title = "What movies do you like?",
  subtitle = "Select your favorite genres to get personalized recommendations",
  maxSelections = 8,
  minSelections = 3,
  disabled = false
}) => {
  const [showAll, setShowAll] = useState(false);
  const displayGenres = showAll ? MOVIE_GENRES : MOVIE_GENRES.slice(0, 8);

  const handleGenreToggle = (genre: string) => {
    if (disabled) return;

    const isSelected = selectedGenres.includes(genre);

    if (isSelected) {
      // Remove genre
      const newGenres = selectedGenres.filter(g => g !== genre);
      onGenresChange(newGenres);
    } else {
      // Add genre if under max limit
      if (selectedGenres.length < maxSelections) {
        const newGenres = [...selectedGenres, genre];
        onGenresChange(newGenres);
      }
    }
  };

  const getSelectionText = () => {
    const count = selectedGenres.length;
    if (count === 0) {
      return `Select at least ${minSelections} genres`;
    }
    if (count < minSelections) {
      return `Select ${minSelections - count} more genre${minSelections - count > 1 ? 's' : ''}`;
    }
    if (count >= maxSelections) {
      return `Maximum ${maxSelections} genres selected`;
    }
    return `${count} selected (select up to ${maxSelections - count} more)`;
  };

  return (
    <div className={styles.genreSelector}>
      <div className={styles.genreSelectorHeader}>
        <h3 className={styles.genreSelectorTitle}>{title}</h3>
        <p className={styles.genreSelectorSubtitle}>{subtitle}</p>
        <div className={styles.selectionCounter}>
          <span>
            {getSelectionText()}
          </span>
        </div>
      </div>

      <div className={styles.genresGrid}>
        {displayGenres.map((genre: MovieGenre) => {
          const isSelected = selectedGenres.includes(genre);
          const canSelect = !isSelected && selectedGenres.length < maxSelections;

          return (
            <div
              key={genre}
              className={`${styles.genreCard} ${isSelected ? styles.selected : ''} ${
                disabled || (!isSelected && !canSelect) ? styles.disabled : ''
              }`}
              onClick={() => handleGenreToggle(genre)}
              role="button"
              tabIndex={disabled ? -1 : 0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleGenreToggle(genre);
                }
              }}
            >
              <div className={styles.genreIcon}>
                {GENRE_ICONS[genre]}
              </div>
              <div className={styles.genreName}>
                {genre}
              </div>
              <div className={styles.genreDescription}>
                {GENRE_DESCRIPTIONS[genre]}
              </div>
              {isSelected && (
                <div className={styles.selectedIndicator}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!showAll && MOVIE_GENRES.length > 8 && (
        <div className={styles.showMoreContainer}>
          <button
            type="button"
            className={styles.showMoreButton}
            onClick={() => setShowAll(true)}
            disabled={disabled}
          >
            Show {MOVIE_GENRES.length - 8} more genres
          </button>
        </div>
      )}

    </div>
  );
};

export default GenreSelector;