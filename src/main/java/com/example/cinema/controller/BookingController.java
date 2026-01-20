package com.example.cinema.controller;

import com.example.cinema.entity.Booking;
import com.example.cinema.entity.User;
import com.example.cinema.service.BookingService;
import com.example.cinema.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

/**
 * Booking Controller - CRUD Operations for Booking Management
 * Provides comprehensive booking management with proper authorization
 * Uses BookingService for business logic separation
 */
@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class BookingController {

    private final BookingService bookingService;
    private final UserService userService;

    /**
     * Get all bookings (Admin only)
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<Booking>> getAllBookings(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("desc")
            ? Sort.by(sortBy).descending()
            : Sort.by(sortBy).ascending();

        Pageable pageable = PageRequest.of(page, size, sort);
        Page<Booking> bookings = bookingService.getAllBookings(pageable);

        return ResponseEntity.ok(bookings);
    }

    /**
     * Get booking by ID (User can see their own, Admin can see all)
     */
    @GetMapping("/{id}")
    public ResponseEntity<Booking> getBookingById(@PathVariable Long id) {
        User currentUser = userService.getCurrentUser();
        Booking booking = bookingService.getBookingByIdOrThrow(id);

        // Users can only see their own bookings, admins can see all
        if (!currentUser.isAdmin() && !booking.getUser().getId().equals(currentUser.getId())) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(booking);
    }

    /**
     * Get booking by reference number
     */
    @GetMapping("/reference/{reference}")
    public ResponseEntity<Booking> getBookingByReference(@PathVariable String reference) {
        User currentUser = userService.getCurrentUser();
        Optional<Booking> bookingOpt = bookingService.getBookingByReference(reference);

        if (bookingOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Booking booking = bookingOpt.get();

        // Users can only see their own bookings, admins can see all
        if (!currentUser.isAdmin() && !booking.getUser().getId().equals(currentUser.getId())) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(booking);
    }

    /**
     * Get user's booking history
     */
    @GetMapping("/my-bookings")
    public ResponseEntity<Page<Booking>> getMyBookings(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        User currentUser = userService.getCurrentUser();
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Booking> bookings = bookingService.getUserBookings(currentUser.getId(), pageable);

        return ResponseEntity.ok(bookings);
    }

    /**
     * Get user's upcoming bookings
     */
    @GetMapping("/my-bookings/upcoming")
    public ResponseEntity<List<Booking>> getMyUpcomingBookings() {
        User currentUser = userService.getCurrentUser();
        List<Booking> bookings = bookingService.getUserUpcomingBookings(currentUser.getId());
        return ResponseEntity.ok(bookings);
    }

    /**
     * Get bookings by status (Admin only)
     */
    @GetMapping("/status/{status}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<Booking>> getBookingsByStatus(
            @PathVariable Booking.BookingStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Booking> bookings = bookingService.getBookingsByStatus(status, pageable);

        return ResponseEntity.ok(bookings);
    }

    /**
     * Create new booking with seat selection
     */
    @PostMapping("/with-seats")
    public ResponseEntity<BookingService.BookingWithSeatsResponse> createBookingWithSeats(
            @Valid @RequestBody CreateBookingWithSeatsRequest request) {
        User currentUser = userService.getCurrentUser();
        BookingService.BookingWithSeatsResponse response = bookingService.createBookingWithSeats(
                currentUser, request.showtimeId(), request.seatIds());
        return ResponseEntity.ok(response);
    }

    /**
     * Create new booking (backward compatibility)
     */
    @PostMapping
    public ResponseEntity<Booking> createBooking(@Valid @RequestBody CreateBookingRequest request) {
        User currentUser = userService.getCurrentUser();
        Booking booking = bookingService.createBooking(currentUser, request.showtimeId(), request.seatsBooked());
        return ResponseEntity.ok(booking);
    }

    /**
     * Cancel booking
     */
    @PutMapping("/{id}/cancel")
    public ResponseEntity<Booking> cancelBooking(@PathVariable Long id) {
        User currentUser = userService.getCurrentUser();
        Booking booking = bookingService.cancelBooking(id, currentUser);
        return ResponseEntity.ok(booking);
    }

    /**
     * Delete booking (Admin only) - for data management purposes
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteBooking(@PathVariable Long id) {
        bookingService.deleteBookingOrThrow(id);
        return ResponseEntity.ok().build();
    }

    /**
     * Get recent bookings (Admin only)
     */
    @GetMapping("/recent")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<Booking>> getRecentBookings(
            @RequestParam(defaultValue = "7") int days,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Booking> bookings = bookingService.getRecentBookings(days, pageable);

        return ResponseEntity.ok(bookings);
    }

    /**
     * Get booking statistics (Admin only)
     */
    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BookingService.BookingStats> getBookingStats(
            @RequestParam(defaultValue = "30") int days) {

        BookingService.BookingStats stats = bookingService.getBookingStats(days);
        return ResponseEntity.ok(stats);
    }

    /**
     * Get daily revenue report (Admin only)
     */
    @GetMapping("/revenue/daily")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<BookingService.DailyRevenue>> getDailyRevenue(
            @RequestParam(defaultValue = "30") int days) {

        List<BookingService.DailyRevenue> dailyRevenue = bookingService.getDailyRevenue(days);
        return ResponseEntity.ok(dailyRevenue);
    }

    /**
     * Create Booking Request DTO
     */
    public record CreateBookingRequest(
        Long showtimeId,
        Integer seatsBooked
    ) {}

    /**
     * Create Booking with Seats Request DTO
     */
    public record CreateBookingWithSeatsRequest(
        Long showtimeId,
        List<Long> seatIds
    ) {}
}