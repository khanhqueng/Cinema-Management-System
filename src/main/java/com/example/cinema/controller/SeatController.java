package com.example.cinema.controller;

import com.example.cinema.entity.Seat;
import com.example.cinema.entity.SeatBooking;
import com.example.cinema.entity.User;
import com.example.cinema.service.SeatService;
import com.example.cinema.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

/**
 * Seat Controller - API endpoints for seat management and booking
 * Provides seat map visualization and seat selection functionality
 */
@RestController
@RequestMapping("/api/seats")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SeatController {

    private final SeatService seatService;
    private final UserService userService;

    /**
     * Get theater seat layout
     */
    @GetMapping("/theater/{theaterId}")
    public ResponseEntity<List<Seat>> getTheaterSeatLayout(@PathVariable Long theaterId) {
        List<Seat> seats = seatService.getTheaterSeatLayout(theaterId);
        return ResponseEntity.ok(seats);
    }

    /**
     * Get seat map for a showtime with availability
     */
    @GetMapping("/showtime/{showtimeId}")
    public ResponseEntity<SeatService.SeatMapResponse> getSeatMapForShowtime(@PathVariable Long showtimeId) {
        User currentUser = userService.getCurrentUser();
        SeatService.SeatMapResponse seatMap = seatService.getSeatMapForShowtime(showtimeId);

        // Mark seats booked by current user
        if (currentUser != null) {
            List<SeatBooking> userSeats = seatService.getUserReservedSeats(currentUser.getId(), showtimeId);
            List<Long> userSeatIds = userSeats.stream()
                    .map(sb -> sb.getSeat().getId())
                    .toList();

            seatMap.seats.forEach(seatInfo -> {
                if (userSeatIds.contains(seatInfo.id)) {
                    seatInfo.bookedByCurrentUser = true;
                }
            });
        }

        return ResponseEntity.ok(seatMap);
    }

    /**
     * Check seat availability for booking
     */
    @PostMapping("/showtime/{showtimeId}/check-availability")
    public ResponseEntity<SeatAvailabilityResponse> checkSeatAvailability(
            @PathVariable Long showtimeId,
            @RequestBody SeatAvailabilityRequest request) {

        boolean available = seatService.areSeatsAvailable(showtimeId, request.seatIds);
        BigDecimal totalPrice = available ? seatService.calculateSeatPrice(showtimeId, request.seatIds) : BigDecimal.ZERO;

        SeatAvailabilityResponse response = new SeatAvailabilityResponse();
        response.available = available;
        response.totalPrice = totalPrice;
        response.seatCount = request.seatIds.size();

        return ResponseEntity.ok(response);
    }

    /**
     * Get user's reserved seats for a showtime
     */
    @GetMapping("/my-seats/showtime/{showtimeId}")
    public ResponseEntity<List<SeatBooking>> getMyReservedSeats(@PathVariable Long showtimeId) {
        User currentUser = userService.getCurrentUser();
        List<SeatBooking> reservedSeats = seatService.getUserReservedSeats(currentUser.getId(), showtimeId);
        return ResponseEntity.ok(reservedSeats);
    }

    /**
     * Initialize seats for a theater (Admin only)
     */
    @PostMapping("/theater/{theaterId}/initialize")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> initializeTheaterSeats(
            @PathVariable Long theaterId,
            @RequestBody InitializeSeatsRequest request) {

        seatService.initializeTheaterSeats(theaterId, request.rows, request.seatsPerRow);
        return ResponseEntity.ok("Theater seats initialized successfully");
    }

    /**
     * Calculate price for selected seats
     */
    @PostMapping("/showtime/{showtimeId}/calculate-price")
    public ResponseEntity<PriceCalculationResponse> calculateSeatPrice(
            @PathVariable Long showtimeId,
            @RequestBody SeatPriceRequest request) {

        BigDecimal totalPrice = seatService.calculateSeatPrice(showtimeId, request.seatIds);

        PriceCalculationResponse response = new PriceCalculationResponse();
        response.totalPrice = totalPrice;
        response.seatCount = request.seatIds.size();
        response.averagePrice = totalPrice.divide(BigDecimal.valueOf(request.seatIds.size()), 2, BigDecimal.ROUND_HALF_UP);

        return ResponseEntity.ok(response);
    }

    // DTOs
    public static class SeatAvailabilityRequest {
        public List<Long> seatIds;
    }

    public static class SeatAvailabilityResponse {
        public boolean available;
        public BigDecimal totalPrice;
        public int seatCount;
    }

    public static class InitializeSeatsRequest {
        public int rows;
        public int seatsPerRow;
    }

    public static class SeatPriceRequest {
        public List<Long> seatIds;
    }

    public static class PriceCalculationResponse {
        public BigDecimal totalPrice;
        public int seatCount;
        public BigDecimal averagePrice;
    }
}