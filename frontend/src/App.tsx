import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Layout/Header';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import MoviesPage from './pages/MoviesPage';
import MovieDetailPage from './pages/MovieDetailPage';
import ShowtimePage from './pages/ShowtimePage';
import BookingPage from './pages/BookingPage';
import BookingConfirmationPage from './pages/BookingConfirmationPage';
import TheaterPage from './pages/TheaterPage';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App netflix-app">
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
    </Router>
  );
}

export default App;
