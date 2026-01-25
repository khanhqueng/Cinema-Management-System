// User types
export interface User {
  id: number;
  email: string;
  fullName: string;
  phone?: string;
  role: string;
  createdAt: string;
}

// Movie types - Updated to match backend enhanced API
export interface Movie {
  id: number;
  title: string;
  description: string;
  genre: string;
  director: string;
  durationMinutes: number;
  releaseDate: string;
  posterUrl?: string;
  priceBase: number;
  createdAt: string;
  // Computed fields from backend
  currentlyShowing: boolean;
  formattedDuration: string;
  averageRating: number;
  reviewCount: number;
}

// For backward compatibility - legacy Movie interface
export interface MovieLegacy {
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

// Theater types - Updated to match backend TheaterDto
export interface Theater {
  id: number;
  name: string;
  capacity: number;
  theaterType: TheaterType;
  createdAt: string;
  // Computed properties from DTO
  theaterTypeName?: string;
  vip?: boolean;
  standard?: boolean;
}

export enum TheaterType {
  STANDARD = 'STANDARD',
  VIP = 'VIP',
  IMAX = 'IMAX',
  DOLBY = 'DOLBY'
}

// Showtime types - Updated to match backend ShowtimeDto
export interface Showtime {
  id: number;
  movieId: number;
  movieTitle: string;
  moviePosterUrl?: string;
  movieDurationMinutes: number;
  theaterId: number;
  theaterName: string;
  theaterCapacity: number;
  showDatetime: string;
  price: number;
  availableSeats: number;
  createdAt: string;
  // Computed properties from DTO
  endDatetime?: string;
  upcoming?: boolean;
  ongoing?: boolean;
  finished?: boolean;
  bookable?: boolean;
  bookedSeats?: number;
  occupancyRate?: number;
  showtimeDisplay?: string;
}

// Legacy Showtime interface for backward compatibility
export interface ShowtimeLegacy {
  id: number;
  movie: Movie;
  theater: Theater;
  showDatetime: string;
  price: number;
  availableSeats: number;
  capacity: number;
  bookedSeats: number;
  bookable: boolean;
}

// Seat types - Updated to match backend structure
export interface Seat {
  id: number;
  rowLetter: string;
  seatNumber: number;
  seatType: SeatType;
  seatLabel: string;
  theater: Theater;
  isActive: boolean;
}

export enum SeatType {
  STANDARD = 'STANDARD',
  VIP = 'VIP',
  COUPLE = 'COUPLE',
  WHEELCHAIR = 'WHEELCHAIR'
}

export interface SeatInfo {
  id: number;
  rowLetter: string;
  seatNumber: number;
  seatType: SeatType;
  seatLabel: string;
  isAvailable: boolean;
  isActive: boolean;
  priceMultiplier: number;
  bookedByCurrentUser: boolean;
}

export interface SeatMapResponse {
  showtimeId: number;
  theaterId: number;
  theaterName: string;
  movieTitle: string;
  showDateTime: string;
  basePrice: number;
  totalSeats: number;
  availableSeats: number;
  seats: SeatInfo[];
}

// ShowtimeDto from backend - matches exactly
export interface ShowtimeDto {
  id: number;
  movieId: number;
  movieTitle: string;
  moviePosterUrl?: string;
  movieDurationMinutes: number;
  theaterId: number;
  theaterName: string;
  theaterCapacity: number;
  showDatetime: string;
  price: number;
  availableSeats: number;
  createdAt: string;
}

// UserDto for nested user in BookingDto
export interface UserDto {
  id: number;
  email: string;
  fullName: string;
}

// BookingDto from backend - matches exactly
export interface BookingDto {
  id: number;
  bookingReference: string | null;
  seatsBooked: number;
  totalAmount: number; // Backend uses totalAmount, not totalPrice
  bookingStatus: string;
  createdAt: string;
  user: UserDto;
  showtime: ShowtimeDto;
}

// SeatBookingDto from backend - matches exactly
export interface SeatBookingDto {
  id: number;
  seatLabel: string; // Backend uses seatLabel, not rowLetter+seatNumber
  seatType: string;
}

// Legacy Booking interface for backward compatibility
export interface Booking {
  id: number;
  user: User;
  showtime: ShowtimeDto;
  seatsBooked: number;
  totalPrice: number; // For backward compatibility
  bookingReference: string | null;
  bookingStatus: BookingStatus;
  createdAt: string;
  seatBookings?: SeatBooking[];
}

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED'
}

export interface SeatBooking {
  id: number;
  seat: Seat;
  booking: Booking;
  price: number;
}

// Backend response from /bookings/with-seats - matches exactly
export interface BookingWithSeatsResponse {
  booking: BookingDto;
  seatBookings: SeatBookingDto[];
}

// Request types
export interface CreateBookingRequest {
  showtimeId: number;
  seatsBooked: number;
}

export interface CreateBookingWithSeatsRequest {
  showtimeId: number;
  seatIds: number[];
}

export interface SeatAvailabilityRequest {
  seatIds: number[];
}

export interface SeatAvailabilityResponse {
  available: boolean;
  totalPrice: number;
  seatCount: number;
}

// Showtime availability
export interface ShowtimeAvailability {
  availableSeats: number;
  totalCapacity: number;
  bookedSeats: number;
  isBookable: boolean;
  occupancyRate?: number;
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
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface RegisterResponse {
  message: string;
  user: User;
}

// Pagination types to match Spring Boot Page response
export interface Pageable {
  pageNumber: number;
  pageSize: number;
  sort: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
  offset: number;
  paged: boolean;
  unpaged: boolean;
}

export interface Sort {
  empty: boolean;
  sorted: boolean;
  unsorted: boolean;
}

export interface PageResponse<T> {
  content: T[];
  pageable: Pageable;
  last: boolean;
  totalElements: number;
  totalPages: number;
  first: boolean;
  size: number;
  number: number;
  sort: Sort;
  numberOfElements: number;
  empty: boolean;
}