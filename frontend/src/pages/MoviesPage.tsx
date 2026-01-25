import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { movieService } from '../services/movieService';
import { Movie, PageResponse } from '../types';

const MoviesPage: React.FC = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const [genres, setGenres] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 12;

  useEffect(() => {
    fetchGenres();
    fetchMovies();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchMovies();
  }, [currentPage, sortBy, sortDir]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchGenres = async () => {
    try {
      const genresData = await movieService.getGenres();
      setGenres(genresData);
    } catch (err) {
      console.error('Error fetching genres:', err);
    }
  };

  const fetchMovies = async () => {
    try {
      setLoading(true);
      let moviesResponse: PageResponse<Movie>;

      if (searchQuery.trim()) {
        moviesResponse = await movieService.searchMoviesEnhanced({
          query: searchQuery,
          page: currentPage,
          size: pageSize,
          sortBy,
          sortDir
        });
      } else if (selectedGenre) {
        moviesResponse = await movieService.getMoviesByGenreEnhanced(selectedGenre, {
          page: currentPage,
          size: pageSize,
          sortBy,
          sortDir
        });
      } else {
        moviesResponse = await movieService.getAllMoviesEnhanced({
          page: currentPage,
          size: pageSize,
          sortBy,
          sortDir
        });
      }

      setMovies(moviesResponse.content);
      setTotalPages(moviesResponse.totalPages);
      setTotalElements(moviesResponse.totalElements);
    } catch (err) {
      setError('Failed to fetch movies');
      console.error('Error fetching movies:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(0);
    setSelectedGenre('');
    fetchMovies();
  };

  const handleGenreFilter = (genre: string) => {
    setSelectedGenre(genre);
    setSearchQuery('');
    setCurrentPage(0);
    fetchMovies();
  };

  const handleSort = (newSortBy: string) => {
    if (sortBy === newSortBy) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortDir('desc');
    }
    setCurrentPage(0);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedGenre('');
    setCurrentPage(0);
    fetchMovies();
  };

  if (loading) return <div style={centerStyle}>Loading movies...</div>;
  if (error) return <div style={centerStyle}>Error: {error}</div>;

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h1>All Movies ({totalElements} movies)</h1>

        {/* Search Bar */}
        <form onSubmit={handleSearch} style={searchFormStyle}>
          <input
            type="text"
            placeholder="Search movies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={searchInputStyle}
          />
          <button type="submit" style={searchButtonStyle}>
            Search
          </button>
        </form>

        {/* Filters and Sort */}
        <div style={filtersStyle}>
          {/* Genre Filter */}
          <div style={filterGroupStyle}>
            <label>Genre:</label>
            <select
              value={selectedGenre}
              onChange={(e) => handleGenreFilter(e.target.value)}
              style={selectStyle}
            >
              <option value="">All Genres</option>
              {genres.map(genre => (
                <option key={genre} value={genre}>{genre}</option>
              ))}
            </select>
          </div>

          {/* Sort Options */}
          <div style={filterGroupStyle}>
            <label>Sort by:</label>
            <div style={sortButtonsStyle}>
              <button
                onClick={() => handleSort('title')}
                style={sortBy === 'title' ? activeSortButtonStyle : sortButtonStyle}
              >
                Title {sortBy === 'title' && (sortDir === 'asc' ? '↑' : '↓')}
              </button>
              <button
                onClick={() => handleSort('averageRating')}
                style={sortBy === 'averageRating' ? activeSortButtonStyle : sortButtonStyle}
              >
                Rating {sortBy === 'averageRating' && (sortDir === 'asc' ? '↑' : '↓')}
              </button>
              <button
                onClick={() => handleSort('createdAt')}
                style={sortBy === 'createdAt' ? activeSortButtonStyle : sortButtonStyle}
              >
                Latest {sortBy === 'createdAt' && (sortDir === 'asc' ? '↑' : '↓')}
              </button>
            </div>
          </div>

          {/* Clear Filters */}
          {(searchQuery || selectedGenre) && (
            <button onClick={clearFilters} style={clearButtonStyle}>
              Clear All Filters
            </button>
          )}
        </div>
      </div>

      {movies.length === 0 ? (
        <div style={centerStyle}>
          {searchQuery || selectedGenre ? 'No movies found matching your filters.' : 'No movies available.'}
        </div>
      ) : (
        <>
          <div style={moviesGridStyle}>
            {movies.map((movie) => (
              <div key={movie.id} style={movieCardStyle}>
                <div style={posterContainerStyle}>
                  <img
                    src={movie.posterUrl || `https://via.placeholder.com/300x450/141414/E50914?text=${encodeURIComponent(movie.title)}`}
                    alt={movie.title}
                    style={posterStyle}
                  />
                  {movie.currentlyShowing && (
                    <div style={nowShowingBadgeStyle}>Now Showing</div>
                  )}
                  {movie.averageRating > 0 && (
                    <div style={ratingBadgeStyle}>
                      ★ {movieService.formatRating(movie.averageRating)}
                    </div>
                  )}
                </div>
                <div style={movieInfoStyle}>
                  <h3 style={titleStyle}>{movie.title}</h3>
                  <p style={directorStyle}>Directed by {movie.director}</p>
                  <p style={genreStyle}>{movie.genre}</p>
                  <div style={metaStyle}>
                    <span style={durationStyle}>{movie.formattedDuration}</span>
                    <span style={priceStyle}>{movieService.formatPrice(movie.priceBase)}</span>
                  </div>
                  {movie.reviewCount > 0 && (
                    <p style={reviewsStyle}>
                      {movie.reviewCount} review{movie.reviewCount !== 1 ? 's' : ''}
                    </p>
                  )}
                  <p style={descriptionStyle}>
                    {movie.description && movie.description.length > 120
                      ? `${movie.description.substring(0, 120)}...`
                      : movie.description || 'No description available'
                    }
                  </p>
                  <div style={actionsStyle}>
                    <Link to={`/movies/${movie.id}`} style={detailsButtonStyle}>
                      View Details
                    </Link>
                    <Link to={`/movies/${movie.id}/showtimes`} style={showtimesButtonStyle}>
                      Show Times
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={paginationStyle}>
              <button
                onClick={() => setCurrentPage(0)}
                disabled={currentPage === 0}
                style={currentPage === 0 ? disabledButtonStyle : pageButtonStyle}
              >
                First
              </button>
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 0}
                style={currentPage === 0 ? disabledButtonStyle : pageButtonStyle}
              >
                Previous
              </button>

              <span style={pageInfoStyle}>
                Page {currentPage + 1} of {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage >= totalPages - 1}
                style={currentPage >= totalPages - 1 ? disabledButtonStyle : pageButtonStyle}
              >
                Next
              </button>
              <button
                onClick={() => setCurrentPage(totalPages - 1)}
                disabled={currentPage >= totalPages - 1}
                style={currentPage >= totalPages - 1 ? disabledButtonStyle : pageButtonStyle}
              >
                Last
              </button>
            </div>
          )}
        </>
      )}
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
  color: '#666',
};

const headerStyle: React.CSSProperties = {
  marginBottom: '2rem',
};

const searchFormStyle: React.CSSProperties = {
  display: 'flex',
  gap: '0.5rem',
  marginTop: '1rem',
  flexWrap: 'wrap',
};

const searchInputStyle: React.CSSProperties = {
  flex: '1',
  minWidth: '200px',
  padding: '0.8rem',
  border: '1px solid #ddd',
  borderRadius: '4px',
  fontSize: '1rem',
};

const searchButtonStyle: React.CSSProperties = {
  backgroundColor: '#1976d2',
  color: 'white',
  border: 'none',
  padding: '0.8rem 1.5rem',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '1rem',
};

const clearButtonStyle: React.CSSProperties = {
  backgroundColor: '#666',
  color: 'white',
  border: 'none',
  padding: '0.8rem 1rem',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '1rem',
};

const moviesGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
  gap: '2rem',
  marginTop: '2rem',
};

const movieCardStyle: React.CSSProperties = {
  border: '1px solid #ddd',
  borderRadius: '8px',
  overflow: 'hidden',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  transition: 'transform 0.2s, box-shadow 0.2s',
};

const posterStyle: React.CSSProperties = {
  width: '100%',
  height: '250px',
  objectFit: 'cover',
};

const movieInfoStyle: React.CSSProperties = {
  padding: '1.5rem',
};

const titleStyle: React.CSSProperties = {
  margin: '0 0 0.5rem 0',
  fontSize: '1.3rem',
  color: '#333',
};

const genreStyle: React.CSSProperties = {
  color: '#1976d2',
  fontWeight: 'bold',
  margin: '0.5rem 0',
  fontSize: '0.9rem',
};

const metaStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  margin: '0.5rem 0 1rem 0',
};

const durationStyle: React.CSSProperties = {
  color: '#888',
  fontSize: '0.9rem',
};

const descriptionStyle: React.CSSProperties = {
  color: '#555',
  fontSize: '0.9rem',
  lineHeight: '1.4',
  margin: '1rem 0 1.5rem 0',
};

const actionsStyle: React.CSSProperties = {
  display: 'flex',
  gap: '0.5rem',
  flexWrap: 'wrap',
};

const detailsButtonStyle: React.CSSProperties = {
  backgroundColor: '#1976d2',
  color: 'white',
  padding: '0.6rem 1.2rem',
  textDecoration: 'none',
  borderRadius: '4px',
  fontSize: '0.9rem',
  flex: '1',
  textAlign: 'center',
  minWidth: '100px',
};

const showtimesButtonStyle: React.CSSProperties = {
  backgroundColor: '#388e3c',
  color: 'white',
  padding: '0.6rem 1.2rem',
  textDecoration: 'none',
  borderRadius: '4px',
  fontSize: '0.9rem',
  flex: '1',
  textAlign: 'center',
  minWidth: '100px',
};

// New styles for enhanced UI
const filtersStyle: React.CSSProperties = {
  display: 'flex',
  gap: '2rem',
  marginTop: '1.5rem',
  padding: '1rem',
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
  flexWrap: 'wrap',
  alignItems: 'center',
};

const filterGroupStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
};

const selectStyle: React.CSSProperties = {
  padding: '0.5rem',
  border: '1px solid #ddd',
  borderRadius: '4px',
  fontSize: '0.9rem',
  minWidth: '120px',
};

const sortButtonsStyle: React.CSSProperties = {
  display: 'flex',
  gap: '0.5rem',
  flexWrap: 'wrap',
};

const sortButtonStyle: React.CSSProperties = {
  padding: '0.4rem 0.8rem',
  border: '1px solid #ddd',
  backgroundColor: 'white',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '0.8rem',
  transition: 'all 0.2s',
};

const activeSortButtonStyle: React.CSSProperties = {
  ...sortButtonStyle,
  backgroundColor: '#1976d2',
  color: 'white',
  borderColor: '#1976d2',
};

const posterContainerStyle: React.CSSProperties = {
  position: 'relative',
};

const nowShowingBadgeStyle: React.CSSProperties = {
  position: 'absolute',
  top: '8px',
  left: '8px',
  backgroundColor: '#e50914',
  color: 'white',
  padding: '4px 8px',
  borderRadius: '4px',
  fontSize: '0.7rem',
  fontWeight: 'bold',
  textTransform: 'uppercase',
};

const ratingBadgeStyle: React.CSSProperties = {
  position: 'absolute',
  top: '8px',
  right: '8px',
  backgroundColor: 'rgba(0, 0, 0, 0.8)',
  color: '#ffc107',
  padding: '4px 6px',
  borderRadius: '4px',
  fontSize: '0.7rem',
  fontWeight: 'bold',
};

const directorStyle: React.CSSProperties = {
  color: '#666',
  fontSize: '0.85rem',
  margin: '0.2rem 0',
  fontStyle: 'italic',
};

const priceStyle: React.CSSProperties = {
  color: '#2e7d32',
  fontSize: '0.9rem',
  fontWeight: 'bold',
};

const reviewsStyle: React.CSSProperties = {
  color: '#666',
  fontSize: '0.8rem',
  margin: '0.3rem 0',
};

const paginationStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: '1rem',
  margin: '3rem 0',
  padding: '1rem',
};

const pageButtonStyle: React.CSSProperties = {
  padding: '0.5rem 1rem',
  border: '1px solid #1976d2',
  backgroundColor: 'white',
  color: '#1976d2',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '0.9rem',
  transition: 'all 0.2s',
};

const disabledButtonStyle: React.CSSProperties = {
  ...pageButtonStyle,
  backgroundColor: '#f5f5f5',
  color: '#999',
  borderColor: '#ddd',
  cursor: 'not-allowed',
};

const pageInfoStyle: React.CSSProperties = {
  color: '#666',
  fontSize: '0.9rem',
  fontWeight: 'bold',
};

export default MoviesPage;