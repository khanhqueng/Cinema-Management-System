package com.example.cinema.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.Map;

/**
 * Response DTO for SePay checkout initialization
 * Contains form fields to submit to SePay gateway
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SePayCheckoutResponse {

    private Long paymentId;
    private Long bookingId;
    private BigDecimal amount;
    private String checkoutUrl;
    private Map<String, String> formFields;
}
