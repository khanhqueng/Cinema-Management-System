import api from './api';
import { Theater, TheaterType, PageResponse } from '../types';

interface GetTheatersParams {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

interface SearchTheatersParams {
  name: string;
  page?: number;
  size?: number;
}

interface GetTheatersByTypeParams {
  type: TheaterType;
  page?: number;
  size?: number;
}

interface GetTheatersByCapacityParams {
  minCapacity: number;
  maxCapacity: number;
  page?: number;
  size?: number;
}

export const theaterService = {
  // Get all theaters with pagination
  async getAllTheaters(params: GetTheatersParams = {}): Promise<PageResponse<Theater>> {
    const {
      page = 0,
      size = 10,
      sortBy = 'name',
      sortDir = 'asc'
    } = params;

    const response = await api.get('/theaters', {
      params: { page, size, sortBy, sortDir }
    });
    return response.data;
  },

  // Get theater by ID
  async getTheaterById(id: number): Promise<Theater> {
    const response = await api.get(`/theaters/${id}`);
    return response.data;
  },

  // Search theaters by name
  async searchTheaters(params: SearchTheatersParams): Promise<PageResponse<Theater>> {
    const { name, page = 0, size = 10 } = params;
    const response = await api.get('/theaters/search', {
      params: { name, page, size }
    });
    return response.data;
  },

  // Get theaters by type
  async getTheatersByType(params: GetTheatersByTypeParams): Promise<PageResponse<Theater>> {
    const { type, page = 0, size = 10 } = params;
    const response = await api.get(`/theaters/type/${type}`, {
      params: { page, size }
    });
    return response.data;
  },

  // Get theaters by capacity range
  async getTheatersByCapacity(params: GetTheatersByCapacityParams): Promise<PageResponse<Theater>> {
    const { minCapacity, maxCapacity, page = 0, size = 10 } = params;
    const response = await api.get('/theaters/capacity', {
      params: { minCapacity, maxCapacity, page, size }
    });
    return response.data;
  },

  // Get theaters with active showtimes
  async getTheatersWithShowtimes(): Promise<Theater[]> {
    const response = await api.get('/theaters/with-showtimes');
    return response.data;
  },

  // Get theater types
  async getTheaterTypes(): Promise<TheaterType[]> {
    const response = await api.get('/theaters/types');
    return response.data;
  },

  // Utility methods
  getTheaterTypeDisplay(type: TheaterType): string {
    switch (type) {
      case TheaterType.STANDARD:
        return 'Standard';
      case TheaterType.VIP:
        return 'VIP';
      case TheaterType.IMAX:
        return 'IMAX';
      case TheaterType.DOLBY:
        return 'Dolby Atmos';
      default:
        return 'Standard';
    }
  },

  getTheaterTypeIcon(type: TheaterType): string {
    switch (type) {
      case TheaterType.STANDARD:
        return '🎬';
      case TheaterType.VIP:
        return '👑';
      case TheaterType.IMAX:
        return '📽️';
      case TheaterType.DOLBY:
        return '🔊';
      default:
        return '🎬';
    }
  },

  getCapacityCategory(capacity: number): string {
    if (capacity <= 50) return 'Small';
    if (capacity <= 100) return 'Medium';
    if (capacity <= 200) return 'Large';
    return 'Extra Large';
  }
};