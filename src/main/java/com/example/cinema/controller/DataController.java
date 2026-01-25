package com.example.cinema.controller;

import com.example.cinema.service.DataInitializationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * Controller for managing mock data initialization
 * Provides endpoints to reload test data during development
 */
@RestController
@RequestMapping("/api/admin/data")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DataController {

    private final DataInitializationService dataInitializationService;

    /**
     * Endpoint to force reinitialize all mock data
     * This will clear existing data and load the comprehensive mock dataset
     */
    @PostMapping("/reinitialize")
    public ResponseEntity<Map<String, String>> reinitializeData() {
        try {
            dataInitializationService.reinitializeData();

            Map<String, String> response = new HashMap<>();
            response.put("status", "success");
            response.put("message", "Mock data has been reinitialized successfully");
            response.put("info", "The database now contains 50 movies, 15 theaters, comprehensive showtimes, and sample bookings");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, String> response = new HashMap<>();
            response.put("status", "error");
            response.put("message", "Failed to reinitialize data: " + e.getMessage());

            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * Get data statistics
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getDataStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("status", "success");
        stats.put("message", "Cinema system with comprehensive mock data is ready");
        stats.put("features", new String[]{
            "50 diverse movies (Vietnamese & International)",
            "15 theaters (Standard, VIP, IMAX)",
            "14 days of showtimes with realistic pricing",
            "Sample bookings with varied seat availability",
            "Complete booking flow functionality"
        });

        return ResponseEntity.ok(stats);
    }
}