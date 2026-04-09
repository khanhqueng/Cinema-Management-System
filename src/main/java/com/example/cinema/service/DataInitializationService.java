package com.example.cinema.service;

import com.example.cinema.config.AiProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.util.FileCopyUtils;

import jakarta.annotation.PostConstruct;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;

/**
 * Service to initialize the database with comprehensive mock data
 * Simple implementation that loads the mock data SQL file once
 */
@Service
@RequiredArgsConstructor
public class DataInitializationService {

    private final JdbcTemplate jdbcTemplate;
    private final MovieEmbeddingService movieEmbeddingService;
    private final AiProperties aiProperties;

    /**
     * Initialize database with comprehensive mock data
     * This runs automatically after the service is constructed
     */
    @PostConstruct
    public void initializeData() {
        try {
            // Check if we need to load mock data
            Integer movieCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM movies", Integer.class);

            if (movieCount == null || movieCount < 50) {
                System.out.println("🎬 Loading comprehensive mock data from SQL file (current movies: " + (movieCount != null ? movieCount : 0) + ")...");

                // Load the SQL file
                loadFromSqlFile();

                System.out.println("✅ Comprehensive mock data loaded successfully!");
                printDataSummary();
                seedEmbeddingsIfEnabled();
            } else {
                System.out.println("📊 Database already contains comprehensive mock data (" + movieCount + " movies). Skipping initialization.");
                System.out.println("💡 Use POST /api/admin/data/reinitialize to reload mock data if needed.");
                seedEmbeddingsIfEnabled();
            }

        } catch (Exception e) {
            System.err.println("❌ Error during data initialization: " + e.getMessage());
            e.printStackTrace();
        }
    }


    /**
     * Load data from SQL file (execute entire script at once)
     */
    private void loadFromSqlFile() {
        try {
            ClassPathResource resource = new ClassPathResource("data-mock.sql");
            String sqlScript = FileCopyUtils.copyToString(
                new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8)
            );

            // Execute the entire SQL script at once
            System.out.println("📄 Executing complete SQL script...");
            jdbcTemplate.execute(sqlScript);
            System.out.println("✅ SQL script executed successfully!");

        } catch (Exception e) {
            System.err.println("⚠️ SQL file execution failed: " + e.getMessage());
            throw new RuntimeException("Failed to load from SQL file", e);
        }
    }


    /**
     * Print a summary of loaded data
     */
    private void printDataSummary() {
        try {
            Integer movies = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM movies", Integer.class);
            Integer theaters = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM theaters", Integer.class);
            Integer showtimes = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM showtimes", Integer.class);
            Integer bookings = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM bookings", Integer.class);

            System.out.println("\n🎭 CINEMA MOCK DATA SUMMARY:");
            System.out.println("   📽️  Movies: " + movies);
            System.out.println("   🏛️  Theaters: " + theaters);
            System.out.println("   🎫 Showtimes: " + showtimes);
            System.out.println("   📝 Bookings: " + bookings);

            // Genre distribution
            System.out.println("\n🎨 Genre Distribution:");
            jdbcTemplate.query(
                "SELECT genre, COUNT(*) as count FROM movies GROUP BY genre ORDER BY count DESC",
                (rs) -> {
                    System.out.println("   • " + rs.getString("genre") + ": " + rs.getInt("count") + " movies");
                }
            );

            // Theater types
            System.out.println("\n🎬 Theater Types:");
            jdbcTemplate.query(
                "SELECT theater_type, COUNT(*) as count FROM theaters GROUP BY theater_type",
                (rs) -> {
                    System.out.println("   • " + rs.getString("theater_type") + ": " + rs.getInt("count") + " theaters");
                }
            );

            System.out.println("\n🚀 System ready for testing! You can now:");
            System.out.println("   • Browse 50 diverse movies");
            System.out.println("   • View showtimes across 15 theaters");
            System.out.println("   • Test the complete booking flow");
            System.out.println("   • See realistic seat availability");
            System.out.println("");

        } catch (Exception e) {
            System.err.println("Could not print data summary: " + e.getMessage());
        }
    }

    /**
     * Method to manually reinitialize data (for development/testing)
     * Call this if you want to reload the mock data
     */
    public void reinitializeData() {
        System.out.println("🔄 Reinitializing mock data...");

        try {
            // Clear existing data in correct order
            jdbcTemplate.execute("DELETE FROM bookings");
            jdbcTemplate.execute("DELETE FROM showtimes");
            jdbcTemplate.execute("DELETE FROM reviews");
            jdbcTemplate.execute("DELETE FROM theaters");
            jdbcTemplate.execute("DELETE FROM movies");

            // Reset auto-increment counters
            try {
                jdbcTemplate.execute("ALTER TABLE movies AUTO_INCREMENT = 1");
                jdbcTemplate.execute("ALTER TABLE theaters AUTO_INCREMENT = 1");
                jdbcTemplate.execute("ALTER TABLE showtimes AUTO_INCREMENT = 1");
                jdbcTemplate.execute("ALTER TABLE bookings AUTO_INCREMENT = 1");
                jdbcTemplate.execute("ALTER TABLE reviews AUTO_INCREMENT = 1");
            } catch (Exception autoIncrementError) {
                // For PostgreSQL, use different syntax
                jdbcTemplate.execute("ALTER SEQUENCE movies_id_seq RESTART WITH 1");
                jdbcTemplate.execute("ALTER SEQUENCE theaters_id_seq RESTART WITH 1");
                jdbcTemplate.execute("ALTER SEQUENCE showtimes_id_seq RESTART WITH 1");
                jdbcTemplate.execute("ALTER SEQUENCE bookings_id_seq RESTART WITH 1");
                jdbcTemplate.execute("ALTER SEQUENCE reviews_id_seq RESTART WITH 1");
            }

            // Load fresh data
            loadFromSqlFile();
            System.out.println("✅ Data reinitialized successfully!");
            printDataSummary();
            seedEmbeddingsIfEnabled();

        } catch (Exception e) {
            throw new RuntimeException("Failed to reinitialize data", e);
        }
    }

    private void seedEmbeddingsIfEnabled() {
        if (!aiProperties.isSeedMovieEmbeddingsOnStartup()) {
            System.out.println("⏭️ Skipping Java embedding seeding (app.ai.seed-movie-embeddings-on-startup=false)");
            return;
        }

        try {
            System.out.println("🧠 Seeding movie embeddings via Java service...");
            movieEmbeddingService.generateEmbeddingsForAllMovies();
            System.out.println("✅ Java embedding seeding completed.");
        } catch (Exception e) {
            System.err.println("❌ Java embedding seeding failed: " + e.getMessage());
        }
    }
}
