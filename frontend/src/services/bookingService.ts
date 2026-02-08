import api from './api';
import {
  Booking,
  BookingWithSeatsResponse,
  BookingStatus,
  CreateBookingRequest,
  CreateBookingWithSeatsRequest,
  SeatAvailabilityRequest,
  SeatAvailabilityResponse,
  SeatMapResponse,
  SeatBooking,
  SeatBookingDto,
  PageResponse,
  SeatLockResponse,
  SeatReservationRequest
} from '../types';

interface GetBookingsParams {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export const bookingService = {
  // Get user's booking history
  async getMyBookings(params: GetBookingsParams = {}): Promise<PageResponse<Booking>> {
    const { page = 0, size = 10 } = params;
    const response = await api.get('/bookings/my-bookings', {
      params: { page, size }
    });
    return response.data;
  },

  // Get user's upcoming bookings
  async getMyUpcomingBookings(): Promise<Booking[]> {
    const response = await api.get('/bookings/my-bookings/upcoming');
    return response.data;
  },

  // Get booking by ID
  async getBookingById(id: number): Promise<Booking> {
    const response = await api.get(`/bookings/${id}`);
    return response.data;
  },

  // Get booking by reference number
  async getBookingByReference(reference: string): Promise<Booking> {
    const response = await api.get(`/bookings/reference/${reference}`);
    return response.data;
  },

  // Create booking with specific seats
  async createBookingWithSeats(request: CreateBookingWithSeatsRequest): Promise<BookingWithSeatsResponse> {
    const response = await api.post('/bookings/with-seats', request);
    return response.data;
  },

  // Create booking (backward compatibility)
  async createBooking(request: CreateBookingRequest): Promise<Booking> {
    const response = await api.post('/bookings', request);
    return response.data;
  },

  // Cancel booking
  async cancelBooking(id: number): Promise<Booking> {
    const response = await api.put(`/bookings/${id}/cancel`);
    return response.data;
  },

  // Get seat map for a showtime
  async getSeatMapForShowtime(showtimeId: number): Promise<SeatMapResponse> {
    const response = await api.get(`/seats/showtime/${showtimeId}`);
    return response.data;
  },

  // Check seat availability
  async checkSeatAvailability(showtimeId: number, request: SeatAvailabilityRequest): Promise<SeatAvailabilityResponse> {
    const response = await api.post(`/seats/showtime/${showtimeId}/check-availability`, request);
    return response.data;
  },

  // Get user's reserved seats for a showtime
  async getMyReservedSeats(showtimeId: number): Promise<SeatBooking[]> {
    const response = await api.get(`/seats/my-seats/showtime/${showtimeId}`);
    return response.data;
  },

  // Calculate price for selected seats
  async calculateSeatPrice(showtimeId: number, seatIds: number[]): Promise<SeatAvailabilityResponse> {
    const response = await api.post(`/seats/showtime/${showtimeId}/calculate-price`, { seatIds });
    return response.data;
  },

  // === DISTRIBUTED LOCKING METHODS ===

  // Reserve seats temporarily for user selection (prevents race conditions)
  async reserveSeatsForSelection(request: SeatReservationRequest): Promise<SeatLockResponse> {
    const response = await api.post('/bookings/seats/reserve', request);
    return response.data;
  },

  // Release seat reservations when user deselects seats or leaves the page
  async releaseSeatsReservation(request: SeatReservationRequest): Promise<void> {
    await api.post('/bookings/seats/release', request);
  },

  // Check which seats are currently locked for a showtime
  async getLockedSeats(showtimeId: number, seatIds: number[]): Promise<number[]> {
    const response = await api.get('/bookings/seats/locked', {
      params: {
        showtimeId,
        seatIds: seatIds.join(',')
      }
    });
    return response.data;
  },

  // Utility method to handle seat selection with locking
  async handleSeatSelection(
    showtimeId: number,
    selectedSeats: number[],
    onSuccess?: (response: SeatLockResponse) => void,
    onError?: (error: any) => void
  ): Promise<SeatLockResponse | null> {
    if (selectedSeats.length === 0) {
      return null;
    }

    try {
      const response = await this.reserveSeatsForSelection({
        showtimeId,
        seatIds: selectedSeats
      });

      if (response.success) {
        onSuccess?.(response);
      } else {
        onError?.(new Error(response.message));
      }

      return response;
    } catch (error) {
      onError?.(error);
      return null;
    }
  },

  // Utility method to release all selected seats
  async handleSeatDeselection(
    showtimeId: number,
    selectedSeats: number[],
    onComplete?: () => void
  ): Promise<void> {
    if (selectedSeats.length === 0) {
      onComplete?.();
      return;
    }

    try {
      await this.releaseSeatsReservation({
        showtimeId,
        seatIds: selectedSeats
      });
    } catch (error) {
      console.error('Error releasing seat reservations:', error);
    } finally {
      onComplete?.();
    }
  },

  // Utility method to check if seats are locked by other users
  async checkSeatsLockStatus(
    showtimeId: number,
    seatIds: number[]
  ): Promise<{ lockedSeats: number[], availableSeats: number[] }> {
    try {
      const lockedSeats = await this.getLockedSeats(showtimeId, seatIds);
      const availableSeats = seatIds.filter(id => !lockedSeats.includes(id));

      return { lockedSeats, availableSeats };
    } catch (error) {
      console.error('Error checking seat lock status:', error);
      return { lockedSeats: [], availableSeats: seatIds };
    }
  },

  // Auto-cleanup method for seat reservations (call on page unload)
  async cleanupSeatReservations(showtimeId: number, selectedSeats: number[]): Promise<void> {
    if (selectedSeats.length > 0) {
      try {
        await this.releaseSeatsReservation({
          showtimeId,
          seatIds: selectedSeats
        });
      } catch (error) {
        // Silent cleanup - don't throw errors during page unload
        console.warn('Failed to cleanup seat reservations:', error);
      }
    }
  },

  // Utility methods
  getBookingStatusDisplay(status: BookingStatus): string {
    switch (status) {
      case BookingStatus.PENDING:
        return 'Đang xử lý';
      case BookingStatus.CONFIRMED:
        return 'Đã xác nhận';
      case BookingStatus.CANCELLED:
        return 'Đã hủy';
      case BookingStatus.COMPLETED:
        return 'Hoàn thành';
      default:
        return 'Không xác định';
    }
  },

  getBookingStatusColor(status: BookingStatus): string {
    switch (status) {
      case BookingStatus.PENDING:
        return '#ff9800';
      case BookingStatus.CONFIRMED:
        return '#4caf50';
      case BookingStatus.CANCELLED:
        return '#f44336';
      case BookingStatus.COMPLETED:
        return '#2196f3';
      default:
        return '#666';
    }
  },

  formatBookingReference(reference: string | null | undefined): string {
    // Handle null/undefined references
    if (!reference) {
      return 'N/A';
    }
    // Format: ABC123 -> ABC-123
    return reference.replace(/(\w{3})(\d+)/, '$1-$2');
  },

  formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  },

  formatBookingDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  isBookingCancellable(booking: Booking): boolean {
    // Can cancel if:
    // 1. Status is CONFIRMED or PENDING
    // 2. Showtime is at least 2 hours in the future
    if (booking.bookingStatus !== BookingStatus.CONFIRMED &&
        booking.bookingStatus !== BookingStatus.PENDING) {
      return false;
    }

    const showtimeDate = new Date(booking.showtime.showDatetime);
    const now = new Date();
    const twoHoursFromNow = new Date(now.getTime() + (2 * 60 * 60 * 1000));

    return showtimeDate > twoHoursFromNow;
  },

  isShowtimePast(booking: Booking): boolean {
    return new Date(booking.showtime.showDatetime) < new Date();
  },

  getSeatDisplayString(seatBookings?: SeatBooking[] | SeatBookingDto[]): string {
    if (!seatBookings || seatBookings.length === 0) {
      return 'Chưa chọn ghế';
    }

    // Handle both legacy SeatBooking[] and new SeatBookingDto[]
    return seatBookings
      .map(sb => {
        // Check if it's SeatBookingDto (has seatLabel) or legacy SeatBooking (has seat.rowLetter)
        if ('seatLabel' in sb) {
          return sb.seatLabel;
        } else if ('seat' in sb && sb.seat) {
          return `${sb.seat.rowLetter}${sb.seat.seatNumber}`;
        }
        return 'Unknown';
      })
      .sort()
      .join(', ');
  },

  generateSeatMap(seats: any[]): { [row: string]: any[] } {
    const seatMap: { [row: string]: any[] } = {};

    seats.forEach(seat => {
      if (!seatMap[seat.rowLetter]) {
        seatMap[seat.rowLetter] = [];
      }
      seatMap[seat.rowLetter].push(seat);
    });

    // Sort seats within each row
    Object.keys(seatMap).forEach(row => {
      seatMap[row].sort((a, b) => a.seatNumber - b.seatNumber);
    });

    return seatMap;
  },

  getSeatTypeDisplay(seatType: string): string {
    switch (seatType) {
      case 'STANDARD':
        return 'Thường';
      case 'VIP':
        return 'VIP';
      case 'COUPLE':
        return 'Đôi';
      case 'WHEELCHAIR':
        return 'Người khuyết tật';
      default:
        return 'Thường';
    }
  },

  getSeatTypeIcon(seatType: string): string {
    switch (seatType) {
      case 'STANDARD':
        return '💺';
      case 'VIP':
        return '🛋️';
      case 'COUPLE':
        return '💑';
      case 'WHEELCHAIR':
        return '♿';
      default:
        return '💺';
    }
  }
};