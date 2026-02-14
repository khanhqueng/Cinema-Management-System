package com.example.cinema.service;

import com.example.cinema.entity.Movie;
import com.example.cinema.entity.UserGenrePreference;
import com.example.cinema.entity.FavoriteMovie;
import com.example.cinema.repository.MovieRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Recommendation Service - Smart Movie Recommendations
 * Provides personalized movie recommendations based on user preferences and behavior
 */
@Service
@RequiredArgsConstructor
public class RecommendationService {

    private final MovieService movieService;
    private final UserGenrePreferenceService genrePreferenceService;
    private final FavoriteMovieService favoriteMovieService;
    private final MovieRepository movieRepository;
    private final EmbeddingService embeddingService;
    private final MovieEmbeddingService movieEmbeddingService;

    /**
     * Get personalized movie recommendations for user
     */
    public RecommendationResponse getPersonalizedRecommendations(Long userId, int limit) {
        List<Movie> recommendations = new ArrayList<>();
        List<String> reasonsList = new ArrayList<>();

        // Get user's genre preferences
        List<UserGenrePreference> preferences = genrePreferenceService.getUserGenrePreferences(userId);

        if (preferences.isEmpty()) {
            // New user - return trending/popular movies
            return getDefaultRecommendations(limit, "New user - showing popular movies");
        }

        // Get user's top preferred genres
        List<String> topGenres = preferences.stream()
                .filter(p -> p.getPreferenceScore() >= 4)
                .map(UserGenrePreference::getGenre)
                .limit(3)
                .collect(Collectors.toList());

        // Get recommendations based on preferred genres
        for (String genre : topGenres) {
            List<Movie> genreMovies = movieRepository.findByGenreIgnoreCase(genre, PageRequest.of(0, 5)).getContent();

            recommendations.addAll(genreMovies.stream().limit(3).collect(Collectors.toList()));
            if (!genreMovies.isEmpty()) {
                reasonsList.add("Based on your love for " + genre + " movies");
            }
        }

        // Add popular movies from favorite genres
        List<Movie> popularInFavoriteGenres = getPopularMoviesFromGenres(topGenres, 5);
        recommendations.addAll(popularInFavoriteGenres);
        if (!popularInFavoriteGenres.isEmpty()) {
            reasonsList.add("Popular movies in your favorite genres");
        }

        // Remove duplicates and limit
        recommendations = recommendations.stream()
                .distinct()
                .limit(limit)
                .collect(Collectors.toList());

        // If not enough recommendations, fill with trending movies
        if (recommendations.size() < limit) {
            List<Movie> trending = movieService.getPopularMovies(PageRequest.of(0, limit - recommendations.size())).getContent();
            recommendations.addAll(trending);
            reasonsList.add("Trending movies to discover");
        }

        return new RecommendationResponse(
                "Personalized Recommendations",
                recommendations.stream().limit(limit).collect(Collectors.toList()),
                reasonsList,
                RecommendationType.PERSONALIZED
        );
    }

    /**
     * Get similar movies based on user's favorites
     */
    public RecommendationResponse getSimilarToFavorites(Long userId, int limit) {
        List<FavoriteMovie> userFavorites = favoriteMovieService.getAllUserFavorites(userId);

        if (userFavorites.isEmpty()) {
            return getDefaultRecommendations(limit, "No favorites yet - showing popular movies");
        }

        // Get genres from favorite movies
        Map<String, Long> favoriteGenres = userFavorites.stream()
                .collect(Collectors.groupingBy(
                    fm -> fm.getMovie().getGenre(),
                    Collectors.counting()
                ));

        // Get similar movies from favorite genres
        List<Movie> similarMovies = new ArrayList<>();
        List<Long> favoriteMovieIds = userFavorites.stream()
                .map(fm -> fm.getMovie().getId())
                .collect(Collectors.toList());

        for (Map.Entry<String, Long> entry : favoriteGenres.entrySet()) {
            String genre = entry.getKey();
            List<Movie> genreMovies = movieRepository.findByGenreIgnoreCase(genre, PageRequest.of(0, 8))
                    .getContent()
                    .stream()
                    .filter(movie -> !favoriteMovieIds.contains(movie.getId()))
                    .limit(4)
                    .collect(Collectors.toList());

            similarMovies.addAll(genreMovies);
        }

        return new RecommendationResponse(
                "Similar to Your Favorites",
                similarMovies.stream().distinct().limit(limit).collect(Collectors.toList()),
                List.of("Based on movies you've favorited"),
                RecommendationType.SIMILAR_TO_FAVORITES
        );
    }

    /**
     * Get recommendations for new users
     */
    public RecommendationResponse getNewUserRecommendations(int limit) {
        List<Movie> recommendations = new ArrayList<>();

        // Get trending movies
        List<Movie> trending = movieService.getPopularMovies(PageRequest.of(0, limit / 3)).getContent();
        recommendations.addAll(trending);

        // Get currently showing movies
        List<Movie> currentlyShowing = movieService.getCurrentlyShowingMovies(PageRequest.of(0, limit / 3)).getContent();
        recommendations.addAll(currentlyShowing);

        // Get new releases
        List<Movie> newReleases = movieService.getUpcomingMovies(PageRequest.of(0, limit / 3)).getContent();
        recommendations.addAll(newReleases);

        return new RecommendationResponse(
                "Discover Great Movies",
                recommendations.stream().distinct().limit(limit).collect(Collectors.toList()),
                List.of("Popular movies", "Currently showing", "New releases"),
                RecommendationType.FOR_NEW_USERS
        );
    }

    /**
     * Get recommendations by genre
     */
    public RecommendationResponse getRecommendationsByGenre(String genre, int limit) {
        List<Movie> movies = movieRepository.findByGenreIgnoreCase(genre, PageRequest.of(0, limit)).getContent();

        return new RecommendationResponse(
                "Best " + genre + " Movies",
                movies,
                List.of("Movies in " + genre + " genre"),
                RecommendationType.BY_GENRE
        );
    }

    /**
     * Get mixed recommendations combining multiple strategies
     */
    public MixedRecommendationResponse getMixedRecommendations(Long userId, int limit) {
        List<RecommendationSection> sections = new ArrayList<>();

        // Personalized recommendations
        RecommendationResponse personalized = getPersonalizedRecommendations(userId, limit / 3);
        if (!personalized.movies().isEmpty()) {
            sections.add(new RecommendationSection(
                    "For You",
                    personalized.movies().stream().limit(5).collect(Collectors.toList()),
                    "Based on your preferences"
            ));
        }

        // Similar to favorites
        RecommendationResponse similar = getSimilarToFavorites(userId, limit / 3);
        if (!similar.movies().isEmpty()) {
            sections.add(new RecommendationSection(
                    "More Like Your Favorites",
                    similar.movies().stream().limit(5).collect(Collectors.toList()),
                    "Similar to movies you've favorited"
            ));
        }

        // Trending/Popular
        List<Movie> trending = movieService.getPopularMovies(PageRequest.of(0, 8)).getContent();
        sections.add(new RecommendationSection(
                "Trending Now",
                trending.stream().limit(5).collect(Collectors.toList()),
                "Popular movies everyone's watching"
        ));

        // Currently showing
        List<Movie> currentlyShowing = movieService.getCurrentlyShowingMovies(PageRequest.of(0, 8)).getContent();
        sections.add(new RecommendationSection(
                "In Theaters Now",
                currentlyShowing.stream().limit(5).collect(Collectors.toList()),
                "Movies currently playing"
        ));

        return new MixedRecommendationResponse(sections);
    }

    /**
     * Get default recommendations for users without preferences
     */
    private RecommendationResponse getDefaultRecommendations(int limit, String reason) {
        List<Movie> movies = movieService.getPopularMovies(PageRequest.of(0, limit)).getContent();
        return new RecommendationResponse(
                "Popular Movies",
                movies,
                List.of(reason),
                RecommendationType.POPULAR
        );
    }

    /**
     * Get popular movies from specific genres
     */
    private List<Movie> getPopularMoviesFromGenres(List<String> genres, int limit) {
        List<Movie> movies = new ArrayList<>();
        int moviesPerGenre = Math.max(1, limit / genres.size());

        for (String genre : genres) {
            List<Movie> genreMovies = movieRepository.findByGenreIgnoreCase(genre, PageRequest.of(0, moviesPerGenre))
                    .getContent();
            movies.addAll(genreMovies);
        }

        return movies.stream().distinct().limit(limit).collect(Collectors.toList());
    }

    // DTOs
    public record RecommendationResponse(
            String title,
            List<Movie> movies,
            List<String> reasons,
            RecommendationType type
    ) {}

    public record MixedRecommendationResponse(List<RecommendationSection> sections) {}

    public record RecommendationSection(String title, List<Movie> movies, String description) {}

    public enum RecommendationType {
        PERSONALIZED,
        SIMILAR_TO_FAVORITES,
        BY_GENRE,
        FOR_NEW_USERS,
        POPULAR,
        TRENDING,
        AI_PERSONALIZED,
        AI_SIMILAR_MOVIES
    }

    // ================================
    // AI-POWERED RECOMMENDATION METHODS
    // ================================

    /**
     * AI-powered recommendations using vector similarity
     */
    public RecommendationResponse getAIPersonalizedRecommendations(Long userId, int limit) {
        try {
            // Get user's genre preferences and favorite movies
            List<UserGenrePreference> preferences = genrePreferenceService.getUserGenrePreferences(userId);
            List<FavoriteMovie> favorites = favoriteMovieService.getAllUserFavorites(userId);

            if (preferences.isEmpty()) {
                return getDefaultRecommendations(limit, "New user - showing popular movies");
            }

            // Extract user's preferred genres and favorite movie titles
            List<String> preferredGenres = preferences.stream()
                    .filter(p -> p.getPreferenceScore() >= 3)
                    .map(UserGenrePreference::getGenre)
                    .collect(Collectors.toList());

            List<String> favoriteMovieTitles = favorites.stream()
                    .map(fm -> fm.getMovie().getTitle())
                    .collect(Collectors.toList());

            // Generate user preference embedding
            List<Double> userPreferenceEmbedding = embeddingService.generateUserPreferenceEmbedding(
                    preferredGenres, favoriteMovieTitles);

            // Convert to float array and search for similar movies
            float[] userEmbeddingArray = embeddingService.convertToFloatArray(userPreferenceEmbedding);

            // Find similar movies using in-memory calculation (fallback approach)
            List<Long> movieIdsWithEmbeddings = movieRepository.findMovieIdsWithEmbeddings();
            List<Movie> moviesWithEmbeddings = movieRepository.findAllById(movieIdsWithEmbeddings);

            // If no movies with embeddings, return empty
            if (moviesWithEmbeddings.isEmpty()) {
                return new RecommendationResponse("AI-Powered Recommendations", List.of(),
                    List.of("No movies with embeddings available"), RecommendationType.AI_PERSONALIZED);
            }

            // Calculate similarities and get top matches
            List<Movie> similarMovies = calculateSimilarMovies(userPreferenceEmbedding, moviesWithEmbeddings, limit * 2);

            // Remove user's favorite movies from recommendations
            Set<Long> favoriteMovieIds = favorites.stream()
                    .map(fm -> fm.getMovie().getId())
                    .collect(Collectors.toSet());

            List<Movie> filteredRecommendations = similarMovies.stream()
                    .filter(movie -> !favoriteMovieIds.contains(movie.getId()))
                    .limit(limit)
                    .collect(Collectors.toList());

            if (!filteredRecommendations.isEmpty()) {
                return new RecommendationResponse(
                        "AI-Powered Recommendations",
                        filteredRecommendations,
                        List.of("Based on AI analysis of your movie preferences"),
                        RecommendationType.AI_PERSONALIZED
                );
            }

        } catch (Exception e) {
            // Log error but don't fail - fallback to traditional recommendations
            System.err.println("AI recommendation failed, falling back to traditional: " + e.getMessage());
        }

        return new RecommendationResponse("", List.of(), List.of(), RecommendationType.AI_PERSONALIZED);
    }

    /**
     * Find movies similar to a specific movie using AI embeddings
     */
    public RecommendationResponse findSimilarMovies(Long movieId, int limit) {
        try {
            Movie targetMovie = movieRepository.findById(movieId)
                    .orElseThrow(() -> new RuntimeException("Movie not found with ID: " + movieId));

            if (!movieEmbeddingService.hasEmbedding(targetMovie)) {
                // Generate embedding if not exists
                targetMovie = movieEmbeddingService.generateAndSaveMovieEmbedding(targetMovie);
            }

            List<Movie> similarMovies = movieEmbeddingService.findSimilarMovies(targetMovie, 0.6, limit + 1);

            // Remove the target movie itself from results
            List<Movie> filteredSimilarMovies = similarMovies.stream()
                    .filter(movie -> !movie.getId().equals(movieId))
                    .limit(limit)
                    .collect(Collectors.toList());

            return new RecommendationResponse(
                    "Similar to " + targetMovie.getTitle(),
                    filteredSimilarMovies,
                    List.of("Based on AI analysis of movie content and characteristics"),
                    RecommendationType.AI_SIMILAR_MOVIES
            );

        } catch (Exception e) {
            System.err.println("Failed to find similar movies: " + e.getMessage());
            return new RecommendationResponse("Similar Movies", List.of(), List.of(), RecommendationType.AI_SIMILAR_MOVIES);
        }
    }

    /**
     * Semantic search for movies using natural language queries
     */
    public RecommendationResponse semanticMovieSearch(String query, int limit) {
        try {
            // Generate embedding for the search query
            List<Double> queryEmbedding = embeddingService.generateEmbedding(query);

            // Get movies that have embeddings - now simplified since embedding is String
            List<Movie> moviesWithEmbeddings = movieRepository.findAllById(
                movieRepository.findMovieIdsWithEmbeddings()
            );

            if (moviesWithEmbeddings.isEmpty()) {
                System.err.println("No movies with embeddings found");
                return new RecommendationResponse(
                        "Search Results for: \"" + query + "\"",
                        List.of(),
                        List.of("No movies with embeddings available"),
                        RecommendationType.AI_PERSONALIZED
                );
            }

            System.out.println("Found movies with embeddings: " + moviesWithEmbeddings.size());

            // Calculate similarity scores and sort
            List<MovieSimilarityResult> similarityResults = new ArrayList<>();

            for (Movie movie : moviesWithEmbeddings) {
                try {
                    // Parse movie's embedding string directly
                    List<Double> movieEmbedding = parseVectorText(movie.getEmbedding());
                    if (movieEmbedding.isEmpty()) continue;

                    double similarity = embeddingService.calculateCosineSimilarity(queryEmbedding, movieEmbedding);
                    similarityResults.add(new MovieSimilarityResult(movie, similarity));
                } catch (Exception e) {
                    // Skip movies with invalid embeddings
                    System.err.println("Failed to process embedding for movie " + movie.getId() + ": " + e.getMessage());
                    continue;
                }
            }

            // Debug logging
            System.out.println("Total similarity results calculated: " + similarityResults.size());
            if (!similarityResults.isEmpty()) {
                double maxSim = similarityResults.stream().mapToDouble(r -> r.similarity).max().orElse(0.0);
                double minSim = similarityResults.stream().mapToDouble(r -> r.similarity).min().orElse(0.0);
                System.out.println("Similarity range: " + minSim + " to " + maxSim);
            }

            // Sort by similarity (highest first) and take top results with improved threshold
            double primaryThreshold = 0.6; // High quality results
            double fallbackThreshold = 0.4; // Fallback if not enough results

            List<Movie> searchResults = similarityResults.stream()
                    .filter(result -> result.similarity > primaryThreshold)
                    .sorted((a, b) -> Double.compare(b.similarity, a.similarity))
                    .limit(limit)
                    .map(result -> result.movie)
                    .collect(Collectors.toList());

            // Fallback: if not enough high-quality results, use lower threshold
            if (searchResults.size() < Math.min(3, limit) && !similarityResults.isEmpty()) {
                searchResults = similarityResults.stream()
                        .filter(result -> result.similarity > fallbackThreshold)
                        .sorted((a, b) -> Double.compare(b.similarity, a.similarity))
                        .limit(limit)
                        .map(result -> result.movie)
                        .collect(Collectors.toList());

                System.out.println("Used fallback threshold " + fallbackThreshold + " - Results: " + searchResults.size());
            } else {
                System.out.println("Results with primary threshold " + primaryThreshold + ": " + searchResults.size());
            }

            return new RecommendationResponse(
                    "Search Results for: \"" + query + "\"",
                    searchResults,
                    List.of("AI semantic search results (" + searchResults.size() + " matches)"),
                    RecommendationType.AI_PERSONALIZED
            );

        } catch (Exception e) {
            System.err.println("Semantic search failed: " + e.getMessage());
            e.printStackTrace();
            return new RecommendationResponse("Search Results", List.of(),
                    List.of("Search failed: " + e.getMessage()), RecommendationType.AI_PERSONALIZED);
        }
    }

    // Helper class for similarity calculation
    private static class MovieSimilarityResult {
        Movie movie;
        double similarity;

        MovieSimilarityResult(Movie movie, double similarity) {
            this.movie = movie;
            this.similarity = similarity;
        }
    }


    /**
     * Calculate similar movies using in-memory cosine similarity
     */
    private List<Movie> calculateSimilarMovies(List<Double> queryEmbedding, List<Movie> movies, int limit) {
        List<MovieSimilarityResult> similarityResults = new ArrayList<>();

        for (Movie movie : movies) {
            try {
                List<Double> movieEmbedding = parseVectorText(movie.getEmbedding());
                double similarity = embeddingService.calculateCosineSimilarity(queryEmbedding, movieEmbedding);
                similarityResults.add(new MovieSimilarityResult(movie, similarity));
            } catch (Exception e) {
                // Skip movies with invalid embeddings
                continue;
            }
        }

        // Improved thresholds for similar movies
        double primaryThreshold = 0.65; // High quality similar movies
        double fallbackThreshold = 0.5; // Fallback threshold

        List<Movie> results = similarityResults.stream()
                .filter(result -> result.similarity > primaryThreshold)
                .sorted((a, b) -> Double.compare(b.similarity, a.similarity))
                .limit(limit)
                .map(result -> result.movie)
                .collect(Collectors.toList());

        // Fallback if not enough results
        if (results.size() < Math.min(2, limit) && !similarityResults.isEmpty()) {
            results = similarityResults.stream()
                    .filter(result -> result.similarity > fallbackThreshold)
                    .sorted((a, b) -> Double.compare(b.similarity, a.similarity))
                    .limit(limit)
                    .map(result -> result.movie)
                    .collect(Collectors.toList());

            System.out.println("Similar movies - used fallback threshold: " + fallbackThreshold);
        } else {
            System.out.println("Similar movies - used primary threshold: " + primaryThreshold);
        }

        return results;
    }


    /**
     * Parse pgvector text format [1.0,2.0,3.0,...] to List<Double>
     */
    private List<Double> parseVectorText(String vectorText) {
        if (vectorText == null || vectorText.trim().isEmpty()) {
            return new ArrayList<>();
        }

        // Remove brackets and split by comma
        String cleanText = vectorText.trim();
        if (cleanText.startsWith("[") && cleanText.endsWith("]")) {
            cleanText = cleanText.substring(1, cleanText.length() - 1);
        }

        List<Double> result = new ArrayList<>();
        String[] values = cleanText.split(",");

        for (String value : values) {
            try {
                result.add(Double.parseDouble(value.trim()));
            } catch (NumberFormatException e) {
                // Skip invalid values
                System.err.println("Invalid vector value: " + value);
            }
        }

        return result;
    }
}