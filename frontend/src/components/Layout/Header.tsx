import React from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../../services/authService';

const Header: React.FC = () => {
  const isAuthenticated = authService.isAuthenticated();

  const handleLogout = () => {
    authService.logout();
    window.location.href = '/';
  };

  return (
    <header style={headerStyle}>
      <nav style={navStyle}>
        <Link to="/" style={logoStyle}>
          Cinema Management
        </Link>

        <div style={navLinksStyle}>
          <Link to="/movies" style={linkStyle}>Movies</Link>
          <Link to="/theaters" style={linkStyle}>Theaters</Link>

          {isAuthenticated ? (
            <>
              <Link to="/bookings" style={linkStyle}>My Bookings</Link>
              <button onClick={handleLogout} style={buttonStyle}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" style={linkStyle}>Login</Link>
              <Link to="/register" style={linkStyle}>Register</Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
};

const headerStyle: React.CSSProperties = {
  backgroundColor: '#1976d2',
  color: 'white',
  padding: '1rem 0',
  marginBottom: '2rem',
};

const navStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  maxWidth: '1200px',
  margin: '0 auto',
  padding: '0 1rem',
};

const logoStyle: React.CSSProperties = {
  color: 'white',
  textDecoration: 'none',
  fontSize: '1.5rem',
  fontWeight: 'bold',
};

const navLinksStyle: React.CSSProperties = {
  display: 'flex',
  gap: '1rem',
  alignItems: 'center',
};

const linkStyle: React.CSSProperties = {
  color: 'white',
  textDecoration: 'none',
  padding: '0.5rem 1rem',
  borderRadius: '4px',
  transition: 'background-color 0.3s',
};

const buttonStyle: React.CSSProperties = {
  backgroundColor: 'transparent',
  color: 'white',
  border: '1px solid white',
  padding: '0.5rem 1rem',
  borderRadius: '4px',
  cursor: 'pointer',
  textDecoration: 'none',
};

export default Header;