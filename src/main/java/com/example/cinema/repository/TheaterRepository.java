package com.example.cinema.repository;

import com.example.cinema.entity.Theater;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Theater Repository - Venue Management
 * Basic theater operations for venue management
 */
@Repository
public interface TheaterRepository extends JpaRepository<Theater, Long> {

    // Find by theater type
    List<Theater> findByTheaterType(Theater.TheaterType theaterType);
    Page<Theater> findByTheaterType(Theater.TheaterType theaterType, Pageable pageable);

    // Search by name
    Page<Theater> findByNameContainingIgnoreCase(String name, Pageable pageable);

    // Find by capacity range
    @Query("SELECT t FROM Theater t WHERE t.capacity BETWEEN :minCapacity AND :maxCapacity")
    Page<Theater> findByCapacityRange(@Param("minCapacity") Integer minCapacity,
                                     @Param("maxCapacity") Integer maxCapacity,
                                     Pageable pageable);

    // Theaters with active showtimes
    @Query("SELECT DISTINCT t FROM Theater t " +
           "JOIN t.showtimes s " +
           "WHERE s.showDatetime > CURRENT_TIMESTAMP")
    List<Theater> findTheatersWithActiveShowtimes();

    // Theater utilization
    @Query("SELECT t.id, t.name, t.capacity, " +
           "COALESCE(SUM(t.capacity - s.availableSeats), 0) as totalBookedSeats " +
           "FROM Theater t " +
           "LEFT JOIN t.showtimes s " +
           "WHERE s.showDatetime > CURRENT_TIMESTAMP " +
           "GROUP BY t.id, t.name, t.capacity " +
           "ORDER BY totalBookedSeats DESC")
    List<Object[]> getTheaterUtilization();

    // Statistics
    @Query("SELECT COUNT(t) FROM Theater t WHERE t.theaterType = :type")
    long countByTheaterType(@Param("type") Theater.TheaterType type);

    @Query("SELECT SUM(t.capacity) FROM Theater t")
    Long getTotalCapacity();
}