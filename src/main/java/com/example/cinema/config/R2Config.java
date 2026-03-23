package com.example.cinema.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3ClientBuilder;

import java.net.URI;

/**
 * Configuration for Cloudflare R2 (S3-compatible object storage)
 *
 * R2 được cấu hình như S3 client với endpoint custom.
 * Không cần region thực sự, dùng WNAM (tối ưu cho Việt Nam)
 */
@Configuration
@Slf4j
public class R2Config {

    private final R2ConfigProperties r2Config;

    public R2Config(R2ConfigProperties r2Config) {
        this.r2Config = r2Config;
        this.r2Config.validate();
    }

    /**
     * Tạo S3Client bean trỏ đến Cloudflare R2 endpoint
     *
     * R2 là S3-compatible nên có thể dùng S3Client SDK của AWS
     * nhưng phải set endpoint URL tới R2 account-id.r2.cloudflarestorage.com
     */
    @Bean
    public S3Client s3Client() {
        if (!r2Config.isEnabled()) {
            log.warn("[R2] File upload service is DISABLED (r2.enabled=false)");
            return null;
        }

        if (r2Config.getEndpoint().isBlank() || r2Config.getAccessKeyId().isBlank() ||
            r2Config.getSecretAccessKey().isBlank()) {
            log.error("[R2] Missing required credentials: endpoint={}, keyId={}, secret={}",
                    !r2Config.getEndpoint().isBlank(), !r2Config.getAccessKeyId().isBlank(),
                    !r2Config.getSecretAccessKey().isBlank());
            throw new IllegalStateException("R2 credentials not configured");
        }

        S3ClientBuilder builder = S3Client.builder()
                .region(Region.of(r2Config.getRegion()))
                .endpointOverride(URI.create(r2Config.getEndpoint()))
                .credentialsProvider(
                    StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(r2Config.getAccessKeyId(), r2Config.getSecretAccessKey())
                    )
                )
                // S3Client sẽ path-style endpoints (s3.example.com/bucket/key)
                // R2 yêu cầu this để tránh virtual-hosted-style (bucket.s3.example.com)
                .forcePathStyle(true);

        S3Client client = builder.build();
        log.info("[R2] S3Client initialized - endpoint: {}, bucket: {}, region: {}",
                r2Config.getEndpoint(), r2Config.getBucketName(), r2Config.getRegion());

        return client;
    }
}

