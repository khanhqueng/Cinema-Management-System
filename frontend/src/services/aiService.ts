import api from './api';
import { Movie } from '../types';

// Types for AI recommendation responses
export interface AIRecommendationResponse {
  title: string;
  movies: Movie[];
  reasons: string[];
  type: string;
}

export interface MixedRecommendationResponse {
  sections: RecommendationSection[];
}

export interface RecommendationSection {
  title: string;
  movies: Movie[];
  description: string;
}

export interface EmbeddingStats {
  totalMovies: number;
  moviesWithEmbeddings: number;
  moviesWithoutEmbeddings: number;
  embeddingCoverage: number;
}

/**
 * AI Service - Handles AI-powered movie features
 * Provides semantic search, AI recommendations, and embedding management
 */
class AIService {

  /**
   * Semantic search for movies using natural language
   * @param query Natural language search query (e.g., "action movies with superheroes")
   * @param limit Number of results to return
   */
  async semanticSearch(query: string, limit: number = 10): Promise<AIRecommendationResponse> {
    try {
      const response = await api.get(`/ai/search`, {
        params: { query, limit }
      });
      return response.data;
    } catch (error) {
      console.error('Semantic search failed:', error);
      throw error;
    }
  }

  /**
   * Get AI-powered personalized recommendations
   * @param userId User ID
   * @param limit Number of recommendations
   */
  async getPersonalizedRecommendations(userId: number, limit: number = 10): Promise<AIRecommendationResponse> {
    try {
      const response = await api.get(`/ai/recommendations/personalized`, {
        params: { userId, limit }
      });
      return response.data;
    } catch (error) {
      console.error('AI personalized recommendations failed:', error);
      throw error;
    }
  }

  /**
   * Find movies similar to a specific movie using AI
   * @param movieId Target movie ID
   * @param limit Number of similar movies
   */
  async findSimilarMovies(movieId: number, limit: number = 8): Promise<AIRecommendationResponse> {
    try {
      const response = await api.get(`/ai/movies/${movieId}/similar`, {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      console.error('Find similar movies failed:', error);
      throw error;
    }
  }

  /**
   * Get enhanced recommendations (with AI option)
   * @param limit Number of recommendations
   * @param useAI Whether to use AI-powered recommendations
   */
  async getEnhancedRecommendations(limit: number = 10, useAI: boolean = true): Promise<AIRecommendationResponse> {
    try {
      const response = await api.get(`/recommendations/for-me`, {
        params: { limit, useAI }
      });
      return response.data;
    } catch (error) {
      console.error('Enhanced recommendations failed:', error);
      throw error;
    }
  }

  /**
   * Get mixed AI recommendations with multiple sections
   * @param userId User ID
   * @param limit Total number of recommendations across all sections
   */
  async getMixedRecommendations(userId: number, limit: number = 20): Promise<MixedRecommendationResponse> {
    try {
      const response = await api.get(`/ai/recommendations/mixed`, {
        params: { userId, limit }
      });
      return response.data;
    } catch (error) {
      console.error('Mixed AI recommendations failed:', error);
      throw error;
    }
  }

  /**
   * Get homepage recommendations (mixed format)
   */
  async getHomepageRecommendations(): Promise<MixedRecommendationResponse> {
    try {
      const response = await api.get(`/recommendations/homepage`);
      return response.data;
    } catch (error) {
      console.error('Homepage recommendations failed:', error);
      throw error;
    }
  }

  // Admin-only functions
  /**
   * Generate embedding for a specific movie (Admin only)
   * @param movieId Movie ID
   */
  async generateMovieEmbedding(movieId: number): Promise<string> {
    try {
      const response = await api.post(`/ai/movies/${movieId}/embedding`);
      return response.data;
    } catch (error) {
      console.error('Generate movie embedding failed:', error);
      throw error;
    }
  }

  /**
   * Batch generate embeddings for all movies (Admin only)
   */
  async generateAllEmbeddings(): Promise<string> {
    try {
      const response = await api.post(`/ai/movies/embeddings/batch`);
      return response.data;
    } catch (error) {
      console.error('Batch generate embeddings failed:', error);
      throw error;
    }
  }

  /**
   * Get embedding statistics (Admin only)
   */
  async getEmbeddingStats(): Promise<EmbeddingStats> {
    try {
      const response = await api.get(`/ai/embeddings/stats`);
      return response.data;
    } catch (error) {
      console.error('Get embedding stats failed:', error);
      throw error;
    }
  }
}

export const aiService = new AIService();
export default aiService;