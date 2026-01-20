import api from './api';
import { Movie, Showtime } from '../types';

export const movieService = {
  async getAllMovies(): Promise<Movie[]> {
    const response = await api.get('/movies');
    return response.data;
  },

  async getMovieById(id: number): Promise<Movie> {
    const response = await api.get(`/movies/${id}`);
    return response.data;
  },

  async getShowtimesByMovie(movieId: number): Promise<Showtime[]> {
    const response = await api.get(`/movies/${movieId}/showtimes`);
    return response.data;
  },

  async searchMovies(query: string): Promise<Movie[]> {
    const response = await api.get(`/movies/search?q=${encodeURIComponent(query)}`);
    return response.data;
  },
};