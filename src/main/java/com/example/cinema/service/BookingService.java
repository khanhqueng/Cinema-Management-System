package com.example.cinema.service;

import com.example.cinema.entity.Booking;
import com.example.cinema.entity.Showtime;
import com.example.cinema.entity.User;
import com.example.cinema.entity.SeatBooking;
import com.example.cinema.dto.BookingDto;
import com.example.cinema.dto.SeatBookingDto;
import com.example.cinema.dto.SeatLockResponse;
import com.example.cinema.exception.BusinessRuleViolationException;
import com.example.cinema.exception.ResourceNotFoundException;
import com.example.cinema.exception.SeatLockException;
import com.example.cinema.exception.UnauthorizedException;
import com.example.cinema.exception.ValidationException;
import com.example.cinema.repository.BookingRepository;
import com.example.cinema.repository.ShowtimeRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Booking Service - Business Logic for Booking Management
 * Handles all booking-related business operations with transaction management
 */
@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final ShowtimeRepository showtimeRepository;
    private final SeatService seatService;
    private final DistributedLockService distributedLockService;

    /**
     * Get all bookings with pagination (Admin only)
     */
    public Page<Booking> getAllBookings(Pageable pageable) {
        return bookingRepository.findAll(pageable);
    }

    /**
     * Get booking by ID
     */
    public Optional<Booking> getBookingById(Long id) {
        return bookingRepository.findById(id);
    }

    /**
     * Get booking by ID or throw exception
     */
    public Booking getBookingByIdOrThrow(Long id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking", "id", id));
    }

    /**
     * Get booking by reference number
     */
    public Optional<Booking> getBookingByReference(String reference) {
        return bookingRepository.findByBookingReference(reference);
    }

    /**
     * Get user's booking history
     */
    public Page<Booking> getUserBookings(Long userId, Pageable pageable) {
        return bookingRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
    }

    /**
     * Get user's upcoming bookings
     */
    public List<Booking> getUserUpcomingBookings(Long userId) {
        return bookingRepository.findUserUpcomingBookings(userId, LocalDateTime.now());
    }

    /**
     * Get bookings by status
     */
    public Page<Booking> getBookingsByStatus(Booking.BookingStatus status, Pageable pageable) {
        return bookingRepository.findByBookingStatus(status, pageable);
    }

    /**
     * Get recent bookings
     */
    public Page<Booking> getRecentBookings(int days, Pageable pageable) {
        LocalDateTime fromDate = LocalDateTime.now().minusDays(days);
        return bookingRepository.findRecentBookings(fromDate, pageable);
    }

    /**
     * Create new booking with specific seat selection using distributed locking
     */
    @Transactional
    public BookingWithSeatsResponse createBookingWithSeats(User user, Long showtimeId, List<Long> seatIds) {
        // Validate input
        if (seatIds == null || seatIds.isEmpty()) {
            throw new ValidationException("Seat selection cannot be empty");
        }

        // Execute booking with distributed lock to prevent race conditions
        return distributedLockService.executeBookingWithLock(user.getId(), showtimeId, () -> {
            // Check if showtime exists
            Showtime showtime = showtimeRepository.findById(showtimeId)
                    .orElseThrow(() -> new ResourceNotFoundException("Showtime", "id", showtimeId));

            // Check if showtime is bookable
            if (!showtime.isUpcoming()) {
                throw new BusinessRuleViolationException("Cannot book past or ongoing showtimes");
            }

            // Re-check seat availability within the lock to prevent race conditions
            if (!seatService.areSeatsAvailable(showtimeId, seatIds)) {
                throw new BusinessRuleViolationException("One or more selected seats are no longer available");
            }

            // Check if user already has a booking for this showtime
            if (bookingRepository.existsByUserIdAndShowtimeIdAndBookingStatus(
                    user.getId(), showtime.getId(), Booking.BookingStatus.CONFIRMED)) {
                throw new BusinessRuleViolationException("You already have a confirmed booking for this showtime");
            }

            // Calculate total amount based on seat types
            BigDecimal totalAmount = seatService.calculateSeatPrice(showtimeId, seatIds);

            // Create booking
            Booking booking = Booking.builder()
                    .user(user)
                    .showtime(showtime)
                    .seatsBooked(seatIds.size())
                    .totalAmount(totalAmount)
                    .bookingStatus(Booking.BookingStatus.CONFIRMED)
                    .build();

            // Save booking first
            booking = bookingRepository.save(booking);

            // Reserve specific seats
            List<SeatBooking> seatBookings = seatService.reserveSeats(booking, seatIds);

            // Update showtime available seats
            int updatedRows = showtimeRepository.bookSeats(showtime.getId(), seatIds.size());
            if (updatedRows == 0) {
                throw new BusinessRuleViolationException("Failed to update showtime seat count");
            }

            // Convert entities to DTOs to avoid Hibernate proxy serialization issues
            BookingDto bookingDto = BookingDto.fromEntity(booking);
            List<SeatBookingDto> seatBookingDtos = seatBookings.stream()
                    .map(SeatBookingDto::fromEntity)
                    .collect(Collectors.toList());

            return new BookingWithSeatsResponse(bookingDto, seatBookingDtos);
        });
    }

    /**
     * Create new booking with business validation (backward compatibility)
     */
    @Transactional
    public Booking createBooking(User user, Long showtimeId, Integer seatsBooked) {
        // Validate input
        if (seatsBooked == null || seatsBooked <= 0) {
            throw new ValidationException("Number of seats must be positive");
        }

        // Check if showtime exists
        Showtime showtime = showtimeRepository.findById(showtimeId)
                .orElseThrow(() -> new ResourceNotFoundException("Showtime", "id", showtimeId));

        // Check if showtime is bookable
        if (!showtime.canBook(seatsBooked)) {
            throw new BusinessRuleViolationException("Insufficient seats available or showtime not bookable");
        }

        // Check if user already has a booking for this showtime
        if (bookingRepository.existsByUserIdAndShowtimeIdAndBookingStatus(
                user.getId(), showtime.getId(), Booking.BookingStatus.CONFIRMED)) {
            throw new BusinessRuleViolationException("You already have a confirmed booking for this showtime");
        }

        // Calculate total amount
        BigDecimal totalAmount = showtime.getPrice().multiply(BigDecimal.valueOf(seatsBooked));

        // Create booking
        Booking booking = Booking.builder()
                .user(user)
                .showtime(showtime)
                .seatsBooked(seatsBooked)
                .totalAmount(totalAmount)
                .bookingStatus(Booking.BookingStatus.CONFIRMED)
                .build();

        // Update showtime available seats atomically
        int updatedRows = showtimeRepository.bookSeats(showtime.getId(), seatsBooked);
        if (updatedRows == 0) {
            throw new BusinessRuleViolationException("Failed to book seats - insufficient availability");
        }

        return bookingRepository.save(booking);
    }

    /**
     * Cancel booking with business validation
     */
    @Transactional
    public Booking cancelBooking(Long bookingId, User requestingUser) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking", "id", bookingId));

        // Authorization check: users can only cancel their own bookings
        if (!requestingUser.isAdmin() && !booking.getUser().getId().equals(requestingUser.getId())) {
            throw new UnauthorizedException("Not authorized to cancel this booking");
        }

        // Business rule check: can booking be cancelled?
        if (!booking.canBeCancelled()) {
            throw new BusinessRuleViolationException("Booking cannot be cancelled - either already cancelled or showtime has passed");
        }

        // Cancel booking
        booking.cancel();

        // Release seats back to showtime
        showtimeRepository.releaseSeats(booking.getShowtime().getId(), booking.getSeatsBooked());

        return bookingRepository.save(booking);
    }

    /**
     * Delete booking (Admin only) - for data management purposes
     */
    @Transactional
    public boolean deleteBooking(Long id) {
        return bookingRepository.findById(id)
                .map(booking -> {
                    // If booking is confirmed, release seats
                    if (booking.isConfirmed()) {
                        showtimeRepository.releaseSeats(booking.getShowtime().getId(), booking.getSeatsBooked());
                    }

                    bookingRepository.delete(booking);
                    return true;
                })
                .orElse(false);
    }

    /**
     * Delete booking or throw exception (Admin only)
     */
    @Transactional
    public void deleteBookingOrThrow(Long id) {
        Booking booking = getBookingByIdOrThrow(id);

        // If booking is confirmed, release seats
        if (booking.isConfirmed()) {
            showtimeRepository.releaseSeats(booking.getShowtime().getId(), booking.getSeatsBooked());
        }

        bookingRepository.delete(booking);
    }

    /**
     * Get booking statistics
     */
    public BookingStats getBookingStats(int days) {
        LocalDateTime fromDate = LocalDateTime.now().minusDays(days);
        LocalDateTime toDate = LocalDateTime.now();

        long totalBookings = bookingRepository.count();
        long confirmedBookings = bookingRepository.countByStatus(Booking.BookingStatus.CONFIRMED);
        long cancelledBookings = bookingRepository.countByStatus(Booking.BookingStatus.CANCELLED);

        Optional<BigDecimal> revenue = bookingRepository.calculateRevenue(fromDate, toDate);
        Optional<Long> seatsBooked = bookingRepository.getTotalSeatsBooked(fromDate);

        return new BookingStats(
            totalBookings,
            confirmedBookings,
            cancelledBookings,
            revenue.orElse(BigDecimal.ZERO),
            seatsBooked.orElse(0L),
            days
        );
    }

    /**
     * Get daily revenue report
     */
    public List<DailyRevenue> getDailyRevenue(int days) {
        LocalDateTime startDate = LocalDateTime.now().minusDays(days);
        LocalDateTime endDate = LocalDateTime.now();

        List<Object[]> results = bookingRepository.getDailyRevenue(startDate, endDate);
        return results.stream()
                .map(row -> new DailyRevenue(
                    row[0].toString(), // date
                    (BigDecimal) row[1] // revenue
                ))
                .toList();
    }

    /**
     * Check if user owns booking
     */
    public boolean userOwnsBooking(Long bookingId, Long userId) {
        return bookingRepository.findById(bookingId)
                .map(booking -> booking.getUser().getId().equals(userId))
                .orElse(false);
    }

    /**
     * Reserve seats temporarily for user selection (prevents race conditions)
     * This creates temporary locks that expire automatically
     * @throws SeatLockException if seats cannot be reserved (HTTP 409)
     */
    public SeatLockResponse reserveSeatsForSelection(User user, Long showtimeId, List<Long> seatIds) {
        // Validate input
        if (seatIds == null || seatIds.isEmpty()) {
            throw new ValidationException("Seat selection cannot be empty");
        }

        // Check if showtime exists and is bookable
        Showtime showtime = showtimeRepository.findById(showtimeId)
                .orElseThrow(() -> new ResourceNotFoundException("Showtime", "id", showtimeId));

        if (!showtime.isUpcoming()) {
            throw new BusinessRuleViolationException("Cannot reserve seats for past or ongoing showtimes");
        }

        // Check if seats are still available
        if (!seatService.areSeatsAvailable(showtimeId, seatIds)) {
            throw new BusinessRuleViolationException("One or more selected seats are no longer available");
        }

        // Try to acquire locks for all seats atomically (all-or-nothing)
        List<Long> lockedSeats = new ArrayList<>();

        // Try to acquire all locks - if any fails, we fail immediately
        for (Long seatId : seatIds) {
            boolean acquired = distributedLockService.tryAcquireSeatLock(
                    showtimeId, seatId, user.getId(), 300); // 0 wait = fail immediately if locked

            if (acquired) {
                lockedSeats.add(seatId);
            } else {
                // Immediately fail - cleanup any locks we already acquired
                lockedSeats.forEach(lockedSeatId ->
                    distributedLockService.releaseSeatLock(showtimeId, lockedSeatId, user.getId()));

                throw new SeatLockException("Seat " + seatId + " is already locked by another user. Please select different seats.");
            }
        }

        // All seats successfully locked
        return new SeatLockResponse(true, lockedSeats, List.of(),
            "All seats successfully reserved for 5 minutes");
    }

    /**
     * Release seat reservations when user deselects seats or leaves the page
     */
    public void releaseSeatsReservation(User user, Long showtimeId, List<Long> seatIds) {
        if (seatIds == null || seatIds.isEmpty()) {
            return;
        }

        seatIds.forEach(seatId ->
            distributedLockService.releaseSeatLock(showtimeId, seatId, user.getId()));
    }

    /**
     * Check which seats are currently locked (for frontend to display)
     */
    public List<Long> getLockedSeats(Long showtimeId, List<Long> seatIds) {
        if (seatIds == null || seatIds.isEmpty()) {
            return List.of();
        }

        return seatIds.stream()
                .filter(seatId -> distributedLockService.isSeatLocked(showtimeId, seatId))
                .collect(Collectors.toList());
    }


    /**
     * Daily Revenue DTO
     */
    public record DailyRevenue(
        String date,
        BigDecimal revenue
    ) {}

    /**
     * Booking Statistics DTO
     */
    public record BookingStats(
        long totalBookings,
        long confirmedBookings,
        long cancelledBookings,
        BigDecimal totalRevenue,
        long totalSeatsBooked,
        int periodDays
    ) {}

    /**
     * Booking with Seats Response DTO
     */
    public record BookingWithSeatsResponse(
        BookingDto booking,
        List<SeatBookingDto> seatBookings
    ) {
        public List<String> getSeatLabels() {
            return seatBookings.stream()
                    .map(SeatBookingDto::getSeatLabel)
                    .sorted()
                    .collect(Collectors.toList());
        }

        public int getTotalSeats() {
            return seatBookings.size();
        }
    }
}