import React, { useState, useEffect } from 'react';
import adminService, { CreateTheaterRequest, UpdateTheaterRequest, TheaterUtilization } from '../../services/adminService';
import { Theater, TheaterType, PageResponse } from '../../types';
import { theaterService } from '../../services/theaterService';

const AdminTheaters: React.FC = () => {
  const [theaters, setTheaters] = useState<PageResponse<Theater> | null>(null);
  const [theaterTypes, setTheaterTypes] = useState<TheaterType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingTheater, setEditingTheater] = useState<Theater | null>(null);
  const [formData, setFormData] = useState<CreateTheaterRequest>({
    name: '',
    capacity: 0,
    theaterType: TheaterType.STANDARD
  });
  const [currentPage, setCurrentPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchTheaters();
  }, [currentPage]);

  const fetchInitialData = async () => {
    try {
      const types = await adminService.getTheaterTypes();
      setTheaterTypes(types);
      fetchTheaters();
    } catch (err) {
      console.error('Error fetching initial data:', err);
      setError('Failed to load initial data');
    }
  };

  const fetchTheaters = async () => {
    try {
      setLoading(true);
      const response = await theaterService.getAllTheaters({
        page: currentPage,
        size: 10,
        sortBy: 'name',
        sortDir: 'asc'
      });
      setTheaters(response);
    } catch (err) {
      console.error('Error fetching theaters:', err);
      setError('Failed to load theaters');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchTheaters();
      return;
    }

    try {
      setLoading(true);
      const response = await theaterService.searchTheaters({
        name: searchQuery,
        page: currentPage,
        size: 10
      });
      setTheaters(response);
    } catch (err) {
      console.error('Error searching theaters:', err);
      setError('Failed to search theaters');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTheater) {
        await adminService.updateTheater(editingTheater.id, formData);
        alert('Theater updated successfully!');
      } else {
        await adminService.createTheater(formData);
        alert('Theater created successfully!');
      }

      setShowForm(false);
      setEditingTheater(null);
      resetForm();
      fetchTheaters();
    } catch (err) {
      console.error('Error saving theater:', err);
      alert('Failed to save theater');
    }
  };

  const handleEdit = (theater: Theater) => {
    setEditingTheater(theater);
    setFormData({
      name: theater.name,
      capacity: theater.capacity,
      theaterType: theater.theaterType
    });
    setShowForm(true);
  };

  const handleDelete = async (theaterId: number) => {
    if (window.confirm('Are you sure you want to delete this theater? This will also delete all associated showtimes.')) {
      try {
        await adminService.deleteTheater(theaterId);
        alert('Theater deleted successfully!');
        fetchTheaters();
      } catch (err) {
        console.error('Error deleting theater:', err);
        alert('Failed to delete theater');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      capacity: 0,
      theaterType: TheaterType.STANDARD
    });
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  if (loading && !theaters) {
    return (
      <div style={loadingContainerStyle}>
        <div style={spinnerStyle}></div>
        <p>Loading theaters...</p>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <h1 style={titleStyle}>Theater Management</h1>
        <button
          onClick={() => {
            setEditingTheater(null);
            resetForm();
            setShowForm(true);
          }}
          style={addButtonStyle}
        >
          + Add New Theater
        </button>
      </div>

      {/* Search */}
      <div style={searchSectionStyle}>
        <input
          type="text"
          placeholder="Search theaters by name..."
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
              fetchTheaters();
            }}
            style={clearButtonStyle}
          >
            Clear
          </button>
        )}
      </div>

      {/* Theater Form Modal */}
      {showForm && (
        <div style={modalOverlayStyle}>
          <div style={modalStyle}>
            <div style={modalHeaderStyle}>
              <h2>{editingTheater ? 'Edit Theater' : 'Add New Theater'}</h2>
              <button
                onClick={() => setShowForm(false)}
                style={closeButtonStyle}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleFormSubmit} style={formStyle}>
              <div style={formGroupStyle}>
                <label style={labelStyle}>Theater Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  style={inputStyle}
                  placeholder="e.g., Theater A, VIP Hall 1"
                />
              </div>

              <div style={formRowStyle}>
                <div style={formGroupStyle}>
                  <label style={labelStyle}>Capacity *</label>
                  <input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value)})}
                    required
                    min="1"
                    style={inputStyle}
                    placeholder="Number of seats"
                  />
                </div>
                <div style={formGroupStyle}>
                  <label style={labelStyle}>Theater Type *</label>
                  <select
                    value={formData.theaterType}
                    onChange={(e) => setFormData({...formData, theaterType: e.target.value as TheaterType})}
                    required
                    style={selectStyle}
                  >
                    {theaterTypes.map(type => (
                      <option key={type} value={type}>
                        {adminService.getTheaterTypeDisplay(type)}
                      </option>
                    ))}
                  </select>
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
                  {editingTheater ? 'Update' : 'Create'} Theater
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Theaters List */}
      {error ? (
        <div style={errorMessageStyle}>{error}</div>
      ) : (
        <>
          {theaters && (
            <div style={theatersListStyle}>
              <table style={tableStyle}>
                <thead>
                  <tr style={tableHeaderRowStyle}>
                    <th style={tableHeaderStyle}>Theater Name</th>
                    <th style={tableHeaderStyle}>Type</th>
                    <th style={tableHeaderStyle}>Capacity</th>
                    <th style={tableHeaderStyle}>Status</th>
                    <th style={tableHeaderStyle}>Created</th>
                    <th style={tableHeaderStyle}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {theaters.content.map(theater => (
                    <tr key={theater.id} style={tableRowStyle}>
                      <td style={tableCellStyle}>
                        <div style={theaterNameStyle}>{theater.name}</div>
                        <div style={theaterIdStyle}>ID: {theater.id}</div>
                      </td>
                      <td style={tableCellStyle}>
                        <span style={{
                          ...theaterTypeBadgeStyle,
                          backgroundColor: getTheaterTypeColor(theater.theaterType)
                        }}>
                          {adminService.getTheaterTypeDisplay(theater.theaterType)}
                        </span>
                      </td>
                      <td style={tableCellStyle}>
                        <div style={capacityStyle}>
                          <span style={capacityNumberStyle}>{theater.capacity}</span>
                          <span style={capacityLabelStyle}>seats</span>
                        </div>
                      </td>
                      <td style={tableCellStyle}>
                        <span style={{
                          ...statusBadgeStyle,
                          backgroundColor: adminService.getStatusColor(true) // Assume active for now
                        }}>
                          Active
                        </span>
                      </td>
                      <td style={tableCellStyle}>
                        {adminService.formatDate(theater.createdAt)}
                      </td>
                      <td style={tableCellStyle}>
                        <div style={actionButtonsStyle}>
                          <button
                            onClick={() => handleEdit(theater)}
                            style={editButtonStyle}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(theater.id)}
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
              {theaters.totalPages > 1 && (
                <div style={paginationStyle}>
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 0}
                    style={pageButtonStyle}
                  >
                    Previous
                  </button>

                  <span style={pageInfoStyle}>
                    Page {currentPage + 1} of {theaters.totalPages}
                    ({theaters.totalElements} total theaters)
                  </span>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= theaters.totalPages - 1}
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

// Helper function for theater type colors
const getTheaterTypeColor = (type: TheaterType): string => {
  switch (type) {
    case TheaterType.STANDARD:
      return '#4caf50';
    case TheaterType.VIP:
      return '#ff9800';
    case TheaterType.IMAX:
      return '#2196f3';
    case TheaterType.DOLBY:
      return '#9c27b0';
    default:
      return '#666';
  }
};

// Styles
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
  maxWidth: '500px',
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

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  backgroundColor: 'white',
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

const theatersListStyle: React.CSSProperties = {
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
  verticalAlign: 'middle' as const,
};

const theaterNameStyle: React.CSSProperties = {
  fontWeight: 'bold',
  marginBottom: '0.2rem',
};

const theaterIdStyle: React.CSSProperties = {
  fontSize: '0.8rem',
  color: '#666',
};

const theaterTypeBadgeStyle: React.CSSProperties = {
  color: 'white',
  padding: '0.3rem 0.8rem',
  borderRadius: '20px',
  fontSize: '0.8rem',
  fontWeight: 'bold',
};

const capacityStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
};

const capacityNumberStyle: React.CSSProperties = {
  fontSize: '1.5rem',
  fontWeight: 'bold',
  color: '#333',
};

const capacityLabelStyle: React.CSSProperties = {
  fontSize: '0.8rem',
  color: '#666',
};

const statusBadgeStyle: React.CSSProperties = {
  color: 'white',
  padding: '0.3rem 0.8rem',
  borderRadius: '20px',
  fontSize: '0.8rem',
  fontWeight: 'bold',
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

export default AdminTheaters;