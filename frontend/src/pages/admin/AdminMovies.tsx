import React, { useState, useEffect } from 'react';
import { movieService } from '../../services/movieService';
import adminService, { CreateMovieRequest, UpdateMovieRequest } from '../../services/adminService';
import { Movie, PageResponse } from '../../types';

const AdminMovies: React.FC = () => {
  const [movies, setMovies] = useState<PageResponse<Movie> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [formData, setFormData] = useState<CreateMovieRequest>({
    title: '',
    description: '',
    genre: '',
    director: '',
    durationMinutes: 0,
    releaseDate: '',
    posterUrl: '',
    priceBase: 0
  });
  const [currentPage, setCurrentPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchMovies();
  }, [currentPage]);

  const fetchMovies = async () => {
    try {
      setLoading(true);
      const response = await movieService.getAllMovies({
        page: currentPage,
        size: 10,
        sortBy: 'createdAt',
        sortDir: 'desc'
      });
      setMovies(response);
    } catch (err) {
      console.error('Error fetching movies:', err);
      setError('Failed to load movies');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchMovies();
      return;
    }

    try {
      setLoading(true);
      const response = await movieService.searchMovies({
        query: searchQuery,
        page: currentPage,
        size: 10
      });
      setMovies(response);
    } catch (err) {
      console.error('Error searching movies:', err);
      setError('Failed to search movies');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingMovie) {
        await adminService.updateMovie(editingMovie.id, formData);
        alert('Movie updated successfully!');
      } else {
        await adminService.createMovie(formData);
        alert('Movie created successfully!');
      }

      setShowForm(false);
      setEditingMovie(null);
      resetForm();
      fetchMovies();
    } catch (err) {
      console.error('Error saving movie:', err);
      alert('Failed to save movie');
    }
  };

  const handleEdit = (movie: Movie) => {
    setEditingMovie(movie);
    setFormData({
      title: movie.title,
      description: movie.description,
      genre: movie.genre,
      director: movie.director,
      durationMinutes: movie.durationMinutes,
      releaseDate: movie.releaseDate.split('T')[0], // Format for date input
      posterUrl: movie.posterUrl || '',
      priceBase: movie.priceBase
    });
    setShowForm(true);
  };

  const handleDelete = async (movieId: number) => {
    if (window.confirm('Are you sure you want to delete this movie?')) {
      try {
        await adminService.deleteMovie(movieId);
        alert('Movie deleted successfully!');
        fetchMovies();
      } catch (err) {
        console.error('Error deleting movie:', err);
        alert('Failed to delete movie');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      genre: '',
      director: '',
      durationMinutes: 0,
      releaseDate: '',
      posterUrl: '',
      priceBase: 0
    });
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  if (loading && !movies) {
    return (
      <div style={loadingContainerStyle}>
        <div style={spinnerStyle}></div>
        <p>Loading movies...</p>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <h1 style={titleStyle}>Movie Management</h1>
        <button
          onClick={() => {
            setEditingMovie(null);
            resetForm();
            setShowForm(true);
          }}
          style={addButtonStyle}
        >
          + Add New Movie
        </button>
      </div>

      {/* Search */}
      <div style={searchSectionStyle}>
        <input
          type="text"
          placeholder="Search movies..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={searchInputStyle}
        />
        <button onClick={handleSearch} style={searchButtonStyle}>
          Search
        </button>
        {searchQuery && (
          <button
            onClick={() => {
              setSearchQuery('');
              fetchMovies();
            }}
            style={clearButtonStyle}
          >
            Clear
          </button>
        )}
      </div>

      {/* Movie Form Modal */}
      {showForm && (
        <div style={modalOverlayStyle}>
          <div style={modalStyle}>
            <div style={modalHeaderStyle}>
              <h2>{editingMovie ? 'Edit Movie' : 'Add New Movie'}</h2>
              <button
                onClick={() => setShowForm(false)}
                style={closeButtonStyle}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleFormSubmit} style={formStyle}>
              <div style={formRowStyle}>
                <div style={formGroupStyle}>
                  <label style={labelStyle}>Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    required
                    style={inputStyle}
                  />
                </div>
                <div style={formGroupStyle}>
                  <label style={labelStyle}>Genre *</label>
                  <input
                    type="text"
                    value={formData.genre}
                    onChange={(e) => setFormData({...formData, genre: e.target.value})}
                    required
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={formRowStyle}>
                <div style={formGroupStyle}>
                  <label style={labelStyle}>Director *</label>
                  <input
                    type="text"
                    value={formData.director}
                    onChange={(e) => setFormData({...formData, director: e.target.value})}
                    required
                    style={inputStyle}
                  />
                </div>
                <div style={formGroupStyle}>
                  <label style={labelStyle}>Duration (minutes) *</label>
                  <input
                    type="number"
                    value={formData.durationMinutes}
                    onChange={(e) => setFormData({...formData, durationMinutes: parseInt(e.target.value)})}
                    required
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={formRowStyle}>
                <div style={formGroupStyle}>
                  <label style={labelStyle}>Release Date *</label>
                  <input
                    type="date"
                    value={formData.releaseDate}
                    onChange={(e) => setFormData({...formData, releaseDate: e.target.value})}
                    required
                    style={inputStyle}
                  />
                </div>
                <div style={formGroupStyle}>
                  <label style={labelStyle}>Base Price (VND) *</label>
                  <input
                    type="number"
                    value={formData.priceBase}
                    onChange={(e) => setFormData({...formData, priceBase: parseFloat(e.target.value)})}
                    required
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={formGroupStyle}>
                <label style={labelStyle}>Poster URL</label>
                <input
                  type="url"
                  value={formData.posterUrl}
                  onChange={(e) => setFormData({...formData, posterUrl: e.target.value})}
                  style={inputStyle}
                />
              </div>

              <div style={formGroupStyle}>
                <label style={labelStyle}>Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  required
                  rows={4}
                  style={textareaStyle}
                />
              </div>

              <div style={formActionsStyle}>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  style={cancelButtonStyle}
                >
                  Cancel
                </button>
                <button type="submit" style={saveButtonStyle}>
                  {editingMovie ? 'Update' : 'Create'} Movie
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Movies List */}
      {error ? (
        <div style={errorMessageStyle}>{error}</div>
      ) : (
        <>
          {movies && (
            <div style={moviesListStyle}>
              <table style={tableStyle}>
                <thead>
                  <tr style={tableHeaderRowStyle}>
                    <th style={tableHeaderStyle}>Poster</th>
                    <th style={tableHeaderStyle}>Title</th>
                    <th style={tableHeaderStyle}>Genre</th>
                    <th style={tableHeaderStyle}>Director</th>
                    <th style={tableHeaderStyle}>Duration</th>
                    <th style={tableHeaderStyle}>Release Date</th>
                    <th style={tableHeaderStyle}>Price</th>
                    <th style={tableHeaderStyle}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {movies.content.map(movie => (
                    <tr key={movie.id} style={tableRowStyle}>
                      <td style={tableCellStyle}>
                        <img
                          src={movie.posterUrl || `https://via.placeholder.com/60x90/141414/E50914?text=${encodeURIComponent(movie.title.slice(0, 3))}`}
                          alt={movie.title}
                          style={posterImageStyle}
                        />
                      </td>
                      <td style={tableCellStyle}>
                        <div style={movieTitleStyle}>{movie.title}</div>
                        <div style={movieDescriptionStyle}>
                          {movie.description.length > 100
                            ? movie.description.substring(0, 100) + '...'
                            : movie.description}
                        </div>
                      </td>
                      <td style={tableCellStyle}>{movie.genre}</td>
                      <td style={tableCellStyle}>{movie.director}</td>
                      <td style={tableCellStyle}>{movie.durationMinutes} min</td>
                      <td style={tableCellStyle}>
                        {adminService.formatDate(movie.releaseDate)}
                      </td>
                      <td style={tableCellStyle}>
                        {adminService.formatCurrency(movie.priceBase)}
                      </td>
                      <td style={tableCellStyle}>
                        <div style={actionButtonsStyle}>
                          <button
                            onClick={() => handleEdit(movie)}
                            style={editButtonStyle}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(movie.id)}
                            style={deleteButtonStyle}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {movies.totalPages > 1 && (
                <div style={paginationStyle}>
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 0}
                    style={pageButtonStyle}
                  >
                    Previous
                  </button>

                  <span style={pageInfoStyle}>
                    Page {currentPage + 1} of {movies.totalPages}
                    ({movies.totalElements} total movies)
                  </span>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= movies.totalPages - 1}
                    style={pageButtonStyle}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Styles (similar structure to previous admin pages)
const containerStyle: React.CSSProperties = {
  padding: '2rem',
  backgroundColor: '#f5f5f5',
  minHeight: '100vh',
};

const loadingContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '60vh',
  gap: '1rem',
};

const spinnerStyle: React.CSSProperties = {
  border: '4px solid #f3f3f3',
  borderTop: '4px solid #e50914',
  borderRadius: '50%',
  width: '40px',
  height: '40px',
  animation: 'spin 1s linear infinite',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '2rem',
};

const titleStyle: React.CSSProperties = {
  fontSize: '2rem',
  fontWeight: 'bold',
  color: '#333',
  margin: 0,
};

const addButtonStyle: React.CSSProperties = {
  backgroundColor: '#e50914',
  color: 'white',
  border: 'none',
  padding: '0.8rem 1.5rem',
  borderRadius: '8px',
  cursor: 'pointer',
  fontWeight: 'bold',
  fontSize: '0.9rem',
};

const searchSectionStyle: React.CSSProperties = {
  display: 'flex',
  gap: '1rem',
  marginBottom: '2rem',
  alignItems: 'center',
};

const searchInputStyle: React.CSSProperties = {
  flex: 1,
  padding: '0.8rem',
  border: '1px solid #ddd',
  borderRadius: '8px',
  fontSize: '1rem',
};

const searchButtonStyle: React.CSSProperties = {
  backgroundColor: '#4caf50',
  color: 'white',
  border: 'none',
  padding: '0.8rem 1.5rem',
  borderRadius: '8px',
  cursor: 'pointer',
  fontWeight: 'bold',
};

const clearButtonStyle: React.CSSProperties = {
  backgroundColor: '#666',
  color: 'white',
  border: 'none',
  padding: '0.8rem 1rem',
  borderRadius: '8px',
  cursor: 'pointer',
};

const modalOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000,
};

const modalStyle: React.CSSProperties = {
  backgroundColor: 'white',
  borderRadius: '12px',
  padding: '0',
  width: '90%',
  maxWidth: '600px',
  maxHeight: '90vh',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
};

const modalHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '1.5rem 2rem',
  borderBottom: '1px solid #eee',
  backgroundColor: '#f8f9fa',
};

const closeButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  fontSize: '1.5rem',
  cursor: 'pointer',
  color: '#666',
  padding: '0.2rem 0.5rem',
};

const formStyle: React.CSSProperties = {
  padding: '2rem',
  overflow: 'auto',
};

const formRowStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '1rem',
  marginBottom: '1rem',
};

const formGroupStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  marginBottom: '1rem',
};

const labelStyle: React.CSSProperties = {
  marginBottom: '0.5rem',
  fontWeight: 'bold',
  color: '#333',
};

const inputStyle: React.CSSProperties = {
  padding: '0.8rem',
  border: '1px solid #ddd',
  borderRadius: '8px',
  fontSize: '1rem',
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  resize: 'vertical' as const,
  minHeight: '100px',
};

const formActionsStyle: React.CSSProperties = {
  display: 'flex',
  gap: '1rem',
  justifyContent: 'flex-end',
  marginTop: '2rem',
};

const cancelButtonStyle: React.CSSProperties = {
  backgroundColor: '#666',
  color: 'white',
  border: 'none',
  padding: '0.8rem 1.5rem',
  borderRadius: '8px',
  cursor: 'pointer',
  fontWeight: 'bold',
};

const saveButtonStyle: React.CSSProperties = {
  backgroundColor: '#e50914',
  color: 'white',
  border: 'none',
  padding: '0.8rem 1.5rem',
  borderRadius: '8px',
  cursor: 'pointer',
  fontWeight: 'bold',
};

const errorMessageStyle: React.CSSProperties = {
  color: '#f44336',
  backgroundColor: '#ffebee',
  padding: '1rem',
  borderRadius: '8px',
  marginBottom: '2rem',
};

const moviesListStyle: React.CSSProperties = {
  backgroundColor: 'white',
  borderRadius: '12px',
  overflow: 'hidden',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
};

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse' as const,
};

const tableHeaderRowStyle: React.CSSProperties = {
  backgroundColor: '#f8f9fa',
};

const tableHeaderStyle: React.CSSProperties = {
  padding: '1rem',
  textAlign: 'left' as const,
  fontWeight: 'bold',
  color: '#333',
  borderBottom: '2px solid #dee2e6',
};

const tableRowStyle: React.CSSProperties = {
  borderBottom: '1px solid #dee2e6',
};

const tableCellStyle: React.CSSProperties = {
  padding: '1rem',
  verticalAlign: 'top' as const,
};

const posterImageStyle: React.CSSProperties = {
  width: '60px',
  height: '90px',
  objectFit: 'cover' as const,
  borderRadius: '4px',
};

const movieTitleStyle: React.CSSProperties = {
  fontWeight: 'bold',
  marginBottom: '0.5rem',
};

const movieDescriptionStyle: React.CSSProperties = {
  fontSize: '0.85rem',
  color: '#666',
  lineHeight: '1.3',
};

const actionButtonsStyle: React.CSSProperties = {
  display: 'flex',
  gap: '0.5rem',
};

const editButtonStyle: React.CSSProperties = {
  backgroundColor: '#4caf50',
  color: 'white',
  border: 'none',
  padding: '0.5rem 1rem',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '0.8rem',
};

const deleteButtonStyle: React.CSSProperties = {
  backgroundColor: '#f44336',
  color: 'white',
  border: 'none',
  padding: '0.5rem 1rem',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '0.8rem',
};

const paginationStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '1rem 2rem',
  backgroundColor: '#f8f9fa',
  borderTop: '1px solid #dee2e6',
};

const pageButtonStyle: React.CSSProperties = {
  backgroundColor: '#e50914',
  color: 'white',
  border: 'none',
  padding: '0.5rem 1rem',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '0.9rem',
};

const pageInfoStyle: React.CSSProperties = {
  color: '#666',
  fontSize: '0.9rem',
};

export default AdminMovies;