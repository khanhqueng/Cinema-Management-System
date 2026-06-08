package com.example.cinema.dto;

import lombok.*;

/**
 * DTO for SePay webhook callback request
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SePayCallbackRequest {

    // Payment details
    private String orderInvoiceNumber;
    private String orderAmount;
    private String currency;
    private String orderDescription;

    // Transaction details
    private String transactionDate;
    private String transactionId;
    private String status; // success, fail, cancel
    private String method; // BANK_TRANSFER, NAPAS, CARD

    // Refund information
    private String refundAmount;
    private String refundStatus;

    // Bank details
    private String bankAccount;
    private String bankName;
}
