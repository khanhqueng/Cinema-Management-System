import React from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';

const AdminLayout: React.FC = () => {
  const location = useLocation();

  const isActiveRoute = (path: string): boolean => {
    return location.pathname.startsWith(path);
  };

  return (
    <div style={containerStyle}>
      {/* Admin Header */}
      <header style={headerStyle}>
        <div style={headerContentStyle}>
          <div style={logoSectionStyle}>
            <Link to="/admin" style={logoStyle}>
              🎬 Cinema Admin
            </Link>
          </div>

          <nav style={navStyle}>
            <Link
              to="/admin"
              style={{
                ...navLinkStyle,
                ...(location.pathname === '/admin' ? activeNavLinkStyle : {})
              }}
            >
              Dashboard
            </Link>
            <Link
              to="/admin/movies"
              style={{
                ...navLinkStyle,
                ...(isActiveRoute('/admin/movies') ? activeNavLinkStyle : {})
              }}
            >
              Movies
            </Link>
            <Link
              to="/admin/theaters"
              style={{
                ...navLinkStyle,
                ...(isActiveRoute('/admin/theaters') ? activeNavLinkStyle : {})
              }}
            >
              Theaters
            </Link>
            <Link
              to="/admin/showtimes"
              style={{
                ...navLinkStyle,
                ...(isActiveRoute('/admin/showtimes') ? activeNavLinkStyle : {})
              }}
            >
              Showtimes
            </Link>
          </nav>

          <div style={userSectionStyle}>
            <span style={adminBadgeStyle}>Admin</span>
            <Link to="/" style={backToSiteStyle}>
              Back to Site
            </Link>
          </div>
        </div>
      </header>

      {/* Admin Content */}
      <main style={mainStyle}>
        <Outlet />
      </main>

      {/* Admin Footer */}
      <footer style={footerStyle}>
        <div style={footerContentStyle}>
          <p>&copy; 2024 Cinema Management System - Admin Panel</p>
        </div>
      </footer>
    </div>
  );
};

// Styles
const containerStyle: React.CSSProperties = {
  minHeight: '100vh',
  backgroundColor: '#f8f9fa',
  display: 'flex',
  flexDirection: 'column',
};

const headerStyle: React.CSSProperties = {
  backgroundColor: '#212529',
  boxShadow: '0 2px 4px rgba(0,0,0,.1)',
  position: 'sticky',
  top: 0,
  zIndex: 1000,
};

const headerContentStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '1rem 2rem',
  maxWidth: '1400px',
  margin: '0 auto',
  width: '100%',
};

const logoSectionStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
};

const logoStyle: React.CSSProperties = {
  fontSize: '1.5rem',
  fontWeight: 'bold',
  color: '#e50914',
  textDecoration: 'none',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
};

const navStyle: React.CSSProperties = {
  display: 'flex',
  gap: '2rem',
  alignItems: 'center',
};

const navLinkStyle: React.CSSProperties = {
  color: '#adb5bd',
  textDecoration: 'none',
  fontSize: '1rem',
  fontWeight: '500',
  padding: '0.5rem 1rem',
  borderRadius: '6px',
  transition: 'all 0.2s',
};

const activeNavLinkStyle: React.CSSProperties = {
  color: '#fff',
  backgroundColor: '#495057',
};

const userSectionStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
};

const adminBadgeStyle: React.CSSProperties = {
  backgroundColor: '#e50914',
  color: 'white',
  padding: '0.3rem 0.8rem',
  borderRadius: '20px',
  fontSize: '0.8rem',
  fontWeight: 'bold',
};

const backToSiteStyle: React.CSSProperties = {
  color: '#6c757d',
  textDecoration: 'none',
  fontSize: '0.9rem',
  padding: '0.5rem 1rem',
  border: '1px solid #6c757d',
  borderRadius: '6px',
  transition: 'all 0.2s',
};

const mainStyle: React.CSSProperties = {
  flex: 1,
  width: '100%',
  maxWidth: '1400px',
  margin: '0 auto',
  padding: '0',
};

const footerStyle: React.CSSProperties = {
  backgroundColor: '#212529',
  color: '#6c757d',
  padding: '1rem 0',
  marginTop: 'auto',
};

const footerContentStyle: React.CSSProperties = {
  textAlign: 'center' as const,
  maxWidth: '1400px',
  margin: '0 auto',
  padding: '0 2rem',
};

export default AdminLayout;