import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { movieService } from '../services/movieService';
import { Movie } from '../types';

const HomePage: React.FC = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const moviesData = await movieService.getAllMovies();
        setMovies(moviesData.slice(0, 6)); // Show only first 6 movies on home page
      } catch (err) {
        setError('Failed to fetch movies');
        console.error('Error fetching movies:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, []);

  if (loading) return <div style={centerStyle}>Loading...</div>;
  if (error) return <div style={centerStyle}>Error: {error}</div>;

  return (
    <div style={containerStyle}>
      <section style={heroStyle}>
        <h1>Welcome to Cinema Management</h1>
        <p>Discover and book your favorite movies</p>
        <Link to="/movies" style={ctaButtonStyle}>
          Browse All Movies
        </Link>
      </section>

      <section>
        <h2>Featured Movies</h2>
        <div style={moviesGridStyle}>
          {movies.map((movie) => (
            <div key={movie.id} style={movieCardStyle}>
              {movie.posterUrl && (
                <img
                  src={movie.posterUrl}
                  alt={movie.title}
                  style={posterStyle}
                />
              )}
              <div style={movieInfoStyle}>
                <h3>{movie.title}</h3>
                <p style={genreStyle}>{movie.genre}</p>
                <p style={durationStyle}>{movie.duration} min</p>
                <p style={descriptionStyle}>
                  {movie.description.length > 100
                    ? `${movie.description.substring(0, 100)}...`
                    : movie.description
                  }
                </p>
                <Link to={`/movies/${movie.id}`} style={linkButtonStyle}>
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

const containerStyle: React.CSSProperties = {
  maxWidth: '1200px',
  margin: '0 auto',
  padding: '0 1rem',
};

const centerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '200px',
  fontSize: '1.2rem',
};

const heroStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '3rem 0',
  backgroundColor: '#f5f5f5',
  marginBottom: '3rem',
  borderRadius: '8px',
};

const ctaButtonStyle: React.CSSProperties = {
  display: 'inline-block',
  backgroundColor: '#1976d2',
  color: 'white',
  padding: '0.8rem 2rem',
  textDecoration: 'none',
  borderRadius: '4px',
  marginTop: '1rem',
};

const moviesGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
  gap: '2rem',
  marginTop: '2rem',
};

const movieCardStyle: React.CSSProperties = {
  border: '1px solid #ddd',
  borderRadius: '8px',
  overflow: 'hidden',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
};

const posterStyle: React.CSSProperties = {
  width: '100%',
  height: '200px',
  objectFit: 'cover',
};

const movieInfoStyle: React.CSSProperties = {
  padding: '1rem',
};

const genreStyle: React.CSSProperties = {
  color: '#666',
  fontWeight: 'bold',
  margin: '0.5rem 0',
};

const durationStyle: React.CSSProperties = {
  color: '#888',
  fontSize: '0.9rem',
  margin: '0.5rem 0',
};

const descriptionStyle: React.CSSProperties = {
  color: '#555',
  fontSize: '0.9rem',
  lineHeight: '1.4',
  margin: '1rem 0',
};

const linkButtonStyle: React.CSSProperties = {
  backgroundColor: '#1976d2',
  color: 'white',
  padding: '0.5rem 1rem',
  textDecoration: 'none',
  borderRadius: '4px',
  display: 'inline-block',
};

export default HomePage;