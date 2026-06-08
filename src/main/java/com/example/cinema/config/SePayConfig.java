package com.example.cinema.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * SePay Configuration Properties
 * Loads from application.yaml: sepay.*
 */
@Component
@ConfigurationProperties(prefix = "sepay")
@Getter
@Setter
public class SePayConfig {

    private boolean enabled = false;
    private boolean webhookSignatureRequired = true;
    private String merchantId;
    private String secretKey;
    private String webhookSecret;
    private long webhookTimestampToleranceSeconds = 300;
    private long paymentTimeoutMinutes = 15;
    private long paymentExpirationGraceSeconds = 60;
    private String checkoutUrl = "https://my.sepay.vn/payment/checkout";
    private String callbackUrl;

    public void validate() {
        if (enabled) {
            if (merchantId == null || merchantId.isEmpty()) {
                throw new IllegalArgumentException("SePay merchant_id is required when enabled");
            }
            if (secretKey == null || secretKey.isEmpty()) {
                throw new IllegalArgumentException("SePay secret_key is required when enabled");
            }
        }
    }
}
