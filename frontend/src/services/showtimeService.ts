import api from './api';
import { Showtime, ShowtimeAvailability, PageResponse } from '../types';

interface GetShowtimesParams {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

interface GetShowtimesByDateRangeParams {
  startDate: string;
  endDate: string;
}

export const showtimeService = {
  // Get all showtimes with pagination
  async getAllShowtimes(params: GetShowtimesParams = {}): Promise<PageResponse<Showtime>> {
    const {
      page = 0,
      size = 10,
      sortBy = 'showDatetime',
      sortDir = 'asc'
    } = params;

    const response = await api.get('/showtimes', {
      params: { page, size, sortBy, sortDir }
    });
    return response.data;
  },

  // Get showtime by ID
  async getShowtimeById(id: number): Promise<Showtime> {
    const response = await api.get(`/showtimes/${id}`);
    return response.data;
  },

  // Get upcoming showtimes
  async getUpcomingShowtimes(params: GetShowtimesParams = {}): Promise<PageResponse<Showtime>> {
    const { page = 0, size = 10 } = params;
    const response = await api.get('/showtimes/upcoming', {
      params: { page, size }
    });
    return response.data;
  },

  // Get available showtimes (with seats)
  async getAvailableShowtimes(params: GetShowtimesParams = {}): Promise<PageResponse<Showtime>> {
    const { page = 0, size = 10 } = params;
    const response = await api.get('/showtimes/available', {
      params: { page, size }
    });
    return response.data;
  },

  // Get showtimes by movie
  async getShowtimesByMovie(movieId: number, params: GetShowtimesParams = {}): Promise<PageResponse<Showtime>> {
    const { page = 0, size = 10 } = params;
    const response = await api.get(`/showtimes/movie/${movieId}`, {
      params: { page, size }
    });
    return response.data;
  },

  // Get showtimes by theater
  async getShowtimesByTheater(theaterId: number, params: GetShowtimesParams = {}): Promise<PageResponse<Showtime>> {
    const { page = 0, size = 10 } = params;
    const response = await api.get(`/showtimes/theater/${theaterId}`, {
      params: { page, size }
    });
    return response.data;
  },

  // Get showtimes by date range
  async getShowtimesByDateRange(params: GetShowtimesByDateRangeParams): Promise<Showtime[]> {
    const { startDate, endDate } = params;
    const response = await api.get('/showtimes/date-range', {
      params: { startDate, endDate }
    });
    return response.data;
  },

  // Get showtimes for specific movie and theater
  async getShowtimesByMovieAndTheater(movieId: number, theaterId: number): Promise<Showtime[]> {
    const response = await api.get(`/showtimes/movie/${movieId}/theater/${theaterId}`);
    return response.data;
  },

  // Get popular showtimes
  async getPopularShowtimes(params: GetShowtimesParams = {}): Promise<PageResponse<Showtime>> {
    const { page = 0, size = 10 } = params;
    const response = await api.get('/showtimes/popular', {
      params: { page, size }
    });
    return response.data;
  },

  // Check seat availability for a showtime
  async getShowtimeAvailability(id: number): Promise<ShowtimeAvailability> {
    const response = await api.get(`/showtimes/${id}/availability`);
    return response.data;
  },

  // Utility methods
  formatShowtime(showtime: Showtime): string {
    const date = new Date(showtime.showDatetime);
    return date.toLocaleString('vi-VN', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  formatShowDate(showtime: Showtime): string {
    const date = new Date(showtime.showDatetime);
    return date.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  },

  formatShowTime(showtime: Showtime): string {
    const date = new Date(showtime.showDatetime);
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  getAvailabilityStatus(showtime: Showtime): { status: string; color: string; label: string } {
    const capacity = showtime.theaterCapacity;
    const occupancyRate = ((capacity - showtime.availableSeats) / capacity) * 100;

    // Check if showtime is bookable (use computed property from DTO or calculate)
    const isBookable = showtime.bookable ?? (showtime.upcoming !== false && showtime.availableSeats > 0);

    if (!isBookable) {
      return { status: 'unavailable', color: '#666', label: 'Không thể đặt' };
    }

    if (occupancyRate >= 90) {
      return { status: 'nearly-full', color: '#f44336', label: 'Sắp hết chỗ' };
    }

    if (occupancyRate >= 70) {
      return { status: 'filling-fast', color: '#ff9800', label: 'Đang lấp đầy' };
    }

    return { status: 'available', color: '#4caf50', label: 'Còn chỗ' };
  },

  formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  },

  isShowtimeUpcoming(showtime: Showtime): boolean {
    return new Date(showtime.showDatetime) > new Date();
  },

  getShowtimesByDay(showtimes: Showtime[]): { [date: string]: Showtime[] } {
    const grouped: { [date: string]: Showtime[] } = {};

    showtimes.forEach(showtime => {
      const date = new Date(showtime.showDatetime).toDateString();
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(showtime);
    });

    // Sort showtimes within each day
    Object.keys(grouped).forEach(date => {
      grouped[date].sort((a, b) => new Date(a.showDatetime).getTime() - new Date(b.showDatetime).getTime());
    });

    return grouped;
  }
};