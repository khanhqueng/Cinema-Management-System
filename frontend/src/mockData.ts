// Mock data for the cinema management system

export interface Movie {
  id: string;
  title: string;
  genre: string;
  duration: number; // in minutes
  rating: number; // out of 10
  releaseDate: string;
  poster: string;
  description: string;
  director: string;
  cast: string[];
  trailer?: string;
}

export interface Showtime {
  id: string;
  movieId: string;
  date: string;
  time: string;
  hall: string;
  availableSeats: number;
  totalSeats: number;
  price: number;
}

export interface UserFavorite {
  userId: string;
  genres: string[];
}

export const movies: Movie[] = [
  {
    id: '1',
    title: 'Velocity Storm',
    genre: 'Action',
    duration: 142,
    rating: 8.5,
    releaseDate: '2026-02-10',
    poster: 'https://images.unsplash.com/photo-1765510296004-614b6cc204da?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhY3Rpb24lMjBtb3ZpZSUyMHBvc3RlcnxlbnwxfHx8fDE3NzA5OTg2MTJ8MA&ixlib=rb-4.1.0&q=80&w=1080',
    description: 'An elite operative must race against time to prevent a global catastrophe orchestrated by a shadowy organization.',
    director: 'Michael Chen',
    cast: ['Alex Morgan', 'Sarah Chen', 'David Park'],
  },
  {
    id: '2',
    title: 'Cosmic Frontier',
    genre: 'Sci-Fi',
    duration: 156,
    rating: 9.1,
    releaseDate: '2026-01-28',
    poster: 'https://images.unsplash.com/photo-1761948245703-cbf27a3e7502?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzY2ktZmklMjBtb3ZpZSUyMHBvc3RlcnxlbnwxfHx8fDE3NzEwMzMwMDV8MA&ixlib=rb-4.1.0&q=80&w=1080',
    description: 'A crew of space explorers discovers a mysterious signal from the edge of the galaxy that could change humanity forever.',
    director: 'Emma Rodriguez',
    cast: ['James Thompson', 'Lisa Wang', 'Marcus Johnson'],
  },
  {
    id: '3',
    title: 'The Haunting',
    genre: 'Horror',
    duration: 108,
    rating: 7.8,
    releaseDate: '2026-02-05',
    poster: 'https://images.unsplash.com/photo-1769321309399-38d9eda18370?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob3Jyb3IlMjBtb3ZpZSUyMHBvc3RlcnxlbnwxfHx8fDE3NzEwNzExMDN8MA&ixlib=rb-4.1.0&q=80&w=1080',
    description: 'A family moves into their dream home only to discover its dark secrets and the malevolent presence that dwells within.',
    director: 'Robert Kim',
    cast: ['Emily Davis', 'Michael Brown', 'Sophie Anderson'],
  },
  {
    id: '4',
    title: 'Love in Paris',
    genre: 'Romance',
    duration: 118,
    rating: 8.2,
    releaseDate: '2026-02-14',
    poster: 'https://images.unsplash.com/photo-1765510296004-614b6cc204da?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyb21hbmNlJTIwbW92aWUlMjBwb3N0ZXJ8ZW58MXx8fHwxNzcwOTgwMDQ3fDA&ixlib=rb-4.1.0&q=80&w=1080',
    description: 'Two strangers meet by chance in the City of Love and embark on a whirlwind romance that challenges everything they thought they knew.',
    director: 'Claire Martin',
    cast: ['Ryan Cooper', 'Isabella Laurent', 'Pierre Dubois'],
  },
  {
    id: '5',
    title: 'The Last Stand',
    genre: 'Drama',
    duration: 134,
    rating: 8.9,
    releaseDate: '2026-02-01',
    poster: 'https://images.unsplash.com/photo-1765510296004-614b6cc204da?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkcmFtYSUyMGZpbG0lMjBwb3N0ZXJ8ZW58MXx8fHwxNzcwOTk2Njg4fDA&ixlib=rb-4.1.0&q=80&w=1080',
    description: 'A powerful story of redemption and courage as a former soldier fights to protect his community from corruption.',
    director: 'Daniel Foster',
    cast: ['Tom Harrison', 'Rachel Green', 'Kevin White'],
  },
  {
    id: '6',
    title: 'Quantum Realm',
    genre: 'Sci-Fi',
    duration: 145,
    rating: 8.7,
    releaseDate: '2026-02-12',
    poster: 'https://images.unsplash.com/photo-1761948245703-cbf27a3e7502?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzY2ktZmklMjBtb3ZpZSUyMHBvc3RlcnxlbnwxfHx8fDE3NzEwMzMwMDV8MA&ixlib=rb-4.1.0&q=80&w=1080',
    description: 'Scientists accidentally open a portal to a parallel dimension, unleashing consequences they never imagined.',
    director: 'Sophia Lee',
    cast: ['Nathan Brooks', 'Olivia Martinez', 'Chris Evans'],
  },
];

export const showtimes: Showtime[] = [
  // Velocity Storm
  { id: 's1', movieId: '1', date: '2026-02-14', time: '14:00', hall: 'Hall 1', availableSeats: 85, totalSeats: 120, price: 12.99 },
  { id: 's2', movieId: '1', date: '2026-02-14', time: '17:30', hall: 'Hall 1', availableSeats: 102, totalSeats: 120, price: 14.99 },
  { id: 's3', movieId: '1', date: '2026-02-14', time: '21:00', hall: 'Hall 3', availableSeats: 45, totalSeats: 100, price: 14.99 },
  { id: 's4', movieId: '1', date: '2026-02-15', time: '15:00', hall: 'Hall 2', availableSeats: 120, totalSeats: 150, price: 12.99 },
  
  // Cosmic Frontier
  { id: 's5', movieId: '2', date: '2026-02-14', time: '13:30', hall: 'Hall 2', availableSeats: 68, totalSeats: 150, price: 15.99 },
  { id: 's6', movieId: '2', date: '2026-02-14', time: '18:00', hall: 'Hall 2', availableSeats: 12, totalSeats: 150, price: 15.99 },
  { id: 's7', movieId: '2', date: '2026-02-14', time: '22:00', hall: 'Hall 1', availableSeats: 98, totalSeats: 120, price: 15.99 },
  
  // The Haunting
  { id: 's8', movieId: '3', date: '2026-02-14', time: '19:00', hall: 'Hall 4', availableSeats: 55, totalSeats: 80, price: 13.99 },
  { id: 's9', movieId: '3', date: '2026-02-14', time: '22:30', hall: 'Hall 4', availableSeats: 70, totalSeats: 80, price: 13.99 },
  
  // Love in Paris
  { id: 's10', movieId: '4', date: '2026-02-14', time: '16:00', hall: 'Hall 3', availableSeats: 25, totalSeats: 100, price: 13.99 },
  { id: 's11', movieId: '4', date: '2026-02-14', time: '19:30', hall: 'Hall 3', availableSeats: 8, totalSeats: 100, price: 13.99 },
  
  // The Last Stand
  { id: 's12', movieId: '5', date: '2026-02-14', time: '15:30', hall: 'Hall 5', availableSeats: 110, totalSeats: 140, price: 14.99 },
  { id: 's13', movieId: '5', date: '2026-02-14', time: '20:00', hall: 'Hall 5', availableSeats: 95, totalSeats: 140, price: 14.99 },
  
  // Quantum Realm
  { id: 's14', movieId: '6', date: '2026-02-14', time: '14:30', hall: 'Hall 6', availableSeats: 88, totalSeats: 130, price: 15.99 },
  { id: 's15', movieId: '6', date: '2026-02-14', time: '18:30', hall: 'Hall 6', availableSeats: 34, totalSeats: 130, price: 15.99 },
  { id: 's16', movieId: '6', date: '2026-02-14', time: '21:30', hall: 'Hall 2', availableSeats: 122, totalSeats: 150, price: 15.99 },
];

// Mock user favorites (in a real app, this would be per-user)
export const userFavorites: UserFavorite = {
  userId: 'user1',
  genres: ['Sci-Fi', 'Action'],
};

// Function to get movie recommendations based on user's favorite genres
export const getRecommendations = (favorites: UserFavorite): Movie[] => {
  return movies.filter(movie => favorites.genres.includes(movie.genre));
};

// Analytics data for admin dashboard
export interface AnalyticsData {
  totalMovies: number;
  totalShowtimes: number;
  totalBookings: number;
  revenue: number;
  popularMovies: { name: string; bookings: number }[];
  revenueByDay: { date: string; revenue: number }[];
}

export const analyticsData: AnalyticsData = {
  totalMovies: movies.length,
  totalShowtimes: showtimes.length,
  totalBookings: 342,
  revenue: 4873.58,
  popularMovies: [
    { name: 'Cosmic Frontier', bookings: 138 },
    { name: 'Velocity Storm', bookings: 95 },
    { name: 'Love in Paris', bookings: 92 },
    { name: 'The Last Stand', bookings: 45 },
    { name: 'Quantum Realm', bookings: 42 },
  ],
  revenueByDay: [
    { date: '2026-02-08', revenue: 678.32 },
    { date: '2026-02-09', revenue: 743.21 },
    { date: '2026-02-10', revenue: 891.45 },
    { date: '2026-02-11', revenue: 654.78 },
    { date: '2026-02-12', revenue: 823.56 },
    { date: '2026-02-13', revenue: 1082.26 },
    { date: '2026-02-14', revenue: 0 }, // Today
  ],
};
