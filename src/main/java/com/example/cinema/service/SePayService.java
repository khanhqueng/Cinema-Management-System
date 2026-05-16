package com.example.cinema.service;

import com.example.cinema.config.SePayConfig;
import com.example.cinema.dto.SePayCheckoutResponse;
import com.example.cinema.entity.Booking;
import com.example.cinema.entity.Payment;
import com.example.cinema.repository.BookingRepository;
import com.example.cinema.repository.PaymentRepository;
import com.example.cinema.repository.SeatBookingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * SePay Service - Handles SePay payment gateway integration
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SePayService {

    public enum WebhookResult {
        OK,
        UNAUTHORIZED,
        INVALID_PAYLOAD,
        NOT_FOUND,
        ERROR
    }

    private final SePayConfig sePayConfig;
    private final PaymentRepository paymentRepository;
    private final BookingRepository bookingRepository;
    private final DistributedLockService distributedLockService;
    private final SeatBookingRepository seatBookingRepository;
    private final BookingService bookingService;
    private static final DateTimeFormatter SEPAY_TRANSACTION_DATE_FORMAT =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    /**
     * Generate one-time payment form fields for SePay checkout
     */
    @Transactional
    public SePayCheckoutResponse initializeCheckout(
            Booking booking,
            String successUrl,
            String errorUrl,
            String cancelUrl) {

        log.info("Initializing SePay checkout for booking {}", booking.getId());

        // Check if there's an existing PENDING payment - allow retry
        // Otherwise create new payment
        Payment payment = paymentRepository.findByBookingId(booking.getId())
                .filter(p -> p.getPaymentStatus() == Payment.PaymentStatus.PENDING)
                .orElseGet(() -> {
                    log.debug("Creating new payment for booking {}", booking.getId());
                    return Payment.builder()
                            .booking(booking)
                            .amount(booking.getTotalAmount())
                            .paymentStatus(Payment.PaymentStatus.PENDING)
                            .build();
                });

        // Reset payment for new checkout attempt
        payment.setPaymentStatus(Payment.PaymentStatus.PENDING);
        payment.setPaymentMethod("BANK_TRANSFER");
        payment.setTransactionId(null);
        payment.setFailureReason(null);
        payment.setExpiresAt(LocalDateTime.now().plusMinutes(sePayConfig.getPaymentTimeoutMinutes()));
        payment = paymentRepository.save(payment);

        // Generate form fields for SePay checkout
        Map<String, String> formFields = generateCheckoutFormFields(
                booking,
                payment,
                successUrl,
                errorUrl,
                cancelUrl
        );

        log.debug("Generated SePay form fields for booking {}: {}", booking.getId(), formFields.keySet());

        return SePayCheckoutResponse.builder()
                .paymentId(payment.getId())
                .bookingId(booking.getId())
                .amount(payment.getAmount())
                .formFields(formFields)
                .checkoutUrl(sePayConfig.getCheckoutUrl())
                .build();
    }

    /**
     * Generate form fields compatible with SePay one-time payment
     */
    private Map<String, String> generateCheckoutFormFields(
            Booking booking,
            Payment payment,
            String successUrl,
            String errorUrl,
            String cancelUrl) {

        Map<String, String> fields = new LinkedHashMap<>();

        // Required fields
        fields.put("merchant_id", sePayConfig.getMerchantId());
        fields.put("order_invoice_number", generateInvoiceNumber(booking));
        fields.put("order_amount", booking.getTotalAmount().toPlainString());
        fields.put("currency", "VND");

        // Description
        String description = String.format(
                "Cinema Booking #%d - %s (%d seats)",
                booking.getId(),
                booking.getShowtime().getMovieTitle(),
                booking.getSeatsBooked()
        );
        fields.put("order_description", description);

        // URLs
        fields.put("success_url", successUrl);
        fields.put("error_url", errorUrl);
        fields.put("cancel_url", cancelUrl);

        // Payment method
        fields.put("payment_method", "BANK_TRANSFER");

        // Optional fields for better UX
        fields.put("buyer_name", booking.getUser().getFullName());
        fields.put("buyer_email", booking.getUser().getEmail());

        // Generate signature
        String signature = generateSignature(fields);
        fields.put("signature", signature);

        return fields;
    }


    private String generateInvoiceNumber(Booking booking) {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        return "INV-" + timestamp + "-" + booking.getId();
    }

    private String generateSignature(Map<String, String> fields) {
        if (sePayConfig.getSecretKey() == null || sePayConfig.getSecretKey().isEmpty()) {
            log.warn("SePay secret key is not configured, skipping signature generation");
            return "";
        }

        try {
            StringBuilder dataToSign = new StringBuilder();
            for (Map.Entry<String, String> entry : fields.entrySet()) {
                if (entry.getValue() != null && !entry.getValue().isEmpty()) {
                    if (dataToSign.length() > 0) {
                        dataToSign.append("&");
                    }
                    dataToSign.append(entry.getKey()).append("=").append(entry.getValue());
                }
            }

            javax.crypto.Mac mac = javax.crypto.Mac.getInstance("HmacSHA256");
            javax.crypto.spec.SecretKeySpec keySpec = new javax.crypto.spec.SecretKeySpec(
                    sePayConfig.getSecretKey().getBytes(java.nio.charset.StandardCharsets.UTF_8),
                    "HmacSHA256"
            );
            mac.init(keySpec);
            byte[] digest = mac.doFinal(dataToSign.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8));

            return bytesToHex(digest);
        } catch (Exception e) {
            log.error("Error generating signature", e);
            return "";
        }
    }

    /**
     * Get payment by ID
     */
    public Payment getPaymentById(Long id) {
        return paymentRepository.findById(id)
                .orElse(null);
    }

    /**
     * Get payment by booking ID
     */
    public Payment getPaymentByBookingId(Long bookingId) {
        return paymentRepository.findByBookingId(bookingId)
                .orElse(null);
    }

    /**
     * Handle SePay webhook callback
     * Webhook payload format:
     * {
     *   "order_invoice_number": "1",
     *   "order_amount": "10000",
     *   "currency": "VND",
     *   "order_description": "...",
     *   "transaction_date": "2024-01-15 10:30:00",
     *   "transaction_id": "123456789",
     *   "status": "success|fail|cancel",
     *   "refund_amount": "0",
     *   "refund_status": "success|pending|fail",
     *   "method": "BANK_TRANSFER|NAPAS|CARD",
     *   "bank_account": "0101234567"
     * }
     */
    @Transactional
    public WebhookResult handleWebhookCallback(
            Map<String, String> webhookData,
            String rawBody,
            String signatureHeader,
            String timestampHeader) {
        log.info("Processing SePay webhook callback: {}", webhookData);

        if (!verifyWebhookSignature(rawBody, signatureHeader, timestampHeader)) {
            return WebhookResult.UNAUTHORIZED;
        }

        try {
            // Support both legacy flat payloads and SePay nested webhook payloads.
            String orderInvoiceNumber = firstPresent(
                    webhookData,
                    "order_invoice_number",
                    "order.order_invoice_number",
                    "order.invoice_number"
            );
            String status = firstPresent(
                    webhookData,
                    "status",
                    "transaction.transaction_status",
                    "order.order_status"
            );
            String transactionId = firstPresent(
                    webhookData,
                    "transaction_id",
                    "transaction.transaction_id",
                    "transaction.id"
            );
            String method = firstPresent(
                    webhookData,
                    "method",
                    "transaction.payment_method"
            );

            if (orderInvoiceNumber == null || status == null) {
                log.warn("Invalid webhook payload: missing required fields. Data: {}", webhookData);
                return WebhookResult.INVALID_PAYLOAD;
            }

            // Extract booking ID from invoice number (format: INV-20260510-XXXXX)
            Long bookingId;
            try {
                if (orderInvoiceNumber.contains("INV-")) {
                    // Format: INV-20260510-XXXXX - extract last part
                    String[] parts = orderInvoiceNumber.split("-");
                    bookingId = Long.parseLong(parts[parts.length - 1]);
                } else {
                    bookingId = Long.parseLong(orderInvoiceNumber);
                }
            } catch (NumberFormatException e) {
                log.warn("Cannot parse booking ID from invoice number: {}", orderInvoiceNumber);
                return WebhookResult.INVALID_PAYLOAD;
            }

            Payment payment = getPaymentByBookingId(bookingId);

            if (payment == null) {
                log.warn("Payment not found for booking ID: {}", bookingId);
                return WebhookResult.NOT_FOUND;
            }

            // Update payment based on status (support both old and new status values)
            if ("success".equalsIgnoreCase(status) || "CAPTURED".equalsIgnoreCase(status) || "APPROVED".equalsIgnoreCase(status)) {
                BigDecimal paidAmount = parseAmount(firstPresent(
                        webhookData,
                        "transaction.transaction_amount",
                        "order.order_amount",
                        "order_amount",
                        "transferAmount",
                        "amount",
                        "payment_amount"
                ));
                String currency = firstPresent(
                        webhookData,
                        "transaction.transaction_currency",
                        "order.order_currency",
                        "currency"
                );
                LocalDateTime transactionTime = parseTransactionTime(firstPresent(
                        webhookData,
                        "transaction.transaction_date",
                        "transaction_date"
                ));

                if (!isPaymentMatch(payment, paidAmount, currency)) {
                    payment.markAsFailed("Webhook amount or currency does not match payment");
                    paymentRepository.save(payment);
                    log.warn("Rejected SePay webhook for booking {} due to amount/currency mismatch", bookingId);
                    return WebhookResult.OK;
                }

                if (!isPaymentOnTime(payment, transactionTime)) {
                    expirePaymentAndBooking(payment, "Payment completed after checkout expired");
                    log.warn("Rejected late SePay success webhook for booking {}", bookingId);
                    return WebhookResult.OK;
                }

                if (!payment.isPending() && !payment.isSuccess()) {
                    log.warn("Ignoring success webhook for booking {} because payment status is {}", bookingId, payment.getPaymentStatus());
                    return WebhookResult.OK;
                }

                payment.markAsSuccess(transactionId != null ? transactionId : "TXN-" + System.currentTimeMillis());
                payment.setPaymentMethod(method != null ? method : "BANK_TRANSFER");
                paymentRepository.save(payment);

                // Update booking status to CONFIRMED
                Booking booking = payment.getBooking();
                if (booking != null) {
                    booking.setBookingStatus(Booking.BookingStatus.CONFIRMED);
                    bookingRepository.save(booking);
                    releaseSeatLocksForBooking(booking);
                    log.info("Booking {} confirmed after successful payment", bookingId);
                }
                log.info("Payment marked as SUCCESS for booking {}", bookingId);
            } else if ("fail".equalsIgnoreCase(status) || "FAILED".equalsIgnoreCase(status) || "DECLINED".equalsIgnoreCase(status)) {
                payment.markAsFailed("Payment failed on SePay gateway: " + status);
                paymentRepository.save(payment);

                // Cancel pending booking on payment failure and release both Redis and DB reservations.
                Booking booking = payment.getBooking();
                if (booking != null) {
                    releaseSeatLocksForBooking(booking);
                    if (booking.getBookingStatus() == Booking.BookingStatus.PENDING) {
                        bookingService.rollbackPendingBooking(booking.getId());
                    }
                    log.info("Booking {} cancelled after failed payment", bookingId);
                }
                log.warn("Payment marked as FAILED for booking {}", bookingId);
            } else if ("cancel".equalsIgnoreCase(status) || "CANCELLED".equalsIgnoreCase(status)) {
                payment.setPaymentStatus(Payment.PaymentStatus.CANCELLED);
                paymentRepository.save(payment);

                // Cancel pending booking on payment cancellation and release both Redis and DB reservations.
                Booking booking = payment.getBooking();
                if (booking != null) {
                    releaseSeatLocksForBooking(booking);
                    if (booking.getBookingStatus() == Booking.BookingStatus.PENDING) {
                        bookingService.rollbackPendingBooking(booking.getId());
                    }
                    log.info("Booking {} cancelled after payment cancellation", bookingId);
                }
                log.info("Payment marked as CANCELLED for booking {}", bookingId);
            } else {
                log.warn("Unsupported SePay payment status '{}' for booking {}", status, bookingId);
            }

            return WebhookResult.OK;
        } catch (Exception e) {
            log.error("Error processing webhook callback", e);
            return WebhookResult.ERROR;
        }
    }

    private void releaseSeatLocksForBooking(Booking booking) {
        try {
            Long showtimeId = booking.getShowtime().getId();
            Long userId = booking.getUser().getId();
            
            // Get all seat bookings for this booking
            List<com.example.cinema.entity.SeatBooking> seatBookings = 
                seatBookingRepository.findByBooking(booking);
            
            for (com.example.cinema.entity.SeatBooking sb : seatBookings) {
                try {
                    distributedLockService.releaseSeatLock(showtimeId, sb.getSeat().getId(), userId);
                    log.debug("Released seat lock for seat {} showtime {} user {}", 
                        sb.getSeat().getId(), showtimeId, userId);
                } catch (Exception e) {
                    log.warn("Failed to release seat lock for seat {}: {}", sb.getSeat().getId(), e.getMessage());
                }
            }
            log.info("Released {} seat locks for cancelled booking {}", seatBookings.size(), booking.getId());
        } catch (Exception e) {
            log.error("Error releasing seat locks for booking {}: {}", booking.getId(), e.getMessage());
        }
    }

    private boolean verifyWebhookSignature(String rawBody, String signatureHeader, String timestampHeader) {
        if (!sePayConfig.isEnabled()) {
            return true;
        }

        if (!sePayConfig.isWebhookSignatureRequired()) {
            log.warn("SePay webhook signature verification is disabled (sandbox/test mode)");
            return true;
        }

        String webhookSecret = sePayConfig.getWebhookSecret();
        if (webhookSecret == null || webhookSecret.isBlank()) {
            log.error("SePay webhook secret is not configured");
            return false;
        }

        if (signatureHeader == null || signatureHeader.isBlank() ||
                timestampHeader == null || timestampHeader.isBlank()) {
            log.warn("SePay webhook rejected because signature or timestamp header is missing");
            return false;
        }

        long timestamp;
        try {
            timestamp = Long.parseLong(timestampHeader);
        } catch (NumberFormatException e) {
            log.warn("SePay webhook rejected because timestamp is invalid: {}", timestampHeader);
            return false;
        }

        long now = Instant.now().getEpochSecond();
        if (Math.abs(now - timestamp) > sePayConfig.getWebhookTimestampToleranceSeconds()) {
            log.warn("SePay webhook rejected because timestamp is outside tolerance. timestamp={}, now={}", timestamp, now);
            return false;
        }

        try {
            String signedPayload = timestampHeader + "." + rawBody;
            javax.crypto.Mac mac = javax.crypto.Mac.getInstance("HmacSHA256");
            javax.crypto.spec.SecretKeySpec keySpec = new javax.crypto.spec.SecretKeySpec(
                    webhookSecret.getBytes(StandardCharsets.UTF_8),
                    "HmacSHA256"
            );
            mac.init(keySpec);
            String expected = "sha256=" + bytesToHex(mac.doFinal(signedPayload.getBytes(StandardCharsets.UTF_8)));

            boolean matches = MessageDigest.isEqual(
                    expected.getBytes(StandardCharsets.UTF_8),
                    signatureHeader.getBytes(StandardCharsets.UTF_8)
            );

            if (!matches) {
                log.warn("SePay webhook signature verification failed");
            }
            return matches;
        } catch (Exception e) {
            log.error("Failed to verify SePay webhook signature", e);
            return false;
        }
    }

    private boolean isPaymentMatch(Payment payment, BigDecimal paidAmount, String currency) {
        if (paidAmount == null || payment.getAmount() == null) {
            log.warn("Payment amount is null: paidAmount={}, expected={}", paidAmount, payment.getAmount());
            return false;
        }
        if (currency != null && !currency.trim().isEmpty() && !"VND".equalsIgnoreCase(currency)) {
            log.warn("Currency mismatch: expected VND, got {}", currency);
            return false;
        }
        boolean amountMatch = payment.getAmount().compareTo(paidAmount) == 0;
        if (!amountMatch) {
            log.warn("Amount mismatch: expected {}, got {}", payment.getAmount(), paidAmount);
        }
        return amountMatch;
    }

    private boolean isPaymentOnTime(Payment payment, LocalDateTime transactionTime) {
        if (payment.getExpiresAt() == null) {
            return true;
        }
        LocalDateTime effectiveTime = transactionTime != null ? transactionTime : LocalDateTime.now();
        return !effectiveTime.isAfter(payment.getExpiresAt());
    }

    private BigDecimal parseAmount(String amount) {
        if (amount == null) {
            return null;
        }
        try {
            return new BigDecimal(amount);
        } catch (NumberFormatException e) {
            log.warn("Cannot parse SePay amount '{}'", amount);
            return null;
        }
    }

    private LocalDateTime parseTransactionTime(String transactionDate) {
        if (transactionDate == null) {
            return null;
        }
        try {
            return LocalDateTime.parse(transactionDate, SEPAY_TRANSACTION_DATE_FORMAT);
        } catch (Exception e) {
            log.warn("Cannot parse SePay transaction date '{}'", transactionDate);
            return null;
        }
    }

    private void expirePaymentAndBooking(Payment payment, String reason) {
        if (payment.isSuccess()) {
            return;
        }

        payment.markAsExpired(reason);
        paymentRepository.save(payment);

        Booking booking = payment.getBooking();
        if (booking != null && booking.getBookingStatus() == Booking.BookingStatus.PENDING) {
            releaseSeatLocksForBooking(booking);
            bookingService.rollbackPendingBooking(booking.getId());
        }
    }

    @Scheduled(fixedDelay = 60_000L)
    @Transactional
    public void expirePendingPayments() {
        List<Payment> expiredPayments = paymentRepository.findByPaymentStatusAndExpiresAtBefore(
                Payment.PaymentStatus.PENDING,
                LocalDateTime.now()
        );

        for (Payment payment : expiredPayments) {
            expirePaymentAndBooking(payment, "Payment checkout expired");
            log.info("Expired pending payment {} for booking {}", payment.getId(), payment.getBooking().getId());
        }
    }

    private String firstPresent(Map<String, String> data, String... keys) {
        for (String key : keys) {
            String value = data.get(key);
            if (value != null && !value.isBlank() && !"null".equalsIgnoreCase(value)) {
                return value;
            }
        }
        return null;
    }

    private static String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder(bytes.length * 2);
        for (byte b : bytes) {
            sb.append(String.format("%02x", b & 0xff));
        }
        return sb.toString();
    }
}
