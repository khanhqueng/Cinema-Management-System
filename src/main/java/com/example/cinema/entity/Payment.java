package com.example.cinema.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Payment Entity - Stores payment transaction information
 * Tracks all payment interactions with ZaloPay
 */
@Entity
@Table(name = "payments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"booking"})
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "Booking is required")
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;

    @Positive(message = "Amount must be positive")
    @Column(name = "amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(name = "payment_status")
    private PaymentStatus paymentStatus = PaymentStatus.PENDING;

    @Column(name = "transaction_id", unique = true)
    private String transactionId; // ZaloPay Transaction ID

    @Column(name = "app_trans_id", unique = true)
    private String appTransId; // ZaloPay App Transaction ID

    @Column(name = "zalo_pay_order_id")
    private String zaloPayOrderId; // Order ID from ZaloPay

    @Column(name = "checkout_url")
    private String checkoutUrl; // Checkout URL returned by ZaloPay

    @Column(name = "payment_method")
    private String paymentMethod; // Credit card, debit card, wallet, etc.

    @Column(name = "failure_reason")
    private String failureReason; // Reason if payment failed

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "paid_at")
    private LocalDateTime paidAt; // When payment was successfully completed

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    // Utility methods
    public boolean isPending() {
        return PaymentStatus.PENDING.equals(paymentStatus);
    }

    public boolean isSuccess() {
        return PaymentStatus.SUCCESS.equals(paymentStatus);
    }

    public boolean isFailed() {
        return PaymentStatus.FAILED.equals(paymentStatus);
    }

    public boolean isCancelled() {
        return PaymentStatus.CANCELLED.equals(paymentStatus);
    }

    public void markAsSuccess(String transactionId) {
        this.paymentStatus = PaymentStatus.SUCCESS;
        this.transactionId = transactionId;
        this.paidAt = LocalDateTime.now();
    }

    public void markAsFailed(String reason) {
        this.paymentStatus = PaymentStatus.FAILED;
        this.failureReason = reason;
    }

    public void markAsExpired(String reason) {
        this.paymentStatus = PaymentStatus.EXPIRED;
        this.failureReason = reason;
    }

    /**
     * Payment Status Enumeration
     */
    public enum PaymentStatus {
        PENDING,      // Payment initiated but not yet completed
        SUCCESS,      // Payment completed successfully
        FAILED,       // Payment failed
        CANCELLED,    // Payment was cancelled by user
        EXPIRED       // Payment was not completed before checkout deadline
    }
}
