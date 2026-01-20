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
        TRENDING
    }
}