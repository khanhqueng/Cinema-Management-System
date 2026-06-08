package com.example.cinema.repository;

import com.example.cinema.entity.Payment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository for Payment Entity
 */
@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    Optional<Payment> findByAppTransId(String appTransId);

    Optional<Payment> findByTransactionId(String transactionId);

    Optional<Payment> findByBookingId(Long bookingId);

    Page<Payment> findByPaymentStatus(Payment.PaymentStatus status, Pageable pageable);

    Page<Payment> findByBookingUserId(Long userId, Pageable pageable);

    List<Payment> findByPaymentStatusAndExpiresAtBefore(Payment.PaymentStatus status, LocalDateTime expiresAt);
}
