//package com.example.cinema.example;
//
//import com.example.cinema.dto.ZaloPayCreateOrderRequest;
//import com.example.cinema.entity.Booking;
//import com.example.cinema.entity.User;
//import com.example.cinema.service.BookingService;
//import com.example.cinema.service.ZaloPayService;
//import lombok.RequiredArgsConstructor;
//import org.springframework.stereotype.Service;
//
//import java.math.BigDecimal;
//
///**
// * Example Service showing how to integrate ZaloPay with Booking Flow
// *
// * This is a reference implementation showing best practices for integrating
// * ZaloPay payment into your booking workflow.
// */
//@Service
//@RequiredArgsConstructor
//public class BookingWithPaymentExample {
//
//    private final BookingService bookingService;
//    private final ZaloPayService zaloPayService;
//
//    /**
//     * Example 1: Create booking and initiate payment
//     */
//    public void exampleCreateBookingAndPay(User currentUser, Long showtimeId, Integer seatsBooked) {
//        // Step 1: Create booking (initial status: PENDING or CONFIRMED depending on business logic)
//        Booking booking = bookingService.createBooking(currentUser, showtimeId, seatsBooked);
//
//        // Step 2: Prepare payment request
//        ZaloPayCreateOrderRequest paymentRequest = ZaloPayCreateOrderRequest.builder()
//                .bookingId(booking.getId())
//                .amount(booking.getTotalAmount())
//                .description(String.format(
//                    "Cinema Ticket - %s (%d seats)",
//                    booking.getMovieTitle(),
//                    booking.getSeatsBooked()
//                ))
//                .phoneNumber(currentUser.getPhoneNumber())
//                .email(currentUser.getEmail())
//                .userName(currentUser.getFullName())
//                .build();
//
//        // Step 3: Create payment order via ZaloPay
//        var paymentOrder = zaloPayService.createPaymentOrder(currentUser, paymentRequest);
//
//        // Step 4: Frontend will redirect user to paymentOrder.getCheckoutUrl()
//        // After payment, ZaloPay will send callback to update payment status
//    }
//
//    /**
//     * Example 2: Check payment status before allowing booking confirmation
//     */
//    public boolean isBookingPaid(Long bookingId) {
//        var payment = zaloPayService.getPaymentByBookingId(bookingId);
//
//        return payment.isPresent() && payment.get().isSuccess();
//    }
//
//    /**
//     * Example 3: Handle booking cancellation with refund consideration
//     */
//    public void exampleCancelBookingWithRefund(Long bookingId) {
//        // Get booking
//        Booking booking = bookingService.getBookingByIdOrThrow(bookingId);
//
//        // Check if booking has been paid
//        var payment = zaloPayService.getPaymentByBookingId(bookingId);
//
//        if (payment.isPresent() && payment.get().isSuccess()) {
//            // Booking was paid - in production, you would initiate refund
//            System.out.println("Booking paid! Consider refunding transaction: " +
//                             payment.get().getTransactionId());
//
//            // TODO: Implement refund logic with ZaloPay API
//        }
//
//        // Cancel booking
//        bookingService.cancelBooking(bookingId, booking.getUser());
//    }
//
//    /**
//     * Example 4: Retrieve user's payment history
//     */
//    public void exampleGetUserPaymentHistory(Long userId) {
//        // In a real implementation, you would use PaymentRepository
//        // to retrieve user's payments with pagination
//
//        /*
//        Page<Payment> userPayments = paymentRepository.findByBookingUserId(userId, pageable);
//
//        for (Payment payment : userPayments) {
//            System.out.println(String.format(
//                "Payment: %s | Amount: %d VND | Status: %s | Date: %s",
//                payment.getAppTransId(),
//                payment.getAmount(),
//                payment.getPaymentStatus(),
//                payment.getCreatedAt()
//            ));
//        }
//        */
//    }
//
//    /**
//     * Example 5: Payment processing with error handling
//     */
//    public void examplePaymentWithErrorHandling(User user, Long bookingId, BigDecimal amount) {
//        try {
//            // Create payment
//            var request = ZaloPayCreateOrderRequest.builder()
//                    .bookingId(bookingId)
//                    .amount(amount)
//                    .description("Cinema Ticket Payment")
//                    .email(user.getEmail())
//                    .build();
//
//            var paymentOrder = zaloPayService.createPaymentOrder(user, request);
//
//            // Check if order creation was successful
//            if (paymentOrder.getReturnCode() != 1) {
//                // Handle error
//                String error = paymentOrder.getErrorMessage() != null
//                    ? paymentOrder.getErrorMessage()
//                    : paymentOrder.getReturnMessage();
//                System.err.println("Payment creation failed: " + error);
//                return;
//            }
//
//            // Success - return checkout URL to frontend
//            System.out.println("Redirect user to: " + paymentOrder.getCheckoutUrl());
//
//        } catch (Exception e) {
//            System.err.println("Unexpected error: " + e.getMessage());
//            // Log error and notify user
//        }
//    }
//
//    /**
//     * Example 6: Scheduled task to check orphaned payments
//     * (Payments created but never completed)
//     *
//     * This would typically be a @Scheduled method that runs periodically
//     */
//    public void exampleCleanupOrphanedPayments() {
//        /*
//        // Find payments still in PENDING status after 1 hour
//        LocalDateTime oneHourAgo = LocalDateTime.now().minusHours(1);
//
//        List<Payment> orphanedPayments = paymentRepository.findByPaymentStatusAndCreatedAtBefore(
//            Payment.PaymentStatus.PENDING,
//            oneHourAgo
//        );
//
//        for (Payment payment : orphanedPayments) {
//            // Mark as failed or send reminder to user
//            // This depends on your business requirements
//        }
//        */
//    }
//
//    /**
//     * Integration points to consider:
//     *
//     * 1. **Booking Controller**:
//     *    - After creating booking, redirect to payment if required
//     *    - Check payment status before allowing booking confirmation
//     *
//     * 2. **Email Service**:
//     *    - Send payment confirmation email after successful payment
//     *    - Send payment failure notification
//     *
//     * 3. **Reporting**:
//     *    - Track payment success/failure rates
//     *    - Monitor average payment processing time
//     *    - Generate revenue reports
//     *
//     * 4. **Security**:
//     *    - Validate payment amounts server-side
//     *    - Verify user owns the booking before allowing payment
//     *    - Log all payment operations for audit trail
//     *
//     * 5. **User Experience**:
//     *    - Show payment status on booking details page
//     *    - Allow users to retry failed payments
//     *    - Provide clear error messages
//     *    - Show payment receipt after successful transaction
//     */
//}
