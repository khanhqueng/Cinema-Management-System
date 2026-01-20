package com.example.cinema.controller;

import com.example.cinema.dto.*;
import com.example.cinema.entity.User;
import com.example.cinema.security.JwtUtil;
import com.example.cinema.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * Authentication Controller
 * Handles user registration, login, and authentication-related operations
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*", maxAge = 3600)
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserService userService;
    private final JwtUtil jwtUtil;

    /**
     * User registration endpoint
     */
    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody RegisterRequest request) {
        try {
            log.info("Registration attempt for email: {}", request.getEmail());

            UserDto user = userService.registerUser(request);

            log.info("User registered successfully: {}", user.getEmail());
            return ResponseEntity.ok(Map.of(
                "message", "User registered successfully",
                "user", user
            ));

        } catch (IllegalArgumentException e) {
            log.warn("Registration failed: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Registration error: ", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Registration failed. Please try again."));
        }
    }

    /**
     * User login endpoint
     */
    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@Valid @RequestBody LoginRequest request) {
        try {
            log.info("Login attempt for email: {}", request.getEmail());

            // Authenticate user
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );

            User user = (User) authentication.getPrincipal();

            // Generate JWT token
            String jwt = jwtUtil.generateToken(user);

            log.info("User logged in successfully: {}", user.getEmail());
            return ResponseEntity.ok(new AuthResponse(jwt, UserDto.from(user)));

        } catch (BadCredentialsException e) {
            log.warn("Login failed - bad credentials for email: {}", request.getEmail());
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Invalid email or password"));
        } catch (AuthenticationException e) {
            log.warn("Login failed - authentication error: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Authentication failed"));
        } catch (Exception e) {
            log.error("Login error: ", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Login failed. Please try again."));
        }
    }

    /**
     * Check if email exists
     */
    @GetMapping("/check-email")
    public ResponseEntity<?> checkEmail(@RequestParam String email) {
        try {
            boolean exists = userService.emailExists(email);
            return ResponseEntity.ok(Map.of(
                "exists", exists,
                "message", exists ? "Email already registered" : "Email available"
            ));
        } catch (Exception e) {
            log.error("Error checking email: ", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Error checking email"));
        }
    }

    /**
     * Get authentication status
     */
    @GetMapping("/status")
    public ResponseEntity<?> getAuthStatus() {
        // This endpoint is protected, so if we reach here, user is authenticated
        return ResponseEntity.ok(Map.of(
            "authenticated", true,
            "message", "User is authenticated"
        ));
    }

    /**
     * Get system statistics (for admin)
     */
    @GetMapping("/stats")
    public ResponseEntity<?> getSystemStats() {
        try {
            Map<String, Object> stats = new HashMap<>();
            stats.put("totalUsers", userService.getTotalUsers());
            stats.put("adminCount", userService.getAdminCount());
            stats.put("userCount", userService.getUserCount());

            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            log.error("Error getting system stats: ", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Error retrieving system statistics"));
        }
    }
}