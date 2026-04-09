package com.example.cinema.service;

import com.example.cinema.entity.Movie;
import com.example.cinema.entity.UserGenrePreference;
import com.example.cinema.entity.FavoriteMovie;
import com.example.cinema.repository.MovieRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Recommendation Service - Smart Movie Recommendations
 *
 * ─────────────────────────────────────────────────────────────────────
 * CACHE CHỈ ĐƯỢC ĐẶT Ở 2 ĐIỂM DUY NHẤT CÓ GỌI OPENAI:
 *
 *   1. getAIPersonalizedRecommendations()
 *      → bên trong gọi generateUserPreferenceEmbedding() → OpenAI API
 *      → cache theo (userId, prefVersion, favVersion) tự miss khi sở thích đổi
 *
 *   2. semanticMovieSearch()
 *      → bên trong gọi generateEmbedding(query) → OpenAI API
 *      → cache theo (query, date) tự miss sang ngày mới
 *
 * ─────────────────────────────────────────────────────────────────────
 * KHÔNG cache:
 *   - getPersonalizedRecommendations()  → chỉ query DB
 *   - getSimilarToFavorites()           → chỉ query DB
 *   - getRecommendationsByGenre()       → chỉ query DB
 *   - findSimilarMovies()               → đọc embedding từ DB + tính cosine (CPU, không token)
 *
 * Lý do: cache DB query thêm complexity mà gain không đáng, DB đã có index.
 * ─────────────────────────────────────────────────────────────────────
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
    private final VectorStore vectorStore;

    /**
     * Get personalized movie recommendations for user
     * Không cache - chỉ query DB, không tốn token AI
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
     * Không cache - chỉ query DB, không tốn token AI
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
     * Không cache - chỉ query DB, không tốn token AI
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
     *
     * KHÔNG cache method này vì:
     *   - Bên trong đã gọi generateUserPreferenceEmbedding() - method đó đã cache embedding
     *   - Nếu cache outer result thì khi user đổi preference:
     *       embedding cache → miss (key đổi) → OpenAI gọi lại ✅
     *       nhưng outer result cache → vẫn HIT → user thấy recommendation CŨ ❌
     *
     * Chi phí thực sự là OpenAI call trong generateUserPreferenceEmbedding().
     * Method đó đã được cache với key (userId, prefVersion, favVersion).
     * → Phần tính toán similarity (CPU) chạy lại mỗi request là chấp nhận được.
     */
    public RecommendationResponse getAIPersonalizedRecommendations(Long userId, int limit) {
        try {
            List<UserGenrePreference> preferences = genrePreferenceService.getUserGenrePreferences(userId);
            List<FavoriteMovie> favorites = favoriteMovieService.getAllUserFavorites(userId);

            if (preferences.isEmpty()) {
                return getDefaultRecommendations(limit, "New user - showing popular movies");
            }

            List<String> preferredGenres = preferences.stream()
                    .filter(p -> p.getPreferenceScore() >= 3)
                    .map(UserGenrePreference::getGenre)
                    .collect(Collectors.toList());

            List<String> favoriteMovieTitles = favorites.stream()
                    .map(fm -> fm.getMovie().getTitle())
                    .collect(Collectors.toList());

            // Build preference text → VectorStore generates embedding and searches internally
            String preferenceText = EmbeddingService.buildUserPreferenceText(preferredGenres, favoriteMovieTitles);

            List<Document> docs = vectorStore.similaritySearch(
                SearchRequest.builder()
                    .query(preferenceText)
                    .topK(limit * 2)
                    .similarityThreshold(0.65)
                    .build());

            if (docs.size() < Math.min(2, limit * 2)) {
                docs = vectorStore.similaritySearch(
                    SearchRequest.builder()
                        .query(preferenceText)
                        .topK(limit * 2)
                        .similarityThreshold(0.5)
                        .build());
            }

            Set<Long> favoriteMovieIds = favorites.stream()
                    .map(fm -> fm.getMovie().getId())
                    .collect(Collectors.toSet());

            List<Long> movieIds = docs.stream()
                    .map(d -> Long.parseLong(d.getMetadata().get("movieId").toString()))
                    .filter(id -> !favoriteMovieIds.contains(id))
                    .limit(limit)
                    .collect(Collectors.toList());

            List<Movie> recommendations = movieRepository.findAllById(movieIds);

            if (!recommendations.isEmpty()) {
                return new RecommendationResponse(
                        "AI-Powered Recommendations",
                        recommendations,
                        List.of("Based on AI analysis of your movie preferences"),
                        RecommendationType.AI_PERSONALIZED
                );
            }

        } catch (Exception e) {
            System.err.println("AI recommendation failed: " + e.getMessage());
        }

        return new RecommendationResponse("", List.of(), List.of(), RecommendationType.AI_PERSONALIZED);
    }

    /**
     * Find movies similar to a specific movie using AI embeddings
     * Không cache - đọc embedding từ DB (đã lưu sẵn) + tính cosine in-memory
     * Không gọi OpenAI → không tốn token
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
     *
     * KHÔNG cache method này vì:
     *   - generateEmbedding(query) bên trong sẽ được cache trực tiếp ở EmbeddingService
     *   - Nếu cache outer result với key có date → mỗi ngày tất cả query đều miss
     *     dù embedding của query không đổi → lãng phí
     *   - Phần tính cosine similarity (CPU) rất nhanh, không cần cache
     *
     * Chi phí thực sự là OpenAI call trong generateEmbedding(query).
     * → Cache đặt tại generateEmbedding() với key = hash(query text).
     */
    public RecommendationResponse semanticMovieSearch(String query, int limit) {
        try {
            // VectorStore generates embedding for query and executes native pgvector <=> search
            List<Document> docs = vectorStore.similaritySearch(
                SearchRequest.builder()
                    .query(query)
                    .topK(limit)
                    .similarityThreshold(0.6)
                    .build());

            if (docs.size() < Math.min(3, limit)) {
                docs = vectorStore.similaritySearch(
                    SearchRequest.builder()
                        .query(query)
                        .topK(limit)
                        .similarityThreshold(0.4)
                        .build());
            }

            List<Long> movieIds = docs.stream()
                    .map(d -> Long.parseLong(d.getMetadata().get("movieId").toString()))
                    .collect(Collectors.toList());

            List<Movie> searchResults = movieRepository.findAllById(movieIds);

            return new RecommendationResponse(
                    "Search Results for: \"" + query + "\"",
                    searchResults,
                    List.of("AI semantic search results (" + searchResults.size() + " matches)"),
                    RecommendationType.AI_PERSONALIZED
            );

        } catch (Exception e) {
            System.err.println("Semantic search failed: " + e.getMessage());
            return new RecommendationResponse("Search Results", List.of(),
                    List.of("Search failed: " + e.getMessage()), RecommendationType.AI_PERSONALIZED);
        }
    }
}
