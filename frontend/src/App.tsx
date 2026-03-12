import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Header } from "./components/Header";
import AdminLayout from "./components/admin/AdminLayout";
import ProtectedRoute from "./components/ProtectedRoute";

// User Pages
import {
  HomePage,
  MoviesPage,
  MovieDetailPage,
  ShowtimePage,
  AllShowtimesPage,
  BookingPage,
  PaymentPage,
  BookingConfirmationPage,
  TheaterPage,
  UserProfilePage,
  RecommendationPage,
} from "./pages/user";

// Auth Pages
import { LoginPage, RegisterPage } from "./pages/auth";

// Admin Pages
import {
  AdminDashboard,
  AdminMovies,
  AdminTheaters,
  AdminShowtimes,
  AdminProfilePage,
} from "./pages/admin";

import "./App.css";

function App() {
  return (
    <Router>
      <div className="App netflix-app">
        <Routes>
          {/* Admin Routes - Protected */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="movies" element={<AdminMovies />} />
            <Route path="theaters" element={<AdminTheaters />} />
            <Route path="showtimes" element={<AdminShowtimes />} />
            <Route path="profile" element={<AdminProfilePage />} />
          </Route>

          {/* User Routes */}
          <Route
            path="/*"
            element={
              <div>
                <Header />
                <main className="main-content">
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/movies" element={<MoviesPage />} />
                    <Route path="/movies/:id" element={<MovieDetailPage />} />
                    <Route
                      path="/movies/:id/showtimes"
                      element={<ShowtimePage />}
                    />
                    <Route path="/showtimes" element={<AllShowtimesPage />} />
                    <Route
                      path="/booking/:showtimeId"
                      element={<BookingPage />}
                    />
                    <Route
                      path="/payment/:showtimeId"
                      element={<PaymentPage />}
                    />
                    <Route
                      path="/booking-confirmation/:bookingId"
                      element={<BookingConfirmationPage />}
                    />
                    <Route path="/theaters" element={<TheaterPage />} />
                    <Route
                      path="/theaters/:theaterId/showtimes"
                      element={<ShowtimePage />}
                    />
                    <Route path="/profile" element={<UserProfilePage />} />
                    <Route
                      path="/recommendations"
                      element={<RecommendationPage />}
                    />
                    {/* Future routes for user bookings, etc. */}
                  </Routes>
                </main>
              </div>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
