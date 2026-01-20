package com.example.cinema.service;

import com.example.cinema.entity.*;
import com.example.cinema.exception.BusinessRuleViolationException;
import com.example.cinema.exception.ResourceNotFoundException;
import com.example.cinema.exception.ValidationException;
import com.example.cinema.repository.SeatRepository;
import com.example.cinema.repository.SeatBookingRepository;
import com.example.cinema.repository.TheaterRepository;
import com.example.cinema.repository.ShowtimeRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Seat Service - Business Logic for Seat Management
 * Handles seat layout, availability, and booking operations
 */
@Service
@RequiredArgsConstructor
public class SeatService {

    private final SeatRepository seatRepository;
    private final SeatBookingRepository seatBookingRepository;
    private final TheaterRepository theaterRepository;
    private final ShowtimeRepository showtimeRepository;

    /**
     * Get seat layout for a theater
     */
    public List<Seat> getTheaterSeatLayout(Long theaterId) {
        Theater theater = theaterRepository.findById(theaterId)
                .orElseThrow(() -> new ResourceNotFoundException("Theater", "id", theaterId));

        return seatRepository.findActiveSeatsForTheater(theaterId);
    }

    /**
     * Get seat map for a showtime with availability status
     */
    public SeatMapResponse getSeatMapForShowtime(Long showtimeId) {
        Showtime showtime = showtimeRepository.findById(showtimeId)
                .orElseThrow(() -> new ResourceNotFoundException("Showtime", "id", showtimeId));

        List<Seat> allSeats = seatRepository.findActiveSeatsForTheater(showtime.getTheater().getId());
        List<SeatBooking> bookedSeats = seatBookingRepository.findReservedSeatsForShowtime(showtimeId);

        Map<Long, SeatBooking> bookedSeatMap = bookedSeats.stream()
                .collect(Collectors.toMap(sb -> sb.getSeat().getId(), sb -> sb));

        List<SeatInfo> seatInfos = allSeats.stream()
                .map(seat -> {
                    SeatBooking booking = bookedSeatMap.get(seat.getId());
                    return SeatInfo.builder()
                            .id(seat.getId())
                            .rowLetter(seat.getRowLetter())
                            .seatNumber(seat.getSeatNumber())
                            .seatType(seat.getSeatType())
                            .seatLabel(seat.getSeatLabel())
                            .isAvailable(booking == null)
                            .isActive(seat.getIsActive())
                            .priceMultiplier(seat.getSeatType().getPriceMultiplier())
                            .bookedByCurrentUser(false) // Will be updated by controller
                            .build();
                })
                .collect(Collectors.toList());

        return SeatMapResponse.builder()
                .showtimeId(showtimeId)
                .theaterId(showtime.getTheater().getId())
                .theaterName(showtime.getTheater().getName())
                .movieTitle(showtime.getMovie().getTitle())
                .showDateTime(showtime.getShowDatetime())
                .basePrice(showtime.getPrice())
                .totalSeats(allSeats.size())
                .availableSeats(seatInfos.stream().mapToInt(s -> s.isAvailable() ? 1 : 0).sum())
                .seats(seatInfos)
                .build();
    }

    /**
     * Check if specific seats are available for booking
     */
    public boolean areSeatsAvailable(Long showtimeId, List<Long> seatIds) {
        if (seatIds == null || seatIds.isEmpty()) {
            return false;
        }

        List<SeatBooking> existingBookings = seatBookingRepository.findReservedSeatsForShowtime(showtimeId);
        List<Long> bookedSeatIds = existingBookings.stream()
                .map(sb -> sb.getSeat().getId())
                .collect(Collectors.toList());

        return seatIds.stream().noneMatch(bookedSeatIds::contains);
    }

    /**
     * Reserve seats for a booking
     */
    @Transactional
    public List<SeatBooking> reserveSeats(Booking booking, List<Long> seatIds) {
        if (seatIds == null || seatIds.isEmpty()) {
            throw new ValidationException("Seat IDs cannot be empty");
        }

        // Validate showtime
        Showtime showtime = booking.getShowtime();
        if (!showtime.isBookable()) {
            throw new BusinessRuleViolationException("Showtime is not bookable");
        }

        // Check seat availability
        if (!areSeatsAvailable(showtime.getId(), seatIds)) {
            throw new BusinessRuleViolationException("One or more selected seats are no longer available");
        }

        // Get seats and validate they belong to the correct theater
        List<Seat> seats = seatRepository.findAllById(seatIds);
        if (seats.size() != seatIds.size()) {
            throw new ValidationException("One or more seat IDs are invalid");
        }

        // Validate all seats belong to the showtime's theater
        boolean allSeatsInCorrectTheater = seats.stream()
                .allMatch(seat -> seat.getTheater().getId().equals(showtime.getTheater().getId()));

        if (!allSeatsInCorrectTheater) {
            throw new ValidationException("All seats must belong to the same theater as the showtime");
        }

        // Create seat bookings
        return seats.stream()
                .map(seat -> {
                    SeatBooking seatBooking = SeatBooking.builder()
                            .seat(seat)
                            .showtime(showtime)
                            .booking(booking)
                            .status(SeatBooking.SeatBookingStatus.RESERVED)
                            .build();
                    return seatBookingRepository.save(seatBooking);
                })
                .collect(Collectors.toList());
    }

    /**
     * Cancel seat reservations for a booking
     */
    @Transactional
    public void cancelSeatReservations(Long bookingId) {
        List<SeatBooking> seatBookings = seatBookingRepository.findByBooking(
                Booking.builder().id(bookingId).build());

        seatBookings.forEach(seatBooking -> {
            seatBooking.cancel();
            seatBookingRepository.save(seatBooking);
        });
    }

    /**
     * Get user's reserved seats for a showtime
     */
    public List<SeatBooking> getUserReservedSeats(Long userId, Long showtimeId) {
        return seatBookingRepository.findUserSeatsForShowtime(userId, showtimeId);
    }

    /**
     * Calculate total price for selected seats
     */
    public BigDecimal calculateSeatPrice(Long showtimeId, List<Long> seatIds) {
        Showtime showtime = showtimeRepository.findById(showtimeId)
                .orElseThrow(() -> new ResourceNotFoundException("Showtime", "id", showtimeId));

        List<Seat> seats = seatRepository.findAllById(seatIds);
        BigDecimal basePrice = showtime.getPrice();

        return seats.stream()
                .map(seat -> basePrice.multiply(BigDecimal.valueOf(seat.getSeatType().getPriceMultiplier())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    /**
     * Initialize seats for a theater (utility method for setup)
     */
    @Transactional
    public void initializeTheaterSeats(Long theaterId, int rows, int seatsPerRow) {
        Theater theater = theaterRepository.findById(theaterId)
                .orElseThrow(() -> new ResourceNotFoundException("Theater", "id", theaterId));

        // Clear existing seats
        List<Seat> existingSeats = seatRepository.findByTheaterOrderByRowLetterAscSeatNumberAsc(theater);
        if (!existingSeats.isEmpty()) {
            seatRepository.deleteAll(existingSeats);
        }

        // Create new seats
        for (int row = 0; row < rows; row++) {
            String rowLetter = String.valueOf((char) ('A' + row));

            for (int seatNum = 1; seatNum <= seatsPerRow; seatNum++) {
                Seat.SeatType seatType = determineSeatType(row, seatNum, rows, seatsPerRow);

                Seat seat = Seat.builder()
                        .theater(theater)
                        .rowLetter(rowLetter)
                        .seatNumber(seatNum)
                        .seatType(seatType)
                        .isActive(true)
                        .build();

                seatRepository.save(seat);
            }
        }
    }

    /**
     * Determine seat type based on position (VIP in front rows, couple seats, etc.)
     */
    private Seat.SeatType determineSeatType(int row, int seatNum, int totalRows, int seatsPerRow) {
        // First 2 rows are VIP
        if (row < 2) {
            return Seat.SeatType.VIP;
        }

        // Last row couple seats (even numbered seats)
        if (row == totalRows - 1 && seatNum % 2 == 0 && seatNum <= seatsPerRow - 1) {
            return Seat.SeatType.COUPLE;
        }

        // Wheelchair accessible seats (aisle seats in middle rows)
        if (row >= totalRows / 2 && (seatNum == 1 || seatNum == seatsPerRow)) {
            return Seat.SeatType.WHEELCHAIR;
        }

        return Seat.SeatType.STANDARD;
    }

    // DTOs
    public static class SeatMapResponse {
        public Long showtimeId;
        public Long theaterId;
        public String theaterName;
        public String movieTitle;
        public java.time.LocalDateTime showDateTime;
        public BigDecimal basePrice;
        public int totalSeats;
        public int availableSeats;
        public List<SeatInfo> seats;

        public static SeatMapResponseBuilder builder() {
            return new SeatMapResponseBuilder();
        }

        public static class SeatMapResponseBuilder {
            private SeatMapResponse response = new SeatMapResponse();

            public SeatMapResponseBuilder showtimeId(Long showtimeId) {
                response.showtimeId = showtimeId;
                return this;
            }

            public SeatMapResponseBuilder theaterId(Long theaterId) {
                response.theaterId = theaterId;
                return this;
            }

            public SeatMapResponseBuilder theaterName(String theaterName) {
                response.theaterName = theaterName;
                return this;
            }

            public SeatMapResponseBuilder movieTitle(String movieTitle) {
                response.movieTitle = movieTitle;
                return this;
            }

            public SeatMapResponseBuilder showDateTime(java.time.LocalDateTime showDateTime) {
                response.showDateTime = showDateTime;
                return this;
            }

            public SeatMapResponseBuilder basePrice(BigDecimal basePrice) {
                response.basePrice = basePrice;
                return this;
            }

            public SeatMapResponseBuilder totalSeats(int totalSeats) {
                response.totalSeats = totalSeats;
                return this;
            }

            public SeatMapResponseBuilder availableSeats(int availableSeats) {
                response.availableSeats = availableSeats;
                return this;
            }

            public SeatMapResponseBuilder seats(List<SeatInfo> seats) {
                response.seats = seats;
                return this;
            }

            public SeatMapResponse build() {
                return response;
            }
        }
    }

    public static class SeatInfo {
        public Long id;
        public String rowLetter;
        public Integer seatNumber;
        public Seat.SeatType seatType;
        public String seatLabel;
        public boolean isAvailable;
        public boolean isActive;
        public Double priceMultiplier;
        public boolean bookedByCurrentUser;

        public static SeatInfoBuilder builder() {
            return new SeatInfoBuilder();
        }

        public boolean isAvailable() { return isAvailable; }

        public static class SeatInfoBuilder {
            private SeatInfo info = new SeatInfo();

            public SeatInfoBuilder id(Long id) {
                info.id = id;
                return this;
            }

            public SeatInfoBuilder rowLetter(String rowLetter) {
                info.rowLetter = rowLetter;
                return this;
            }

            public SeatInfoBuilder seatNumber(Integer seatNumber) {
                info.seatNumber = seatNumber;
                return this;
            }

            public SeatInfoBuilder seatType(Seat.SeatType seatType) {
                info.seatType = seatType;
                return this;
            }

            public SeatInfoBuilder seatLabel(String seatLabel) {
                info.seatLabel = seatLabel;
                return this;
            }

            public SeatInfoBuilder isAvailable(boolean isAvailable) {
                info.isAvailable = isAvailable;
                return this;
            }

            public SeatInfoBuilder isActive(boolean isActive) {
                info.isActive = isActive;
                return this;
            }

            public SeatInfoBuilder priceMultiplier(Double priceMultiplier) {
                info.priceMultiplier = priceMultiplier;
                return this;
            }

            public SeatInfoBuilder bookedByCurrentUser(boolean bookedByCurrentUser) {
                info.bookedByCurrentUser = bookedByCurrentUser;
                return this;
            }

            public SeatInfo build() {
                return info;
            }
        }
    }
}