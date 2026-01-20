package com.example.cinema.repository;

import com.example.cinema.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * User Repository - Authentication & User Management
 * Focused on essential user operations for Spring Security integration
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    // Authentication queries
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);

    // Role-based queries
    Page<User> findByRole(User.Role role, Pageable pageable);

    // Search functionality
    @Query("SELECT u FROM User u WHERE " +
           "LOWER(u.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<User> searchUsers(@Param("search") String search, Pageable pageable);

    // Statistics
    @Query("SELECT COUNT(u) FROM User u WHERE u.role = :role")
    long countByRole(@Param("role") User.Role role);
}