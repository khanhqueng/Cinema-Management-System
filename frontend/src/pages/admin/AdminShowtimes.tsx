import React, { useState, useEffect } from 'react';
import adminService, { CreateShowtimeRequest, UpdateShowtimeRequest } from '../../services/adminService';
import { movieService } from '../../services/movieService';
import { theaterService } from '../../services/theaterService';
import { Movie, Theater, Showtime, PageResponse } from '../../types';

const AdminShowtimes: React.FC = () => {
  const [showtimes, setShowtimes] = useState<PageResponse<Showtime> | null>(null);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [theaters, setTheaters] = useState<Theater[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingShowtime, setEditingShowtime] = useState<Showtime | null>(null);
  const [formData, setFormData] = useState<CreateShowtimeRequest>({
    movieId: 0,
    theaterId: 0,
    showDatetime: '',
    price: 0
  });
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchShowtimes();
  }, [currentPage]);

  const fetchInitialData = async () => {
    try {
      const [moviesResponse, theatersResponse] = await Promise.all([
        movieService.getAllMovies({ page: 0, size: 100, sortBy: 'title', sortDir: 'asc' }),
        theaterService.getAllTheaters({ page: 0, size: 100, sortBy: 'name', sortDir: 'asc' })
      ]);

      setMovies(moviesResponse.content);
      setTheaters(theatersResponse.content);
      fetchShowtimes();
    } catch (err) {
      console.error('Error fetching initial data:', err);
      setError('Failed to load initial data');
    }
  };

  const fetchShowtimes = async () => {
    try {
      setLoading(true);
      // Use direct API call since we don't have dedicated showtime service
      const response = await fetch(`/api/showtimes?page=${currentPage}&size=10&sortBy=showDatetime&sortDir=desc`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setShowtimes(data);
      } else {
        throw new Error('Failed to fetch showtimes');
      }
    } catch (err) {
      console.error('Error fetching showtimes:', err);
      setError('Failed to load showtimes');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingShowtime) {
        await adminService.updateShowtime(editingShowtime.id, formData);
        alert('Showtime updated successfully!');
      } else {
        await adminService.createShowtime(formData);
        alert('Showtime created successfully!');
      }

      setShowForm(false);
      setEditingShowtime(null);
      resetForm();
      fetchShowtimes();
    } catch (err) {
      console.error('Error saving showtime:', err);
      alert('Failed to save showtime');
    }
  };

  const handleEdit = (showtime: Showtime) => {
    setEditingShowtime(showtime);
    setFormData({
      movieId: showtime.movieId,
      theaterId: showtime.theaterId,
      showDatetime: new Date(showtime.showDatetime).toISOString().slice(0, 16),
      price: showtime.price
    });
    setShowForm(true);
  };

  const handleDelete = async (showtimeId: number) => {
    if (window.confirm('Are you sure you want to delete this showtime? This will also cancel all associated bookings.')) {
      try {
        await adminService.deleteShowtime(showtimeId);
        alert('Showtime deleted successfully!');
        fetchShowtimes();
      } catch (err) {
        console.error('Error deleting showtime:', err);
        alert('Failed to delete showtime');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      movieId: 0,
      theaterId: 0,
      showDatetime: '',
      price: 0
    });
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const getMovieTitle = (movieId: number): string => {
    const movie = movies.find(m => m.id === movieId);
    return movie?.title || 'Unknown Movie';
  };

  const getTheaterName = (theaterId: number): string => {
    const theater = theaters.find(t => t.id === theaterId);
    return theater?.name || 'Unknown Theater';
  };

  if (loading && !showtimes) {
    return (
      <div style={loadingContainerStyle}>
        <div style={spinnerStyle}></div>
        <p>Loading showtimes...</p>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <h1 style={titleStyle}>Showtime Management</h1>
        <button
          onClick={() => {
            setEditingShowtime(null);
            resetForm();
            setShowForm(true);
          }}
          style={addButtonStyle}
        >
          + Add New Showtime
        </button>
      </div>

      {/* Showtime Form Modal */}
      {showForm && (
        <div style={modalOverlayStyle}>
          <div style={modalStyle}>
            <div style={modalHeaderStyle}>
              <h2>{editingShowtime ? 'Edit Showtime' : 'Add New Showtime'}</h2>
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
                  <label style={labelStyle}>Movie *</label>
                  <select
                    value={formData.movieId}
                    onChange={(e) => setFormData({...formData, movieId: parseInt(e.target.value)})}
                    required
                    style={selectStyle}
                  >
                    <option value={0}>Select a movie</option>
                    {movies.map(movie => (
                      <option key={movie.id} value={movie.id}>
                        {movie.title} ({adminService.formatDate(movie.releaseDate)})
                      </option>
                    ))}
                  </select>
                </div>
                <div style={formGroupStyle}>
                  <label style={labelStyle}>Theater *</label>
                  <select
                    value={formData.theaterId}
                    onChange={(e) => setFormData({...formData, theaterId: parseInt(e.target.value)})}
                    required
                    style={selectStyle}
                  >
                    <option value={0}>Select a theater</option>
                    {theaters.map(theater => (
                      <option key={theater.id} value={theater.id}>
                        {theater.name} (Capacity: {theater.capacity})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={formRowStyle}>
                <div style={formGroupStyle}>
                  <label style={labelStyle}>Show Date & Time *</label>
                  <input
                    type="datetime-local"
                    value={formData.showDatetime}
                    onChange={(e) => setFormData({...formData, showDatetime: e.target.value})}
                    required
                    style={inputStyle}
                  />
                </div>
                <div style={formGroupStyle}>
                  <label style={labelStyle}>Price (VND) *</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})}
                    required
                    min="0"
                    step="1000"
                    style={inputStyle}
                    placeholder="e.g., 100000"
                  />
                </div>
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
                  {editingShowtime ? 'Update' : 'Create'} Showtime
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Showtimes List */}
      {error ? (
        <div style={errorMessageStyle}>{error}</div>
      ) : (
        <>
          {showtimes && (
            <div style={showtimesListStyle}>
              <table style={tableStyle}>
                <thead>
                  <tr style={tableHeaderRowStyle}>
                    <th style={tableHeaderStyle}>Movie</th>
                    <th style={tableHeaderStyle}>Theater</th>
                    <th style={tableHeaderStyle}>Date & Time</th>
                    <th style={tableHeaderStyle}>Price</th>
                    <th style={tableHeaderStyle}>Available Seats</th>
                    <th style={tableHeaderStyle}>Status</th>
                    <th style={tableHeaderStyle}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {showtimes.content.map(showtime => (
                    <tr key={showtime.id} style={tableRowStyle}>
                      <td style={tableCellStyle}>
                        <div style={movieTitleStyle}>
                          {showtime.movieTitle || getMovieTitle(showtime.movieId)}
                        </div>
                        <div style={movieDetailStyle}>
                          Duration: {showtime.movieDurationMinutes || 'N/A'} min
                        </div>
                      </td>
                      <td style={tableCellStyle}>
                        <div style={theaterNameStyle}>
                          {showtime.theaterName || getTheaterName(showtime.theaterId)}
                        </div>
                        <div style={theaterDetailStyle}>
                          Capacity: {showtime.theaterCapacity || 'N/A'}
                        </div>
                      </td>
                      <td style={tableCellStyle}>
                        <div style={dateTimeStyle}>
                          {adminService.formatDateTime(showtime.showDatetime)}
                        </div>
                        <div style={relativeTimeStyle}>
                          {getRelativeTime(showtime.showDatetime)}
                        </div>
                      </td>
                      <td style={tableCellStyle}>
                        <div style={priceStyle}>
                          {adminService.formatCurrency(showtime.price)}
                        </div>
                      </td>
                      <td style={tableCellStyle}>
                        <div style={seatsStyle}>
                          <span style={availableSeatsStyle}>{showtime.availableSeats}</span>
                          <span style={seatsLabelStyle}>/ {showtime.theaterCapacity || 'N/A'}</span>
                        </div>
                        <div style={occupancyStyle}>
                          {getOccupancyDisplay(showtime.availableSeats, showtime.theaterCapacity)}
                        </div>
                      </td>
                      <td style={tableCellStyle}>
                        <span style={{
                          ...statusBadgeStyle,
                          backgroundColor: getShowtimeStatusColor(showtime.showDatetime)
                        }}>
                          {getShowtimeStatus(showtime.showDatetime)}
                        </span>
                      </td>
                      <td style={tableCellStyle}>
                        <div style={actionButtonsStyle}>
                          <button
                            onClick={() => handleEdit(showtime)}
                            style={editButtonStyle}
                            disabled={isPast(showtime.showDatetime)}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(showtime.id)}
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
              {showtimes.totalPages > 1 && (
                <div style={paginationStyle}>
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 0}
                    style={pageButtonStyle}
                  >
                    Previous
                  </button>

                  <span style={pageInfoStyle}>
                    Page {currentPage + 1} of {showtimes.totalPages}
                    ({showtimes.totalElements} total showtimes)
                  </span>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= showtimes.totalPages - 1}
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

// Helper functions
const getRelativeTime = (dateTimeString: string): string => {
  const now = new Date();
  const showTime = new Date(dateTimeString);
  const diffInMs = showTime.getTime() - now.getTime();
  const diffInHours = Math.round(diffInMs / (1000 * 60 * 60));

  if (diffInHours < -24) {
    return `${Math.abs(Math.round(diffInHours / 24))} days ago`;
  } else if (diffInHours < 0) {
    return `${Math.abs(diffInHours)} hours ago`;
  } else if (diffInHours < 24) {
    return `in ${diffInHours} hours`;
  } else {
    return `in ${Math.round(diffInHours / 24)} days`;
  }
};

const getShowtimeStatus = (dateTimeString: string): string => {
  const now = new Date();
  const showTime = new Date(dateTimeString);

  if (showTime < now) {
    return 'Past';
  } else if (showTime.getTime() - now.getTime() < 24 * 60 * 60 * 1000) {
    return 'Today';
  } else if (showTime.getTime() - now.getTime() < 7 * 24 * 60 * 60 * 1000) {
    return 'This Week';
  } else {
    return 'Upcoming';
  }
};

const getShowtimeStatusColor = (dateTimeString: string): string => {
  const status = getShowtimeStatus(dateTimeString);
  switch (status) {
    case 'Past':
      return '#666';
    case 'Today':
      return '#e50914';
    case 'This Week':
      return '#ff9800';
    case 'Upcoming':
      return '#4caf50';
    default:
      return '#666';
  }
};

const getOccupancyDisplay = (availableSeats: number, totalCapacity: number): string => {
  if (!totalCapacity) return 'N/A';
  const occupancyRate = Math.round(((totalCapacity - availableSeats) / totalCapacity) * 100);
  return `${occupancyRate}% booked`;
};

const isPast = (dateTimeString: string): boolean => {
  return new Date(dateTimeString) < new Date();
};

// Styles (reuse existing styles)
const containerStyle: React.CSSProperties = { padding: '2rem', backgroundColor: '#f5f5f5', minHeight: '100vh' };
const loadingContainerStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', gap: '1rem' };
const spinnerStyle: React.CSSProperties = { border: '4px solid #f3f3f3', borderTop: '4px solid #e50914', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' };
const headerStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' };
const titleStyle: React.CSSProperties = { fontSize: '2rem', fontWeight: 'bold', color: '#333', margin: 0 };
const addButtonStyle: React.CSSProperties = { backgroundColor: '#e50914', color: 'white', border: 'none', padding: '0.8rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' };
const modalOverlayStyle: React.CSSProperties = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const modalStyle: React.CSSProperties = { backgroundColor: 'white', borderRadius: '12px', padding: '0', width: '90%', maxWidth: '600px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' };
const modalHeaderStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 2rem', borderBottom: '1px solid #eee', backgroundColor: '#f8f9fa' };
const closeButtonStyle: React.CSSProperties = { background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#666', padding: '0.2rem 0.5rem' };
const formStyle: React.CSSProperties = { padding: '2rem', overflow: 'auto' };
const formRowStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' };
const formGroupStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', marginBottom: '1rem' };
const labelStyle: React.CSSProperties = { marginBottom: '0.5rem', fontWeight: 'bold', color: '#333' };
const inputStyle: React.CSSProperties = { padding: '0.8rem', border: '1px solid #ddd', borderRadius: '8px', fontSize: '1rem' };
const selectStyle: React.CSSProperties = { ...inputStyle, backgroundColor: 'white' };
const formActionsStyle: React.CSSProperties = { display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' };
const cancelButtonStyle: React.CSSProperties = { backgroundColor: '#666', color: 'white', border: 'none', padding: '0.8rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' };
const saveButtonStyle: React.CSSProperties = { backgroundColor: '#e50914', color: 'white', border: 'none', padding: '0.8rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' };
const errorMessageStyle: React.CSSProperties = { color: '#f44336', backgroundColor: '#ffebee', padding: '1rem', borderRadius: '8px', marginBottom: '2rem' };
const showtimesListStyle: React.CSSProperties = { backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' };
const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse' as const };
const tableHeaderRowStyle: React.CSSProperties = { backgroundColor: '#f8f9fa' };
const tableHeaderStyle: React.CSSProperties = { padding: '1rem', textAlign: 'left' as const, fontWeight: 'bold', color: '#333', borderBottom: '2px solid #dee2e6' };
const tableRowStyle: React.CSSProperties = { borderBottom: '1px solid #dee2e6' };
const tableCellStyle: React.CSSProperties = { padding: '1rem', verticalAlign: 'top' as const };
const movieTitleStyle: React.CSSProperties = { fontWeight: 'bold', marginBottom: '0.2rem' };
const movieDetailStyle: React.CSSProperties = { fontSize: '0.8rem', color: '#666' };
const theaterNameStyle: React.CSSProperties = { fontWeight: 'bold', marginBottom: '0.2rem' };
const theaterDetailStyle: React.CSSProperties = { fontSize: '0.8rem', color: '#666' };
const dateTimeStyle: React.CSSProperties = { fontWeight: 'bold', marginBottom: '0.2rem' };
const relativeTimeStyle: React.CSSProperties = { fontSize: '0.8rem', color: '#666' };
const priceStyle: React.CSSProperties = { fontWeight: 'bold', color: '#e50914', fontSize: '1.1rem' };
const seatsStyle: React.CSSProperties = { display: 'flex', alignItems: 'baseline', marginBottom: '0.2rem' };
const availableSeatsStyle: React.CSSProperties = { fontSize: '1.5rem', fontWeight: 'bold', color: '#333' };
const seatsLabelStyle: React.CSSProperties = { fontSize: '0.9rem', color: '#666', marginLeft: '0.2rem' };
const occupancyStyle: React.CSSProperties = { fontSize: '0.8rem', color: '#666' };
const statusBadgeStyle: React.CSSProperties = { color: 'white', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' };
const actionButtonsStyle: React.CSSProperties = { display: 'flex', gap: '0.5rem' };
const editButtonStyle: React.CSSProperties = { backgroundColor: '#4caf50', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' };
const deleteButtonStyle: React.CSSProperties = { backgroundColor: '#f44336', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' };
const paginationStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem', backgroundColor: '#f8f9fa', borderTop: '1px solid #dee2e6' };
const pageButtonStyle: React.CSSProperties = { backgroundColor: '#e50914', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9rem' };
const pageInfoStyle: React.CSSProperties = { color: '#666', fontSize: '0.9rem' };

export default AdminShowtimes;