package com.example.cinema.service;

import com.example.cinema.config.R2ConfigProperties;
import com.example.cinema.dto.FileUploadResponse;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectResponse;

import java.io.IOException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * Unit tests cho FileUploadService
 *
 * Chạy tests:
 *   ./gradlew test --tests FileUploadServiceTest
 */
@Slf4j
@ExtendWith(MockitoExtension.class)
class FileUploadServiceTest {

    @Mock
    private S3Client s3Client;

    @Mock
    private R2ConfigProperties r2Config;

    private FileUploadService fileUploadService;

    @BeforeEach
    void setUp() {
        when(r2Config.getBucketName()).thenReturn("cinema-files");
        when(r2Config.getPublicUrl("test.jpg")).thenReturn("https://cdn.example.com/test.jpg");
        fileUploadService = new FileUploadService(s3Client, r2Config);
    }

    @Test
    void testValidateFileSuccess() {
        MultipartFile validFile = new MockMultipartFile(
                "file",
                "avatar.jpg",
                "image/jpeg",
                "test content".getBytes()
        );

        // Should not throw
        assertDoesNotThrow(() -> fileUploadService.uploadFile(validFile, "users/avatars"));
    }

    @Test
    void testValidateFileEmptyFile() {
        MultipartFile emptyFile = new MockMultipartFile(
                "file",
                "empty.jpg",
                "image/jpeg",
                new byte[0]
        );

        assertThrows(IllegalArgumentException.class,
                () -> fileUploadService.uploadFile(emptyFile, "users/avatars"));
    }

    @Test
    void testValidateFileInvalidType() {
        MultipartFile invalidFile = new MockMultipartFile(
                "file",
                "virus.exe",
                "application/x-msdownload",
                "malware content".getBytes()
        );

        assertThrows(IllegalArgumentException.class,
                () -> fileUploadService.uploadFile(invalidFile, "uploads"));
    }

    @Test
    void testValidateFileTooBig() {
        byte[] largeContent = new byte[11 * 1024 * 1024]; // 11MB > 10MB limit for images
        MultipartFile largeFile = new MockMultipartFile(
                "file",
                "large.jpg",
                "image/jpeg",
                largeContent
        );

        assertThrows(IllegalArgumentException.class,
                () -> fileUploadService.uploadFile(largeFile, "uploads"));
    }

    @Test
    void testGenerateFileKeyFormat() throws IOException {
        MultipartFile file = new MockMultipartFile(
                "file",
                "Avatar Image.jpg",
                "image/jpeg",
                "test content".getBytes()
        );

        // Upload should generate key in format: folder/timestamp_hash_sanitized.ext
        when(s3Client.putObject(any(), any())).thenReturn(PutObjectResponse.builder().build());

        FileUploadResponse response = fileUploadService.uploadFile(file, "users/avatars");

        assertNotNull(response.getKey());
        assertTrue(response.getKey().startsWith("users/avatars/"));
        assertTrue(response.getKey().contains("_"));
        assertTrue(response.getKey().endsWith(".jpg"));
    }

    @Test
    void testUploadPreservesFilename() throws IOException {
        String originalName = "my-profile-picture.jpg";
        MultipartFile file = new MockMultipartFile(
                "file",
                originalName,
                "image/jpeg",
                "test content".getBytes()
        );

        when(s3Client.putObject(any(), any())).thenReturn(PutObjectResponse.builder().build());

        FileUploadResponse response = fileUploadService.uploadFile(file, "users/avatars");

        assertEquals(originalName, response.getOriginalFileName());
    }

    @Test
    void testUploadResponseContainsMetadata() throws IOException {
        MultipartFile file = new MockMultipartFile(
                "file",
                "test.jpg",
                "image/jpeg",
                "test content".getBytes()
        );

        when(s3Client.putObject(any(), any())).thenReturn(PutObjectResponse.builder().build());

        FileUploadResponse response = fileUploadService.uploadFile(file, "uploads");

        assertNotNull(response.getKey());
        assertNotNull(response.getOriginalFileName());
        assertNotNull(response.getFileSize());
        assertNotNull(response.getContentType());
        assertNotNull(response.getPublicUrl());
        assertNotNull(response.getUploadedAt());
    }

    // ════════════════════════════════════════════════════════════════
    // Integration tests (chạy với R2 thực)
    // ════════════════════════════════════════════════════════════════

    /**
     * Integration test - requires R2 credentials
     * Skip test nếu không configure R2
     *
     * Chạy với: ./gradlew test --tests FileUploadServiceTest#testRealR2Upload
     */
    //@Test
    //@EnabledIfEnvironmentVariable(named = "R2_ENABLED", matches = "true")
    void testRealR2Upload() throws IOException {
        // Requires actual R2 setup
        // This test uploads to real R2 bucket

        MultipartFile file = new MockMultipartFile(
                "file",
                "test-integration.jpg",
                "image/jpeg",
                "test content".getBytes()
        );

        // This would use real S3Client bean from Spring context
        // assertDoesNotThrow(() -> fileUploadService.uploadFile(file, "test"));
    }
}

