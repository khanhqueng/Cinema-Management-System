import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import adminService, { MovieStats, ShowtimeStats, TheaterStats, TheaterUtilization } from '../../services/adminService';

const AdminDashboard: React.FC = () => {
  const [movieStats, setMovieStats] = useState<MovieStats | null>(null);
  const [showtimeStats, setShowtimeStats] = useState<ShowtimeStats | null>(null);
  const [theaterStats, setTheaterStats] = useState<TheaterStats | null>(null);
  const [theaterUtilization, setTheaterUtilization] = useState<TheaterUtilization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [movies, showtimes, theaters, utilization] = await Promise.all([
          adminService.getMovieStats(),
          adminService.getShowtimeStats(),
          adminService.getTheaterStats(),
          adminService.getTheaterUtilization()
        ]);

        setMovieStats(movies);
        setShowtimeStats(showtimes);
        setTheaterStats(theaters);
        setTheaterUtilization(utilization);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div style={loadingContainerStyle}>
        <div style={spinnerStyle}></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={errorContainerStyle}>
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()} style={refreshButtonStyle}>
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <h1 style={titleStyle}>Admin Dashboard</h1>
        <p style={subtitleStyle}>Cinema management overview</p>
      </div>

      {/* Quick Actions */}
      <div style={quickActionsStyle}>
        <Link to="/admin/movies" style={actionButtonStyle}>
          <span style={actionIconStyle}>🎬</span>
          <span>Manage Movies</span>
        </Link>
        <Link to="/admin/theaters" style={actionButtonStyle}>
          <span style={actionIconStyle}>🏛️</span>
          <span>Manage Theaters</span>
        </Link>
        <Link to="/admin/showtimes" style={actionButtonStyle}>
          <span style={actionIconStyle}>🕒</span>
          <span>Manage Showtimes</span>
        </Link>
        <Link to="/admin/bookings" style={actionButtonStyle}>
          <span style={actionIconStyle}>🎫</span>
          <span>View Bookings</span>
        </Link>
      </div>

      {/* Statistics Cards */}
      <div style={statsGridStyle}>
        {/* Movie Stats */}
        <div style={statCardStyle}>
          <div style={statHeaderStyle}>
            <h3 style={statTitleStyle}>Movies</h3>
            <span style={statIconStyle}>🎬</span>
          </div>
          {movieStats && (
            <div style={statContentStyle}>
              <div style={statItemStyle}>
                <span style={statLabelStyle}>Total Movies:</span>
                <span style={statValueStyle}>{movieStats.totalMovies}</span>
              </div>
              <div style={statItemStyle}>
                <span style={statLabelStyle}>Currently Showing:</span>
                <span style={statValueStyle}>{movieStats.currentlyShowing}</span>
              </div>
              <div style={statItemStyle}>
                <span style={statLabelStyle}>Upcoming:</span>
                <span style={statValueStyle}>{movieStats.upcoming}</span>
              </div>
              <div style={statItemStyle}>
                <span style={statLabelStyle}>Total Genres:</span>
                <span style={statValueStyle}>{movieStats.totalGenres}</span>
              </div>
            </div>
          )}
        </div>

        {/* Theater Stats */}
        <div style={statCardStyle}>
          <div style={statHeaderStyle}>
            <h3 style={statTitleStyle}>Theaters</h3>
            <span style={statIconStyle}>🏛️</span>
          </div>
          {theaterStats && (
            <div style={statContentStyle}>
              <div style={statItemStyle}>
                <span style={statLabelStyle}>Total Theaters:</span>
                <span style={statValueStyle}>{theaterStats.totalTheaters}</span>
              </div>
              <div style={statItemStyle}>
                <span style={statLabelStyle}>Standard:</span>
                <span style={statValueStyle}>{theaterStats.standardTheaters}</span>
              </div>
              <div style={statItemStyle}>
                <span style={statLabelStyle}>VIP:</span>
                <span style={statValueStyle}>{theaterStats.vipTheaters}</span>
              </div>
              <div style={statItemStyle}>
                <span style={statLabelStyle}>Total Capacity:</span>
                <span style={statValueStyle}>{theaterStats.totalCapacity}</span>
              </div>
            </div>
          )}
        </div>

        {/* Showtime Stats */}
        <div style={statCardStyle}>
          <div style={statHeaderStyle}>
            <h3 style={statTitleStyle}>Showtimes</h3>
            <span style={statIconStyle}>🕒</span>
          </div>
          {showtimeStats && (
            <div style={statContentStyle}>
              <div style={statItemStyle}>
                <span style={statLabelStyle}>Total Showtimes:</span>
                <span style={statValueStyle}>{showtimeStats.totalShowtimes}</span>
              </div>
              <div style={statItemStyle}>
                <span style={statLabelStyle}>Upcoming:</span>
                <span style={statValueStyle}>{showtimeStats.upcomingShowtimes}</span>
              </div>
              <div style={statItemStyle}>
                <span style={statLabelStyle}>Available Seats:</span>
                <span style={statValueStyle}>{showtimeStats.totalAvailableSeats}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Theater Utilization */}
      <div style={utilizationSectionStyle}>
        <h2 style={sectionTitleStyle}>Theater Utilization</h2>
        <div style={utilizationGridStyle}>
          {theaterUtilization.map(theater => {
            const utilizationRate = adminService.calculateUtilizationRate(
              theater.totalBookedSeats,
              theater.capacity
            );
            return (
              <div key={theater.id} style={utilizationCardStyle}>
                <div style={utilizationHeaderStyle}>
                  <h4 style={utilizationNameStyle}>{theater.name}</h4>
                  <span
                    style={{
                      ...utilizationBadgeStyle,
                      backgroundColor: adminService.getUtilizationColor(utilizationRate)
                    }}
                  >
                    {utilizationRate}%
                  </span>
                </div>
                <div style={utilizationDetailsStyle}>
                  <div style={utilizationDetailStyle}>
                    <span>Capacity:</span>
                    <span>{theater.capacity} seats</span>
                  </div>
                  <div style={utilizationDetailStyle}>
                    <span>Booked:</span>
                    <span>{theater.totalBookedSeats} seats</span>
                  </div>
                  <div style={utilizationBarStyle}>
                    <div
                      style={{
                        ...utilizationFillStyle,
                        width: `${utilizationRate}%`,
                        backgroundColor: adminService.getUtilizationColor(utilizationRate)
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Styles
const containerStyle: React.CSSProperties = {
  minHeight: '100vh',
  backgroundColor: '#f5f5f5',
  padding: '2rem',
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

const errorContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '60vh',
  gap: '1rem',
  textAlign: 'center',
};

const refreshButtonStyle: React.CSSProperties = {
  backgroundColor: '#e50914',
  color: 'white',
  border: 'none',
  padding: '0.8rem 1.5rem',
  borderRadius: '8px',
  cursor: 'pointer',
  fontWeight: 'bold',
};

const headerStyle: React.CSSProperties = {
  textAlign: 'center',
  marginBottom: '3rem',
};

const titleStyle: React.CSSProperties = {
  fontSize: '2.5rem',
  fontWeight: 'bold',
  color: '#333',
  marginBottom: '0.5rem',
};

const subtitleStyle: React.CSSProperties = {
  fontSize: '1.1rem',
  color: '#666',
};

const quickActionsStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '1.5rem',
  marginBottom: '3rem',
};

const actionButtonStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '1rem',
  padding: '2rem',
  backgroundColor: 'white',
  borderRadius: '12px',
  textDecoration: 'none',
  color: '#333',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  transition: 'transform 0.2s, box-shadow 0.2s',
  fontWeight: '600',
};

const actionIconStyle: React.CSSProperties = {
  fontSize: '2rem',
};

const statsGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
  gap: '2rem',
  marginBottom: '3rem',
};

const statCardStyle: React.CSSProperties = {
  backgroundColor: 'white',
  borderRadius: '12px',
  padding: '2rem',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
};

const statHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '1.5rem',
  borderBottom: '2px solid #f0f0f0',
  paddingBottom: '1rem',
};

const statTitleStyle: React.CSSProperties = {
  fontSize: '1.3rem',
  fontWeight: 'bold',
  color: '#333',
  margin: 0,
};

const statIconStyle: React.CSSProperties = {
  fontSize: '1.8rem',
};

const statContentStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
};

const statItemStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const statLabelStyle: React.CSSProperties = {
  color: '#666',
  fontSize: '0.9rem',
};

const statValueStyle: React.CSSProperties = {
  fontWeight: 'bold',
  color: '#333',
  fontSize: '1.1rem',
};

const utilizationSectionStyle: React.CSSProperties = {
  marginTop: '3rem',
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '1.8rem',
  fontWeight: 'bold',
  color: '#333',
  marginBottom: '2rem',
};

const utilizationGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: '1.5rem',
};

const utilizationCardStyle: React.CSSProperties = {
  backgroundColor: 'white',
  borderRadius: '12px',
  padding: '1.5rem',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
};

const utilizationHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '1rem',
};

const utilizationNameStyle: React.CSSProperties = {
  fontSize: '1.1rem',
  fontWeight: 'bold',
  color: '#333',
  margin: 0,
};

const utilizationBadgeStyle: React.CSSProperties = {
  color: 'white',
  padding: '0.3rem 0.8rem',
  borderRadius: '20px',
  fontSize: '0.85rem',
  fontWeight: 'bold',
};

const utilizationDetailsStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.8rem',
};

const utilizationDetailStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: '0.9rem',
  color: '#666',
};

const utilizationBarStyle: React.CSSProperties = {
  width: '100%',
  height: '8px',
  backgroundColor: '#e0e0e0',
  borderRadius: '4px',
  overflow: 'hidden',
  marginTop: '0.5rem',
};

const utilizationFillStyle: React.CSSProperties = {
  height: '100%',
  borderRadius: '4px',
  transition: 'width 0.3s ease',
};

export default AdminDashboard;