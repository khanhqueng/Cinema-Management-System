package com.example.cinema.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

/**
 * Response object cho file upload operation
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FileUploadResponse {

    /**
     * File key trong R2 (full path)
     * VD: movies/posters/20250319_abc123_avatar.jpg
     */
    private String key;

    /**
     * Original filename từ client
     */
    private String originalFileName;

    /**
     * File size in bytes
     */
    private long fileSize;

    /**
     * MIME type
     * VD: image/jpeg, video/mp4
     */
    private String contentType;

    /**
     * Public URL để access file
     * VD: https://cdn.example.com/movies/posters/20250319_abc123_avatar.jpg
     */
    private String publicUrl;

    /**
     * Timestamp khi upload
     */
    private Date uploadedAt;
}

