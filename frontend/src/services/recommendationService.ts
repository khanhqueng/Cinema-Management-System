import api from './api';
import { Movie } from '../types';

export interface RecommendationResponse {
  title: string;
  movies: Movie[];
  reasons: string[];
  type: string;
}

export interface RecommendationSection {
  title: string;
  movies: Movie[];
  description: string;
}

export interface MixedRecommendationResponse {
  sections: RecommendationSection[];
}

export const recommendationService = {
  /**
   * Get personalized movie recommendations for the current user
   */
  async getPersonalizedRecommendations(limit: number = 12): Promise<RecommendationResponse> {
    const response = await api.get('/recommendations/personalized', {
      params: { limit }
    });
    return response.data;
  },

  /**
   * Get movies similar to user's favorites
   */
  async getSimilarToFavorites(limit: number = 12): Promise<RecommendationResponse> {
    const response = await api.get('/recommendations/similar-to-favorites', {
      params: { limit }
    });
    return response.data;
  },

  /**
   * Get recommendations for new users (trending/popular)
   */
  async getNewUserRecommendations(limit: number = 12): Promise<RecommendationResponse> {
    const response = await api.get('/recommendations/new-user', {
      params: { limit }
    });
    return response.data;
  },

  /**
   * Get recommendations by genre
   */
  async getRecommendationsByGenre(genre: string, limit: number = 12): Promise<RecommendationResponse> {
    const response = await api.get(`/recommendations/by-genre/${encodeURIComponent(genre)}`, {
      params: { limit }
    });
    return response.data;
  },

  /**
   * Get mixed recommendations with multiple sections
   */
  async getMixedRecommendations(limit: number = 15): Promise<MixedRecommendationResponse> {
    const response = await api.get('/recommendations/mixed', {
      params: { limit }
    });
    return response.data;
  },

  /**
   * AI-powered personalized recommendations using vector similarity
   */
  async getAIPersonalizedRecommendations(limit: number = 12): Promise<RecommendationResponse> {
    const response = await api.get('/recommendations/ai-personalized', {
      params: { limit }
    });
    return response.data;
  },

  /**
   * Find movies similar to a specific movie using AI embeddings
   */
  async findSimilarMovies(movieId: number, limit: number = 12): Promise<RecommendationResponse> {
    const response = await api.get(`/recommendations/similar-movies/${movieId}`, {
      params: { limit }
    });
    return response.data;
  },

  /**
   * Semantic search for movies using natural language queries
   */
  async semanticMovieSearch(query: string, limit: number = 12): Promise<RecommendationResponse> {
    const response = await api.get('/recommendations/semantic-search', {
      params: { query, limit }
    });
    return response.data;
  }
};