// Temporary mockData stub for NEW UI components
// This will be replaced with real API data from OLD logic

export interface Movie {
  id: string;
  title: string;
  genre: string;
  rating: number;
  duration: number;
  poster: string;
  description: string;
}

export interface Showtime {
  id: string;
  movieId: string;
  date: string;
  time: string;
  theater: string;
  totalSeats: number;
  availableSeats: number;
  price: number;
}

// Empty arrays - will be replaced with OLD API data
export const movies: Movie[] = [];
export const showtimes: Showtime[] = [];

// Analytics data stub
export const analyticsData = {
  revenue: [],
  bookings: [],
  movies: [],
  stats: {}
};