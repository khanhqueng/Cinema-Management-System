package com.example.cinema.service.integration;

import com.example.cinema.dto.FileUploadResponse;
import com.example.cinema.service.FileUploadService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * Example Integration Service
 *
 * Shows how to integrate FileUploadService with other domain services
 * (Movie, User, Booking, etc.)
 *
 * Usage pattern:
 * 1. User uploads file via FileUploadController
 * 2. FileUploadService returns FileUploadResponse with public URL
 * 3. Domain service stores URL in database
 * 4. Frontend renders URL in HTML/media tags
 */
@Service
@Slf4j
public class FileUploadIntegrationExample {

    private final FileUploadService fileUploadService;

    @Autowired
    public FileUploadIntegrationExample(FileUploadService fileUploadService) {
        this.fileUploadService = fileUploadService;
    }

    // ═══════════════════════════════════════════════════════════════
    // MOVIE SERVICE INTEGRATION
    // ═══════════════════════════════════════════════════════════════

    /**
     * Upload movie poster khi create/update movie
     */
    public String uploadMoviePoster(MultipartFile posterFile, Long movieId) {
        String folder = "movies/posters";
        FileUploadResponse response = fileUploadService.uploadFile(posterFile, folder);

        log.info("[Movie] Poster uploaded for movie {}: {}", movieId, response.getPublicUrl());

        // Store vào database
        // movieService.updatePosterUrl(movieId, response.getPublicUrl());

        return response.getPublicUrl();
    }

    /**
     * Upload multiple movie trailers
     */
    public List<String> uploadMovieTrailers(List<MultipartFile> trailerFiles, Long movieId) {
        String folder = "movies/trailers";
        List<FileUploadResponse> responses = fileUploadService.uploadMultipleFiles(trailerFiles, folder);

        List<String> urls = responses.stream()
                .map(FileUploadResponse::getPublicUrl)
                .toList();

        log.info("[Movie] {} trailers uploaded for movie {}", urls.size(), movieId);

        // Store vào database
        // movieService.updateTrailerUrls(movieId, urls);

        return urls;
    }

    /**
     * Delete movie poster khi delete movie
     */
    public void deleteMoviePoster(String posterKey) {
        boolean deleted = fileUploadService.deleteFile(posterKey);

        if (deleted) {
            log.info("[Movie] Poster deleted: {}", posterKey);
        } else {
            log.warn("[Movie] Poster not found: {}", posterKey);
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // USER SERVICE INTEGRATION
    // ═══════════════════════════════════════════════════════════════

    /**
     * Upload user avatar khi register/update profile
     */
    public String uploadUserAvatar(MultipartFile avatarFile, Long userId) {
        String folder = "users/avatars";
        FileUploadResponse response = fileUploadService.uploadFile(avatarFile, folder);

        log.info("[User] Avatar uploaded for user {}: {}", userId, response.getPublicUrl());

        // Store vào database
        // userService.updateAvatarUrl(userId, response.getPublicUrl());

        return response.getPublicUrl();
    }

    /**
     * Delete old user avatar khi update profile
     */
    public void deleteUserAvatar(String avatarKey) {
        boolean deleted = fileUploadService.deleteFile(avatarKey);

        if (deleted) {
            log.info("[User] Avatar deleted: {}", avatarKey);
        } else {
            log.warn("[User] Avatar not found: {}", avatarKey);
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // BOOKING SERVICE INTEGRATION
    // ═══════════════════════════════════════════════════════════════

    /**
     * Export booking receipt as PDF
     */
    public String generateBookingReceipt(MultipartFile receiptPdf, Long bookingId) {
        String folder = "bookings/receipts";
        FileUploadResponse response = fileUploadService.uploadFile(receiptPdf, folder);

        log.info("[Booking] Receipt generated for booking {}: {}", bookingId, response.getPublicUrl());

        // Store vào database
        // bookingService.updateReceiptUrl(bookingId, response.getPublicUrl());

        return response.getPublicUrl();
    }

    /**
     * Get presigned URL cho private receipt download (temporary)
     */
    public String getReceiptDownloadUrl(String receiptKey, int expirationMinutes) {
        String presignedUrl = fileUploadService.generatePresignedUrl(receiptKey, expirationMinutes);

        log.info("[Booking] Presigned URL generated for receipt: {} (expires in {} minutes)",
                receiptKey, expirationMinutes);

        return presignedUrl;
    }

    // ═══════════════════════════════════════════════════════════════
    // REVIEW SERVICE INTEGRATION
    // ═══════════════════════════════════════════════════════════════

    /**
     * Upload review images/videos
     */
    public List<String> uploadReviewMedia(List<MultipartFile> mediaFiles, Long reviewId) {
        String folder = "reviews/media";
        List<FileUploadResponse> responses = fileUploadService.uploadMultipleFiles(mediaFiles, folder);

        List<String> urls = responses.stream()
                .map(FileUploadResponse::getPublicUrl)
                .toList();

        log.info("[Review] {} media files uploaded for review {}", urls.size(), reviewId);

        return urls;
    }

    // ═══════════════════════════════════════════════════════════════
    // ADMIN INTEGRATION
    // ═══════════════════════════════════════════════════════════════

    /**
     * List all files in folder (for admin dashboard)
     */
    public List<String> listMoviePosters(int maxKeys) {
        var files = fileUploadService.listFiles("movies/posters", maxKeys);

        return files.stream()
                .map(obj -> "https://cdn.example.com/" + obj.key())
                .toList();
    }

    /**
     * Check if file exists before cleanup
     */
    public boolean isFileStillInUse(String fileKey) {
        return fileUploadService.fileExists(fileKey);
    }

    /**
     * Cleanup old files (admin task)
     */
    public int cleanupOldFiles(String folder, long ageInDays) {
        var files = fileUploadService.listFiles(folder, 1000);

        int deletedCount = 0;
        long cutoffTime = System.currentTimeMillis() - (ageInDays * 24 * 60 * 60 * 1000);

        for (var file : files) {
            if (file.lastModified().toEpochMilli() < cutoffTime) {
                boolean deleted = fileUploadService.deleteFile(file.key());
                if (deleted) deletedCount++;
            }
        }

        log.info("[Admin] Cleanup complete: deleted {} files from {}", deletedCount, folder);
        return deletedCount;
    }

    // ═══════════════════════════════════════════════════════════════
    // BEST PRACTICES
    // ═══════════════════════════════════════════════════════════════

    /**
     * PATTERN 1: Safe delete with existence check
     */
    public void safeDeleteFile(String key) {
        try {
            if (fileUploadService.fileExists(key)) {
                fileUploadService.deleteFile(key);
                log.info("[Safe] File deleted: {}", key);
            } else {
                log.warn("[Safe] File not found, skipping: {}", key);
            }
        } catch (Exception e) {
            log.error("[Safe] Error deleting file: {}", key, e);
            // Don't throw - allow operation to continue
        }
    }

    /**
     * PATTERN 2: Replace old file with new one
     */
    public String replaceFile(String oldKey, MultipartFile newFile, String folder) {
        // Upload new file first
        FileUploadResponse newResponse = fileUploadService.uploadFile(newFile, folder);

        // Only delete old file if new upload successful
        if (oldKey != null && !oldKey.isEmpty()) {
            safeDeleteFile(oldKey);
        }

        return newResponse.getPublicUrl();
    }

    /**
     * PATTERN 3: Transaction-safe upload (store key before deleting old)
     */
    public String updateFileWithRollback(String oldKey, MultipartFile newFile, String folder) {
        // 1. Upload new file
        FileUploadResponse response = fileUploadService.uploadFile(newFile, folder);

        // 2. Save new URL to database first (transaction)
        // -> If save fails, old file stays (safe)
        // -> If save succeeds, delete old file

        // 3. Delete old file
        if (oldKey != null) {
            try {
                fileUploadService.deleteFile(oldKey);
            } catch (Exception e) {
                log.warn("[Rollback] Failed to delete old file: {}, but new file saved", oldKey);
                // Don't fail the operation - new file is safe
            }
        }

        return response.getPublicUrl();
    }

    /**
     * PATTERN 4: Validate file before processing
     */
    public String uploadMoviePosterWithValidation(MultipartFile file, Long movieId) {
        try {
            // Validation happens in FileUploadService.validateFile()
            String folder = "movies/posters";
            FileUploadResponse response = fileUploadService.uploadFile(file, folder);

            return response.getPublicUrl();

        } catch (IllegalArgumentException e) {
            // Validation failed - rethrow để controller handle
            log.warn("[Validation] Invalid file for movie {}: {}", movieId, e.getMessage());
            throw e;

        } catch (Exception e) {
            // Upload failed
            log.error("[Upload] Failed to upload file for movie {}: {}", movieId, e.getMessage());
            throw new RuntimeException("Failed to upload file", e);
        }
    }
}

