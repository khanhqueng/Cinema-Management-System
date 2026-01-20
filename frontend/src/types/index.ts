// User types
export interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'USER' | 'ADMIN';
}

// Movie types
export interface Movie {
  id: number;
  title: string;
  description: string;
  genre: string;
  duration: number;
  releaseDate: string;
  rating: string;
  posterUrl?: string;
  trailerUrl?: string;
}

// Theater types
export interface Theater {
  id: number;
  name: string;
  location: string;
  totalSeats: number;
}

// Showtime types
export interface Showtime {
  id: number;
  movieId: number;
  theaterId: number;
  showDate: string;
  showTime: string;
  price: number;
  availableSeats: number;
  movie?: Movie;
  theater?: Theater;
}

// Booking types
export interface Booking {
  id: number;
  userId: number;
  showtimeId: number;
  seatNumbers: string[];
  bookingDate: string;
  totalPrice: number;
  status: 'CONFIRMED' | 'CANCELLED' | 'PENDING';
  showtime?: Showtime;
}

// Review types
export interface Review {
  id: number;
  userId: number;
  movieId: number;
  rating: number;
  comment: string;
  reviewDate: string;
  user?: User;
  movie?: Movie;
}

// Auth types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}