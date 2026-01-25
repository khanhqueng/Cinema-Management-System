import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { authService } from '../../services/authService';
import styles from './Header.module.css';

const Header: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const isAuthenticated = authService.isAuthenticated();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    authService.logout();
    window.location.href = '/';
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const isActiveLink = (path: string) => {
    return location.pathname === path;
  };

  return (
    <header className={`${styles.netflixHeader} ${isScrolled ? styles.scrolled : ''}`}>
      <nav className={styles.netflixNav}>
        {/* Logo */}
        <div className={styles.netflixNavLeft}>
          <Link to="/" className={styles.netflixLogo}>
            <span className={styles.logoText}>CINEMA</span>
          </Link>

          {/* Desktop Navigation */}
          <ul className={styles.netflixNavPrimary}>
            <li>
              <Link
                to="/"
                className={`${styles.navLink} ${isActiveLink('/') ? styles.active : ''}`}
              >
                Home
              </Link>
            </li>
            <li>
              <Link
                to="/movies"
                className={`${styles.navLink} ${isActiveLink('/movies') ? styles.active : ''}`}
              >
                Movies
              </Link>
            </li>
            <li>
              <Link
                to="/theaters"
                className={`${styles.navLink} ${isActiveLink('/theaters') ? styles.active : ''}`}
              >
                Theaters
              </Link>
            </li>
            {isAuthenticated && (
              <li>
                <Link
                  to="/bookings"
                  className={`${styles.navLink} ${isActiveLink('/bookings') ? styles.active : ''}`}
                >
                  My Bookings
                </Link>
              </li>
            )}
          </ul>
        </div>

        {/* Right Side Navigation */}
        <div className={styles.netflixNavRight}>
          {isAuthenticated ? (
            <div className={styles.userMenu}>
              <div className={styles.userAvatar}>
                <img
                  src="https://via.placeholder.com/32x32/E50914/FFFFFF?text=U"
                  alt="User Avatar"
                  className={styles.avatarImage}
                />
              </div>
              <div className={styles.dropdownMenu}>
                <button onClick={handleLogout} className={styles.logoutBtn}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.59L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
                  </svg>
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.authButtons}>
              <Link to="/login" className="btn btn-secondary btn-small">
                Sign In
              </Link>
              <Link to="/register" className="btn btn-small">
                Sign Up
              </Link>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button className={styles.mobileMenuBtn} onClick={toggleMobileMenu}>
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>

        {/* Mobile Menu */}
        <div className={`${styles.mobileMenu} ${isMobileMenuOpen ? styles.open : ''}`}>
          <ul className={styles.mobileNavLinks}>
            <li>
              <Link to="/" className={styles.mobileNavLink} onClick={() => setIsMobileMenuOpen(false)}>
                Home
              </Link>
            </li>
            <li>
              <Link to="/movies" className={styles.mobileNavLink} onClick={() => setIsMobileMenuOpen(false)}>
                Movies
              </Link>
            </li>
            <li>
              <Link to="/theaters" className={styles.mobileNavLink} onClick={() => setIsMobileMenuOpen(false)}>
                Theaters
              </Link>
            </li>
            {isAuthenticated ? (
              <>
                <li>
                  <Link to="/bookings" className={styles.mobileNavLink} onClick={() => setIsMobileMenuOpen(false)}>
                    My Bookings
                  </Link>
                </li>
                <li>
                  <button onClick={handleLogout} className={`${styles.mobileNavLink} ${styles.logout}`}>
                    Sign Out
                  </button>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link to="/login" className={styles.mobileNavLink} onClick={() => setIsMobileMenuOpen(false)}>
                    Sign In
                  </Link>
                </li>
                <li>
                  <Link to="/register" className={styles.mobileNavLink} onClick={() => setIsMobileMenuOpen(false)}>
                    Sign Up
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </nav>
    </header>
  );
};

export default Header;