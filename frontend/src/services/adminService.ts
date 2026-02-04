import api from './api';
import {
  Movie,
  Theater,
  TheaterType,
  PageResponse
} from '../types';

// Admin-specific request types
export interface CreateMovieRequest {
  title: string;
  description: string;
  genre: string;
  director: string;
  durationMinutes: number;
  releaseDate: string;
  posterUrl?: string;
  priceBase: number;
}

export interface UpdateMovieRequest extends Partial<CreateMovieRequest> {}

export interface CreateTheaterRequest {
  name: string;
  capacity: number;
  theaterType: TheaterType;
}

export interface UpdateTheaterRequest extends Partial<CreateTheaterRequest> {}

export interface CreateShowtimeRequest {
  movieId: number;
  theaterId: number;
  showDatetime: string;
  price: number;
}

export interface UpdateShowtimeRequest extends Partial<CreateShowtimeRequest> {}

// Statistics interfaces
export interface MovieStats {
  totalMovies: number;
  currentlyShowing: number;
  upcoming: number;
  totalGenres: number;
}

export interface ShowtimeStats {
  totalShowtimes: number;
  upcomingShowtimes: number;
  totalAvailableSeats: number;
}

export interface TheaterStats {
  totalTheaters: number;
  standardTheaters: number;
  vipTheaters: number;
  totalCapacity: number;
}

export interface TheaterUtilization {
  id: number;
  name: string;
  capacity: number;
  totalBookedSeats: number;
  utilizationRate?: number;
}

export interface ShowtimeAvailability {
  availableSeats: number;
  totalCapacity: number;
  bookedSeats: number;
  isBookable: boolean;
  occupancyRate?: number;
}

export const adminService = {
  // ========== MOVIE ADMIN OPERATIONS ==========

  async createMovie(movie: CreateMovieRequest): Promise<Movie> {
    const response = await api.post('/movies', movie);
    return response.data;
  },

  async updateMovie(id: number, movie: UpdateMovieRequest): Promise<Movie> {
    const response = await api.put(`/movies/${id}`, movie);
    return response.data;
  },

  async deleteMovie(id: number): Promise<void> {
    await api.delete(`/movies/${id}`);
  },

  async getMovieStats(): Promise<MovieStats> {
    const response = await api.get('/movies/stats');
    return response.data;
  },

  // ========== THEATER ADMIN OPERATIONS ==========

  async createTheater(theater: CreateTheaterRequest): Promise<Theater> {
    const response = await api.post('/theaters', theater);
    return response.data;
  },

  async updateTheater(id: number, theater: UpdateTheaterRequest): Promise<Theater> {
    const response = await api.put(`/theaters/${id}`, theater);
    return response.data;
  },

  async deleteTheater(id: number): Promise<void> {
    await api.delete(`/theaters/${id}`);
  },

  async getTheaterStats(): Promise<TheaterStats> {
    const response = await api.get('/theaters/stats');
    return response.data;
  },

  async getTheaterUtilization(): Promise<TheaterUtilization[]> {
    const response = await api.get('/theaters/utilization');
    return response.data;
  },

  async getTheaterTypes(): Promise<TheaterType[]> {
    const response = await api.get('/theaters/types');
    return response.data;
  },

  // ========== SHOWTIME ADMIN OPERATIONS ==========

  async createShowtime(showtime: CreateShowtimeRequest): Promise<any> {
    const response = await api.post('/showtimes', showtime);
    return response.data;
  },

  async updateShowtime(id: number, showtime: UpdateShowtimeRequest): Promise<any> {
    const response = await api.put(`/showtimes/${id}`, showtime);
    return response.data;
  },

  async deleteShowtime(id: number): Promise<void> {
    await api.delete(`/showtimes/${id}`);
  },

  async getShowtimeStats(): Promise<ShowtimeStats> {
    const response = await api.get('/showtimes/stats');
    return response.data;
  },

  async getShowtimeAvailability(id: number): Promise<ShowtimeAvailability> {
    const response = await api.get(`/showtimes/${id}/availability`);
    return response.data;
  },

  // ========== UTILITY FUNCTIONS ==========

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  },

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  },

  formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN');
  },

  calculateUtilizationRate(totalBookedSeats: number, capacity: number): number {
    if (capacity === 0) return 0;
    return Math.round((totalBookedSeats / capacity) * 100);
  },

  calculateOccupancyRate(bookedSeats: number, totalCapacity: number): number {
    if (totalCapacity === 0) return 0;
    return Math.round((bookedSeats / totalCapacity) * 100);
  },

  // Theater type display names
  getTheaterTypeDisplay(type: TheaterType): string {
    switch (type) {
      case TheaterType.STANDARD:
        return 'Thường';
      case TheaterType.VIP:
        return 'VIP';
      case TheaterType.IMAX:
        return 'IMAX';
      case TheaterType.DOLBY:
        return 'Dolby';
      default:
        return 'Thường';
    }
  },

  // Status color helpers
  getStatusColor(isActive: boolean): string {
    return isActive ? '#4caf50' : '#f44336';
  },

  getUtilizationColor(rate: number): string {
    if (rate >= 80) return '#4caf50'; // Green - High utilization
    if (rate >= 50) return '#ff9800'; // Orange - Medium utilization
    return '#f44336'; // Red - Low utilization
  }
};

export default adminService;