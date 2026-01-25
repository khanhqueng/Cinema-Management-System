import api from './api';
import { Movie, MovieLegacy, Showtime, PageResponse } from '../types';

interface GetMoviesParams {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

interface SearchMoviesParams extends GetMoviesParams {
  query: string;
}

export const movieService = {
  // Enhanced API endpoints with computed fields (ratings, review counts)
  async getAllMoviesEnhanced(params: GetMoviesParams = {}): Promise<PageResponse<Movie>> {
    const {
      page = 0,
      size = 10,
      sortBy = 'createdAt',
      sortDir = 'desc'
    } = params;

    const response = await api.get('/movies/enhanced', {
      params: { page, size, sortBy, sortDir }
    });
    return response.data;
  },

  async getMovieByIdEnhanced(id: number): Promise<Movie> {
    const response = await api.get(`/movies/${id}/enhanced`);
    return response.data;
  },

  async getCurrentlyShowingMoviesEnhanced(params: GetMoviesParams = {}): Promise<PageResponse<Movie>> {
    const { page = 0, size = 10 } = params;
    const response = await api.get('/movies/currently-showing/enhanced', {
      params: { page, size }
    });
    return response.data;
  },

  async searchMoviesEnhanced(params: SearchMoviesParams): Promise<PageResponse<Movie>> {
    const { query, page = 0, size = 10 } = params;
    const response = await api.get('/movies/search/enhanced', {
      params: { query, page, size }
    });
    return response.data;
  },

  async getMoviesByGenreEnhanced(genre: string, params: GetMoviesParams = {}): Promise<PageResponse<Movie>> {
    const { page = 0, size = 10 } = params;
    const response = await api.get(`/movies/genre/${encodeURIComponent(genre)}/enhanced`, {
      params: { page, size }
    });
    return response.data;
  },

  // Standard API endpoints (now return DTO without computed fields)
  async getAllMovies(params: GetMoviesParams = {}): Promise<PageResponse<Movie>> {
    const {
      page = 0,
      size = 10,
      sortBy = 'createdAt',
      sortDir = 'desc'
    } = params;

    const response = await api.get('/movies', {
      params: { page, size, sortBy, sortDir }
    });
    return response.data;
  },

  async getMovieById(id: number): Promise<Movie> {
    const response = await api.get(`/movies/${id}`);
    return response.data;
  },

  async searchMovies(params: SearchMoviesParams): Promise<PageResponse<Movie>> {
    const { query, page = 0, size = 10 } = params;
    const response = await api.get('/movies/search', {
      params: { query, page, size }
    });
    return response.data;
  },

  async getCurrentlyShowingMovies(params: GetMoviesParams = {}): Promise<PageResponse<Movie>> {
    const { page = 0, size = 10 } = params;
    const response = await api.get('/movies/currently-showing', {
      params: { page, size }
    });
    return response.data;
  },

  async getUpcomingMovies(params: GetMoviesParams = {}): Promise<PageResponse<Movie>> {
    const { page = 0, size = 10 } = params;
    const response = await api.get('/movies/upcoming', {
      params: { page, size }
    });
    return response.data;
  },

  async getMoviesByGenre(genre: string, params: GetMoviesParams = {}): Promise<PageResponse<Movie>> {
    const { page = 0, size = 10 } = params;
    const response = await api.get(`/movies/genre/${encodeURIComponent(genre)}`, {
      params: { page, size }
    });
    return response.data;
  },

  async getPopularMovies(params: GetMoviesParams = {}): Promise<PageResponse<Movie>> {
    const { page = 0, size = 10 } = params;
    const response = await api.get('/movies/popular', {
      params: { page, size }
    });
    return response.data;
  },

  async getMoviesWithShowtimes(params: GetMoviesParams = {}): Promise<PageResponse<Movie>> {
    const { page = 0, size = 10 } = params;
    const response = await api.get('/movies/with-showtimes', {
      params: { page, size }
    });
    return response.data;
  },

  // Additional utility methods
  async getGenres(): Promise<string[]> {
    const response = await api.get('/movies/genres');
    return response.data;
  },

  async getShowtimesByMovie(movieId: number): Promise<Showtime[]> {
    const response = await api.get(`/showtimes/movie/${movieId}`);
    return response.data;
  },

  // Format price in Vietnamese Dong
  formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  },

  // Format rating display
  formatRating(rating: number): string {
    return rating.toFixed(1);
  },

  // Generate star rating display
  getStarRating(rating: number): string {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return '★'.repeat(fullStars) +
           (hasHalfStar ? '☆' : '') +
           '☆'.repeat(emptyStars);
  }
};