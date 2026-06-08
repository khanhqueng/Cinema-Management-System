package com.example.cinema.dto;

import com.example.cinema.entity.Payment;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO for Payment Status Response
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentStatusResponse {

    private Long paymentId;
    private Long bookingId;
    private BigDecimal amount;
    private Payment.PaymentStatus status;
    private String transactionId;
    private String appTransId;
    private String failureReason;
    private LocalDateTime createdAt;
    private LocalDateTime paidAt;

    public static PaymentStatusResponse fromPayment(Payment payment) {
        return PaymentStatusResponse.builder()
                .paymentId(payment.getId())
                .bookingId(payment.getBooking().getId())
                .amount(payment.getAmount())
                .status(payment.getPaymentStatus())
                .transactionId(payment.getTransactionId())
                .appTransId(payment.getAppTransId())
                .failureReason(payment.getFailureReason())
                .createdAt(payment.getCreatedAt())
                .paidAt(payment.getPaidAt())
                .build();
    }
}
