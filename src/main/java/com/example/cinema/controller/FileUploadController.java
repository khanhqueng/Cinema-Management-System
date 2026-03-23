package com.example.cinema.controller;

import com.example.cinema.dto.FileUploadResponse;
import com.example.cinema.service.FileUploadService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.services.s3.model.S3Object;

import java.util.List;
import java.util.Map;

/**
 * REST API endpoints cho file upload lên R2
 *
 * Base path: /api/files
 *
 * Endpoints:
 * - POST /api/files/upload - Upload single file
 * - POST /api/files/upload-multiple - Upload multiple files
 * - DELETE /api/files/{key} - Delete file
 * - GET /api/files/list/{folder} - List files
 * - GET /api/files/exists/{key} - Check file existence
 */
@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
@Slf4j
public class FileUploadController {

    private final FileUploadService fileUploadService;

    /**
     * Upload single file
     *
     * Endpoint: POST /api/files/upload?folder=movies/posters
     * Content-Type: multipart/form-data
     *
     * @param file File từ request
     * @param folder Folder path (VD: movies/posters)
     * @return FileUploadResponse
     */
    @PostMapping("/upload")
//    @PreAuthorize("hasAnyRole('ADMIN', 'MODERATOR')")
    public ResponseEntity<FileUploadResponse> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "folder", defaultValue = "uploads") String folder) {

        log.info("[FileUpload] Uploading file: {} to folder: {}",
                file.getOriginalFilename(), folder);

        try {
            FileUploadResponse response = fileUploadService.uploadFile(file, folder);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (IllegalArgumentException e) {
            log.error("[FileUpload] Validation error: {}", e.getMessage());
            return ResponseEntity.badRequest().build();

        } catch (Exception e) {
            log.error("[FileUpload] Upload failed: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Upload multiple files cùng lúc
     *
     * Endpoint: POST /api/files/upload-multiple?folder=movies/posters
     * Content-Type: multipart/form-data
     * Send multiple files with key "files"
     *
     * @param files List of files
     * @param folder Folder path
     * @return List of FileUploadResponse
     */
    @PostMapping("/upload-multiple")
    @PreAuthorize("hasAnyRole('ADMIN', 'MODERATOR')")
    public ResponseEntity<List<FileUploadResponse>> uploadMultipleFiles(
            @RequestParam("files") List<MultipartFile> files,
            @RequestParam(value = "folder", defaultValue = "uploads") String folder) {

        log.info("[FileUpload] Uploading {} files to folder: {}", files.size(), folder);

        try {
            List<FileUploadResponse> responses = fileUploadService.uploadMultipleFiles(files, folder);
            return ResponseEntity.status(HttpStatus.CREATED).body(responses);

        } catch (IllegalArgumentException e) {
            log.error("[FileUpload] Validation error: {}", e.getMessage());
            return ResponseEntity.badRequest().build();

        } catch (Exception e) {
            log.error("[FileUpload] Upload failed: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Delete file từ R2
     *
     * Endpoint: DELETE /api/files/movies%2Fposters%2F20250319_abc123_avatar.jpg
     * Key phải URL-encoded
     *
     * @param key File key (full path)
     * @return Success message
     */
    @DeleteMapping("/{key:.+}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MODERATOR')")
    public ResponseEntity<Map<String, String>> deleteFile(@PathVariable String key) {

        log.info("[FileUpload] Deleting file: {}", key);

        try {
            boolean deleted = fileUploadService.deleteFile(key);

            if (deleted) {
                return ResponseEntity.ok(Map.of(
                        "message", "File deleted successfully",
                        "key", key
                ));
            } else {
                return ResponseEntity.notFound().build();
            }

        } catch (Exception e) {
            log.error("[FileUpload] Delete failed: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * List files trong folder
     *
     * Endpoint: GET /api/files/list/movies/posters?maxKeys=50
     *
     * @param folder Folder path
     * @param maxKeys Số lượng max files (default: 100)
     * @return List of S3Object metadata
     */
    @GetMapping("/list/{folder:.+}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MODERATOR')")
    public ResponseEntity<List<S3Object>> listFiles(
            @PathVariable String folder,
            @RequestParam(value = "maxKeys", defaultValue = "100") int maxKeys) {

        log.info("[FileUpload] Listing files in folder: {} (maxKeys: {})", folder, maxKeys);

        try {
            List<S3Object> files = fileUploadService.listFiles(folder, maxKeys);
            return ResponseEntity.ok(files);

        } catch (Exception e) {
            log.error("[FileUpload] List failed: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Check file existence
     *
     * Endpoint: GET /api/files/exists/movies%2Fposters%2F20250319_abc123_avatar.jpg
     *
     * @param key File key
     * @return Status object
     */
    @GetMapping("/exists/{key:.+}")
    public ResponseEntity<Map<String, Object>> fileExists(@PathVariable String key) {

        try {
            boolean exists = fileUploadService.fileExists(key);

            return ResponseEntity.ok(Map.of(
                    "key", key,
                    "exists", exists
            ));

        } catch (Exception e) {
            log.error("[FileUpload] Check existence failed: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Generate presigned URL (temporary access link)
     *
     * Endpoint: GET /api/files/presigned-url/movies%2Fposters%2Ffile.jpg?minutes=60
     *
     * @param key File key
     * @param minutes Expiration time in minutes
     * @return Presigned URL
     */
    @GetMapping("/presigned-url/{key:.+}")
    public ResponseEntity<Map<String, Object>> getPresignedUrl(
            @PathVariable String key,
            @RequestParam(value = "minutes", defaultValue = "60") int minutes) {

        log.info("[FileUpload] Generating presigned URL for: {} (expires in {} minutes)", key, minutes);

        try {
            String presignedUrl = fileUploadService.generatePresignedUrl(key, minutes);

            return ResponseEntity.ok(Map.of(
                    "key", key,
                    "presignedUrl", presignedUrl,
                    "expiresInMinutes", minutes
            ));

        } catch (Exception e) {
            log.error("[FileUpload] Presigned URL generation failed: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
}

