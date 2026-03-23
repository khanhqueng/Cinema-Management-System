package com.example.cinema.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Configuration properties cho Cloudflare R2
 *
 * Bind từ application.yaml:
 *   r2:
 *     enabled: true
 *     endpoint: https://account-id.r2.cloudflarestorage.com
 *     access-key-id: ${R2_ACCESS_KEY_ID}
 *     secret-access-key: ${R2_SECRET_ACCESS_KEY}
 *     bucket-name: cinema-files
 *     region: wnam
 *     public-url: https://cdn.example.com  # Custom domain (optional)
 */
@Component
@ConfigurationProperties(prefix = "r2")
@Data
public class R2ConfigProperties {

    /**
     * Enable/disable R2 file upload service
     */
    private boolean enabled = false;

    /**
     * R2 endpoint URL
     * Format: https://[account-id].r2.cloudflarestorage.com
     */
    private String endpoint = "";

    /**
     * R2 Access Key ID
     */
    private String accessKeyId = "";

    /**
     * R2 Secret Access Key
     */
    private String secretAccessKey = "";

    /**
     * R2 Bucket name
     */
    private String bucketName = "";

    /**
     * R2 Region code
     * - wnam: Western North America (được recommend cho Việt Nam)
     * - enam: Eastern North America
     * - apac: Asia Pacific
     * - eur: Europe
     */
    private String region = "wnam";

    /**
     * Public URL base cho files (optional)
     * Nếu có custom domain: https://cdn.example.com
     * Nếu không: https://[account-id].r2.cloudflarestorage.com
     */
    private String publicUrl = "";

    /**
     * Generate public URL cho file key
     *
     * @param key File key trong R2
     * @return Public URL để access file
     */
    public String getPublicUrl(String key) {
        String base = publicUrl.isEmpty() ? endpoint : publicUrl;

        // Remove trailing slash
        if (base.endsWith("/")) {
            base = base.substring(0, base.length() - 1);
        }

        // Add leading slash to key
        String keyPath = key.startsWith("/") ? key : "/" + key;

        return base + keyPath;
    }

    /**
     * Validate configuration
     */
    public void validate() {
        if (!enabled) {
            return;
        }

        if (endpoint.isBlank()) {
            throw new IllegalStateException("r2.endpoint không được cấu hình");
        }

        if (accessKeyId.isBlank()) {
            throw new IllegalStateException("r2.access-key-id không được cấu hình");
        }

        if (secretAccessKey.isBlank()) {
            throw new IllegalStateException("r2.secret-access-key không được cấu hình");
        }

        if (bucketName.isBlank()) {
            throw new IllegalStateException("r2.bucket-name không được cấu hình");
        }
    }
}

