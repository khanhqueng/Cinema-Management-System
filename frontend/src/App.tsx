import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Layout/Header';
import AdminLayout from './components/admin/AdminLayout';

// User Pages
import {
  HomePage,
  MoviesPage,
  MovieDetailPage,
  ShowtimePage,
  BookingPage,
  BookingConfirmationPage,
  TheaterPage
} from './pages/user';

// Auth Pages
import { LoginPage, RegisterPage } from './pages/auth';

// Admin Pages
import {
  AdminDashboard,
  AdminMovies,
  AdminTheaters,
  AdminShowtimes
} from './pages/admin';

import './App.css';

function App() {
  return (
    <Router>
      <div className="App netflix-app">
        <Routes>
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="movies" element={<AdminMovies />} />
            <Route path="theaters" element={<AdminTheaters />} />
            <Route path="showtimes" element={<AdminShowtimes />} />
          </Route>

          {/* User Routes */}
          <Route path="/*" element={
            <div>
              <Header />
              <main className="main-content">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/movies" element={<MoviesPage />} />
                  <Route path="/movies/:id" element={<MovieDetailPage />} />
                  <Route path="/movies/:id/showtimes" element={<ShowtimePage />} />
                  <Route path="/booking/:showtimeId" element={<BookingPage />} />
                  <Route path="/booking-confirmation/:bookingId" element={<BookingConfirmationPage />} />
                  <Route path="/theaters" element={<TheaterPage />} />
                  <Route path="/theaters/:theaterId/showtimes" element={<ShowtimePage />} />
                  {/* Future routes for user bookings, profiles, etc. */}
                </Routes>
              </main>
            </div>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
