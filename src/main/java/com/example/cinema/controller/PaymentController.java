package com.example.cinema.controller;

import com.example.cinema.dto.SePayCallbackRequest;
import com.example.cinema.dto.SePayCheckoutResponse;
import com.example.cinema.entity.Booking;
import com.example.cinema.entity.Payment;
import com.example.cinema.entity.User;
import com.example.cinema.service.BookingService;
import com.example.cinema.service.SePayService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/payments/sepay")
@RequiredArgsConstructor
@Slf4j
public class PaymentController {

    private final SePayService sePayService;
    private final BookingService bookingService;

    @PostMapping("/checkout")
    public ResponseEntity<?> checkout(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal User currentUser
    ) {
        Long bookingId = Long.valueOf(String.valueOf(body.get("bookingId")));
        String successUrl = (String) body.getOrDefault("successUrl", "");
        String errorUrl = (String) body.getOrDefault("errorUrl", "");
        String cancelUrl = (String) body.getOrDefault("cancelUrl", "");

        // Get booking with user info
        Optional<Booking> bookingOpt = bookingService.getBookingByIdWithUser(bookingId);
        if (bookingOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Booking not found"));
        }
        
        Booking booking = bookingOpt.get();
        
        // BUG FIX 1: Check ownership - only booking owner can checkout
        if (currentUser == null || !booking.getUser().getId().equals(currentUser.getId())) {
            log.warn("Unauthorized checkout attempt for booking {} by user {}", bookingId, currentUser != null ? currentUser.getId() : "anonymous");
            return ResponseEntity.status(403).body(Map.of("error", "You can only checkout your own bookings"));
        }
        
        // BUG FIX 2: Check booking status - only PENDING bookings can be paid
        if (booking.getBookingStatus() != Booking.BookingStatus.PENDING) {
            log.warn("Attempt to checkout non-pending booking: {} with status {}", bookingId, booking.getBookingStatus());
            return ResponseEntity.badRequest().body(Map.of("error", "This booking cannot be paid. Status: " + booking.getBookingStatus()));
        }

        // BUG FIX 3: Check if payment already exists and is SUCCESS
        Payment existingPayment = sePayService.getPaymentByBookingId(bookingId);
        if (existingPayment != null && existingPayment.getPaymentStatus() == Payment.PaymentStatus.SUCCESS) {
            log.warn("Attempt to checkout already paid booking: {}", bookingId);
            return ResponseEntity.badRequest().body(Map.of("error", "This booking has already been paid"));
        }

        SePayCheckoutResponse resp = sePayService.initializeCheckout(booking, successUrl, errorUrl, cancelUrl);
        return ResponseEntity.ok(resp);
    }

    @PostMapping("/webhook")
    public ResponseEntity<String> webhook(
            @RequestBody String rawBody,
            @RequestHeader(value = "X-SePay-Signature", required = false) String signatureHeader,
            @RequestHeader(value = "X-SePay-Timestamp", required = false) String timestampHeader
    ) {
        log.info("Received SePay webhook rawBody: {}", rawBody);
        try {
            // Parse body into map - support nested JSON
            com.fasterxml.jackson.databind.ObjectMapper om = new com.fasterxml.jackson.databind.ObjectMapper();
            com.fasterxml.jackson.databind.JsonNode rootNode = om.readTree(rawBody);
            
            java.util.Map<String, String> payload = new java.util.HashMap<>();
            
            // Flatten nested JSON to flat map for processing
            flattenJson(rootNode, "", payload);
            
            log.info("Flattened webhook payload: {}", payload);
            SePayService.WebhookResult result = sePayService.handleWebhookCallback(
                    payload,
                    rawBody,
                    signatureHeader,
                    timestampHeader
            );

            return switch (result) {
                case OK -> ResponseEntity.ok("ok");
                case UNAUTHORIZED -> ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("unauthorized");
                case INVALID_PAYLOAD -> ResponseEntity.badRequest().body("invalid payload");
                case NOT_FOUND -> ResponseEntity.status(HttpStatus.NOT_FOUND).body("payment not found");
                case ERROR -> ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("error");
            };
        } catch (Exception e) {
            log.error("Failed to parse SePay webhook payload", e);
            return ResponseEntity.badRequest().body("invalid payload");
        }
    }
    
    private void flattenJson(com.fasterxml.jackson.databind.JsonNode node, String prefix, java.util.Map<String, String> map) {
        if (node.isObject()) {
            node.fields().forEachRemaining(entry -> {
                String key = prefix.isEmpty() ? entry.getKey() : prefix + "." + entry.getKey();
                if (entry.getValue().isObject() || entry.getValue().isArray()) {
                    flattenJson(entry.getValue(), key, map);
                } else {
                    map.put(key, entry.getValue().asText());
                }
            });
        }
    }

    @GetMapping("/status")
    public ResponseEntity<?> getStatusByBooking(@RequestParam("bookingId") Long bookingId) {
        Payment payment = sePayService.getPaymentByBookingId(bookingId);
        if (payment == null) return ResponseEntity.notFound().build();

        Map<String, Object> response = new java.util.LinkedHashMap<>();
        response.put("paymentId", payment.getId());
        response.put("status", payment.getPaymentStatus());
        response.put("transactionId", payment.getTransactionId());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{paymentId}")
    public ResponseEntity<?> getPaymentById(@PathVariable("paymentId") Long paymentId) {
        Payment payment = sePayService.getPaymentById(paymentId);
        if (payment == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(payment);
    }
}
