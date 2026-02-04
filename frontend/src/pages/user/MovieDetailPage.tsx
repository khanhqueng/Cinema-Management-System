import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { movieService } from '../../services/movieService';
import { Movie } from '../../types';

const MovieDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMovie = async () => {
      if (!id) {
        setError('Movie ID not provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const movieData = await movieService.getMovieByIdEnhanced(parseInt(id, 10));
        setMovie(movieData);
      } catch (err) {
        setError('Failed to load movie details');
        console.error('Error fetching movie:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMovie();
  }, [id]);

  if (loading) {
    return (
      <div style={loadingContainerStyle}>
        <div style={spinnerStyle}></div>
        <p>Loading movie details...</p>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div style={errorContainerStyle}>
        <h2>Movie Not Found</h2>
        <p>{error || 'The requested movie could not be found.'}</p>
        <Link to="/movies" style={backButtonStyle}>
          Back to Movies
        </Link>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {/* Hero Section */}
      <div style={heroSectionStyle}>
        <div style={heroBackgroundStyle}>
          <img
            src={movie.posterUrl || `https://via.placeholder.com/1920x1080/141414/E50914?text=${encodeURIComponent(movie.title)}`}
            alt={movie.title}
            style={heroImageStyle}
          />
          <div style={heroOverlayStyle}></div>
        </div>

        <div style={heroContentStyle}>
          <div style={movieMetaStyle}>
            <Link to="/movies" style={breadcrumbStyle}>Movies</Link>
            <span style={breadcrumbSeparatorStyle}>/</span>
            <span style={currentPageStyle}>{movie.title}</span>
          </div>

          <h1 style={titleStyle}>{movie.title}</h1>

          <div style={movieInfoStyle}>
            <div style={infoRowStyle}>
              <span style={labelStyle}>Director:</span>
              <span>{movie.director}</span>
            </div>
            <div style={infoRowStyle}>
              <span style={labelStyle}>Genre:</span>
              <span style={genreStyle}>{movie.genre}</span>
            </div>
            <div style={infoRowStyle}>
              <span style={labelStyle}>Duration:</span>
              <span>{movie.formattedDuration}</span>
            </div>
            <div style={infoRowStyle}>
              <span style={labelStyle}>Release Date:</span>
              <span>{new Date(movie.releaseDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</span>
            </div>
            <div style={infoRowStyle}>
              <span style={labelStyle}>Price:</span>
              <span style={priceStyle}>{movieService.formatPrice(movie.priceBase)}</span>
            </div>
            {movie.averageRating > 0 && (
              <div style={ratingRowStyle}>
                <span style={labelStyle}>Rating:</span>
                <div style={ratingContainerStyle}>
                  <span style={starsStyle}>
                    {movieService.getStarRating(movie.averageRating)}
                  </span>
                  <span style={ratingValueStyle}>
                    {movieService.formatRating(movie.averageRating)}/5.0
                  </span>
                  {movie.reviewCount > 0 && (
                    <span style={reviewCountStyle}>
                      ({movie.reviewCount} review{movie.reviewCount !== 1 ? 's' : ''})
                    </span>
                  )}
                </div>
              </div>
            )}
            {movie.currentlyShowing && (
              <div style={statusBadgeStyle}>Currently Showing</div>
            )}
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div style={contentSectionStyle}>
        <div style={contentContainerStyle}>
          {/* Movie Description */}
          <section style={sectionStyle}>
            <h2 style={sectionTitleStyle}>Synopsis</h2>
            <p style={descriptionStyle}>
              {movie.description || 'No description available for this movie.'}
            </p>
          </section>

          {/* Action Buttons */}
          <section style={actionsSectionStyle}>
            <Link
              to={`/movies/${movie.id}/showtimes`}
              style={primaryButtonStyle}
            >
              View Showtimes & Book Tickets
            </Link>
            <button style={secondaryButtonStyle} onClick={() => window.history.back()}>
              Back to Movies
            </button>
          </section>

          {/* Additional Movie Information */}
          <section style={sectionStyle}>
            <h2 style={sectionTitleStyle}>Movie Details</h2>
            <div style={detailsGridStyle}>
              <div style={detailItemStyle}>
                <strong>Director:</strong> {movie.director}
              </div>
              <div style={detailItemStyle}>
                <strong>Genre:</strong> {movie.genre}
              </div>
              <div style={detailItemStyle}>
                <strong>Duration:</strong> {movie.formattedDuration}
              </div>
              <div style={detailItemStyle}>
                <strong>Release Date:</strong> {new Date(movie.releaseDate).toLocaleDateString()}
              </div>
              <div style={detailItemStyle}>
                <strong>Base Price:</strong> {movieService.formatPrice(movie.priceBase)}
              </div>
              <div style={detailItemStyle}>
                <strong>Status:</strong> {movie.currentlyShowing ? 'Now Showing' : 'Coming Soon'}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

// Styles
const containerStyle: React.CSSProperties = {
  minHeight: '100vh',
  backgroundColor: '#000',
};

const loadingContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '60vh',
  gap: '1rem',
  color: '#fff',
};

const spinnerStyle: React.CSSProperties = {
  border: '4px solid #333',
  borderTop: '4px solid #e50914',
  borderRadius: '50%',
  width: '40px',
  height: '40px',
  animation: 'spin 1s linear infinite',
};

const errorContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '60vh',
  gap: '1rem',
  color: '#fff',
  textAlign: 'center',
};

const heroSectionStyle: React.CSSProperties = {
  position: 'relative',
  minHeight: '70vh',
  display: 'flex',
  alignItems: 'center',
};

const heroBackgroundStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  overflow: 'hidden',
};

const heroImageStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  filter: 'brightness(0.4)',
};

const heroOverlayStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'linear-gradient(to right, rgba(0,0,0,0.8) 30%, rgba(0,0,0,0.4) 70%, transparent)',
};

const heroContentStyle: React.CSSProperties = {
  position: 'relative',
  zIndex: 2,
  padding: '0 2rem',
  maxWidth: '800px',
  color: '#fff',
};

const movieMetaStyle: React.CSSProperties = {
  marginBottom: '1rem',
  fontSize: '0.9rem',
};

const breadcrumbStyle: React.CSSProperties = {
  color: '#ccc',
  textDecoration: 'none',
};

const breadcrumbSeparatorStyle: React.CSSProperties = {
  margin: '0 0.5rem',
  color: '#666',
};

const currentPageStyle: React.CSSProperties = {
  color: '#fff',
};

const titleStyle: React.CSSProperties = {
  fontSize: '3rem',
  fontWeight: 'bold',
  margin: '0 0 1.5rem 0',
  lineHeight: '1.2',
};

const movieInfoStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.8rem',
};

const infoRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: '1rem',
  alignItems: 'center',
};

const ratingRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: '1rem',
  alignItems: 'center',
};

const labelStyle: React.CSSProperties = {
  fontWeight: 'bold',
  minWidth: '100px',
  color: '#ccc',
};

const genreStyle: React.CSSProperties = {
  background: '#1976d2',
  color: '#fff',
  padding: '0.2rem 0.8rem',
  borderRadius: '12px',
  fontSize: '0.8rem',
};

const priceStyle: React.CSSProperties = {
  color: '#4caf50',
  fontWeight: 'bold',
  fontSize: '1.1rem',
};

const ratingContainerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.8rem',
};

const starsStyle: React.CSSProperties = {
  color: '#ffc107',
  fontSize: '1.2rem',
};

const ratingValueStyle: React.CSSProperties = {
  fontWeight: 'bold',
  fontSize: '1.1rem',
};

const reviewCountStyle: React.CSSProperties = {
  color: '#ccc',
  fontSize: '0.9rem',
};

const statusBadgeStyle: React.CSSProperties = {
  alignSelf: 'flex-start',
  background: '#e50914',
  color: '#fff',
  padding: '0.5rem 1rem',
  borderRadius: '6px',
  fontWeight: 'bold',
  textTransform: 'uppercase',
  fontSize: '0.8rem',
};

const contentSectionStyle: React.CSSProperties = {
  backgroundColor: '#111',
  padding: '3rem 0',
};

const contentContainerStyle: React.CSSProperties = {
  maxWidth: '1200px',
  margin: '0 auto',
  padding: '0 2rem',
  color: '#fff',
};

const sectionStyle: React.CSSProperties = {
  marginBottom: '3rem',
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '1.5rem',
  fontWeight: 'bold',
  marginBottom: '1rem',
  color: '#fff',
};

const descriptionStyle: React.CSSProperties = {
  fontSize: '1.1rem',
  lineHeight: '1.7',
  color: '#ccc',
  maxWidth: '800px',
};

const actionsSectionStyle: React.CSSProperties = {
  display: 'flex',
  gap: '1rem',
  marginBottom: '3rem',
  flexWrap: 'wrap',
};

const primaryButtonStyle: React.CSSProperties = {
  background: '#e50914',
  color: '#fff',
  padding: '1rem 2rem',
  textDecoration: 'none',
  borderRadius: '6px',
  fontWeight: 'bold',
  fontSize: '1rem',
  textAlign: 'center',
  transition: 'background 0.2s',
  border: 'none',
  cursor: 'pointer',
};

const secondaryButtonStyle: React.CSSProperties = {
  background: 'transparent',
  color: '#fff',
  padding: '1rem 2rem',
  border: '2px solid #666',
  borderRadius: '6px',
  fontWeight: 'bold',
  fontSize: '1rem',
  cursor: 'pointer',
  transition: 'all 0.2s',
};

const backButtonStyle: React.CSSProperties = {
  ...primaryButtonStyle,
  display: 'inline-block',
};

const detailsGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
  gap: '1rem',
  maxWidth: '800px',
};

const detailItemStyle: React.CSSProperties = {
  padding: '1rem',
  background: '#222',
  borderRadius: '6px',
  color: '#ccc',
};

export default MovieDetailPage;