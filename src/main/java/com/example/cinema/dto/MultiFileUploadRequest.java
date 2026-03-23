package com.example.cinema.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Request object cho multiple file uploads
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MultiFileUploadRequest {

    /**
     * Folder path để store files
     * VD: movies/posters, users/avatars
     */
    private String folder;

    /**
     * File contents sẽ được attach via multipart/form-data
     * Ở controller, dùng @RequestParam("files") List<MultipartFile> files
     */
}

