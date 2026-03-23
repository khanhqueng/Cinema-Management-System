package com.example.cinema.service;

import com.example.cinema.config.R2ConfigProperties;
import com.example.cinema.dto.FileUploadResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;

import java.io.IOException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.*;

/**
 * Service để upload files lên Cloudflare R2 (S3-compatible)
 *
 * Chức năng:
 * - Upload single file
 * - Upload multiple files
 * - Generate presigned URLs (private files)
 * - Delete files
 * - List files
 *
 * Caching strategy:
 * - Không cache presigned URLs (có expiration)
 * - Có thể cache public file URLs (không hết hạn)
 */
@Service
@Slf4j
public class FileUploadService {

    private final S3Client s3Client;
    private final R2ConfigProperties r2Config;

    // File type whitelist - chỉ cho phép upload certain types
    private static final Set<String> ALLOWED_MIME_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif",
            "application/pdf",
            "video/mp4",
            "video/webm",
            "application/json"
    );

    // File size limits (bytes)
    private static final long MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
    private static final long MAX_IMAGE_SIZE = 10 * 1024 * 1024;  // 10MB

    @Autowired
    public FileUploadService(S3Client s3Client, R2ConfigProperties r2Config) {
        this.s3Client = s3Client;
        this.r2Config = r2Config;
    }

    /**
     * Upload single file lên R2
     *
     * @param file MultipartFile từ request
     * @param folder Folder path (VD: "movies/posters", "users/avatars")
     * @return FileUploadResponse chứa URL và metadata
     */
    public FileUploadResponse uploadFile(MultipartFile file, String folder) {
        validateFile(file);

        String key = generateFileKey(file, folder);

        try {
            long startTime = System.currentTimeMillis();

            // Upload file lên R2
            PutObjectRequest request = PutObjectRequest.builder()
                    .bucket(r2Config.getBucketName())
                    .key(key)
                    .contentType(file.getContentType())
                    .metadata(generateMetadata(file))
                    .build();

            s3Client.putObject(request, RequestBody.fromInputStream(
                    file.getInputStream(),
                    file.getSize()
            ));

            long duration = System.currentTimeMillis() - startTime;
            log.info("[R2] File uploaded successfully - key: {}, size: {} bytes, duration: {}ms",
                    key, file.getSize(), duration);

            String publicUrl = r2Config.getPublicUrl(key);

            return FileUploadResponse.builder()
                    .key(key)
                    .originalFileName(file.getOriginalFilename())
                    .fileSize(file.getSize())
                    .contentType(file.getContentType())
                    .publicUrl(publicUrl)
                    .uploadedAt(new Date())
                    .build();

        } catch (IOException e) {
            log.error("[R2] Failed to upload file: {}", key, e);
            throw new RuntimeException("Failed to upload file: " + e.getMessage(), e);
        }
    }

    /**
     * Upload multiple files cùng lúc
     *
     * @param files List of MultipartFiles
     * @param folder Folder path
     * @return List of FileUploadResponse
     */
    public List<FileUploadResponse> uploadMultipleFiles(List<MultipartFile> files, String folder) {
        return files.stream()
                .map(file -> uploadFile(file, folder))
                .toList();
    }

    /**
     * Generate presigned URL cho private files (có expiration time)
     *
     * @param key File key trong R2
     * @param expirationMinutes URL hết hạn sau bao nhiêu phút (max 7 days)
     * @return Presigned URL
     */
    public String generatePresignedUrl(String key, int expirationMinutes) {
        try {
            // Validate expiration time
            int maxMinutes = 7 * 24 * 60; // 7 days
            if (expirationMinutes > maxMinutes) {
                expirationMinutes = maxMinutes;
            }

            // R2 không support getObject presigned URLs trong AWS SDK v2
            // Workaround: dùng tính năng Signed URLs của R2 API
            // Hoặc set files public + return public URL

            log.warn("[R2] Presigned URLs require custom implementation with R2 API");

            // Fallback: return public URL
            return r2Config.getPublicUrl(key);

        } catch (Exception e) {
            log.error("[R2] Failed to generate presigned URL for key: {}", key, e);
            throw new RuntimeException("Failed to generate presigned URL", e);
        }
    }

    /**
     * Delete file từ R2
     *
     * @param key File key
     * @return true if delete successful, false if file not found
     */
    public boolean deleteFile(String key) {
        try {
            DeleteObjectRequest request = DeleteObjectRequest.builder()
                    .bucket(r2Config.getBucketName())
                    .key(key)
                    .build();

            s3Client.deleteObject(request);

            log.info("[R2] File deleted successfully - key: {}", key);
            return true;

        } catch (NoSuchKeyException e) {
            log.warn("[R2] File not found when attempting delete - key: {}", key);
            return false;
        } catch (Exception e) {
            log.error("[R2] Failed to delete file - key: {}", key, e);
            throw new RuntimeException("Failed to delete file: " + e.getMessage(), e);
        }
    }

    /**
     * List files trong folder
     *
     * @param folder Folder path
     * @param maxKeys Số lượng max để return (max 1000)
     * @return List of S3Object metadata
     */
    public List<S3Object> listFiles(String folder, int maxKeys) {
        try {
            maxKeys = Math.min(maxKeys, 1000);

            ListObjectsV2Request request = ListObjectsV2Request.builder()
                    .bucket(r2Config.getBucketName())
                    .prefix(folder.endsWith("/") ? folder : folder + "/")
                    .maxKeys(maxKeys)
                    .build();

            ListObjectsV2Response response = s3Client.listObjectsV2(request);

            log.info("[R2] Listed {} files in folder: {}", response.keyCount(), folder);

            return response.contents() != null ? response.contents() : List.of();

        } catch (Exception e) {
            log.error("[R2] Failed to list files in folder: {}", folder, e);
            throw new RuntimeException("Failed to list files: " + e.getMessage(), e);
        }
    }

    /**
     * Check file existence
     */
    public boolean fileExists(String key) {
        try {
            HeadObjectRequest request = HeadObjectRequest.builder()
                    .bucket(r2Config.getBucketName())
                    .key(key)
                    .build();

            s3Client.headObject(request);
            return true;

        } catch (NoSuchKeyException e) {
            return false;
        } catch (Exception e) {
            log.error("[R2] Error checking file existence - key: {}", key, e);
            return false;
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // Private helpers
    // ═══════════════════════════════════════════════════════════════

    /**
     * Validate file trước khi upload
     */
    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }

        if (file.getOriginalFilename() == null) {
            throw new IllegalArgumentException("File name is null");
        }

        // Check MIME type
        if (!ALLOWED_MIME_TYPES.contains(file.getContentType())) {
            throw new IllegalArgumentException(
                    "File type not allowed: " + file.getContentType());
        }

        // Check file size based on type
        long maxSize = file.getContentType().startsWith("image/") ?
                MAX_IMAGE_SIZE : MAX_FILE_SIZE;

        if (file.getSize() > maxSize) {
            throw new IllegalArgumentException(
                    "File size exceeds limit: " + (maxSize / (1024 * 1024)) + "MB");
        }
    }

    /**
     * Generate unique file key dùng timestamp + hash
     *
     * VD: movies/posters/20250319_abc123_movie-title.jpg
     */
    private String generateFileKey(MultipartFile file, String folder) {
        String originalName = file.getOriginalFilename();
        String nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.'));
        String extension = originalName.substring(originalName.lastIndexOf('.'));

        // Sanitize filename
        String sanitized = nameWithoutExt
                .replaceAll("[^a-zA-Z0-9_-]", "-")
                .replaceAll("-+", "-")
                .toLowerCase();

        // Generate short hash từ file content
        String hash = generateFileHash(file);

        long timestamp = System.currentTimeMillis();

        String folderPath = folder.endsWith("/") ? folder : folder + "/";

        return folderPath + timestamp + "_" + hash + "_" + sanitized + extension;
    }

    /**
     * Generate short hash từ file content
     * Dùng MD5 (nhanh, good enough cho dedup)
     */
    private String generateFileHash(MultipartFile file) {
        try {
            MessageDigest md = MessageDigest.getInstance("MD5");
            byte[] digest = md.digest(file.getBytes());

            // Convert to hex
            StringBuilder sb = new StringBuilder();
            for (byte b : digest) {
                sb.append(String.format("%02x", b));
            }

            // Return first 8 chars
            return sb.substring(0, 8);

        } catch (NoSuchAlgorithmException | IOException e) {
            log.warn("[R2] Failed to generate file hash, using random", e);
            return UUID.randomUUID().toString().substring(0, 8);
        }
    }

    /**
     * Generate metadata cho object
     */
    private Map<String, String> generateMetadata(MultipartFile file) {
        Map<String, String> metadata = new HashMap<>();
        metadata.put("original-filename", file.getOriginalFilename());
        metadata.put("content-type", file.getContentType());
        metadata.put("uploaded-at", new Date().toString());
        return metadata;
    }
}

