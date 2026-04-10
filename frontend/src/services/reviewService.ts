import api from "./api";
import type {
  CreateReviewPayload,
  MovieRatingStats,
  PageResponse,
  Review,
  UpdateReviewPayload,
} from "../types";

export const reviewService = {
  async getReviewsForMovie(
    movieId: number,
    page = 0,
    size = 10,
  ): Promise<PageResponse<Review>> {
    const response = await api.get(`/reviews/movie/${movieId}`, {
      params: { page, size },
    });
    return response.data;
  },

  async getMovieRatingStats(movieId: number): Promise<MovieRatingStats> {
    const response = await api.get(`/reviews/movie/${movieId}/stats`);
    return response.data;
  },

  async createReview(payload: CreateReviewPayload): Promise<Review> {
    const response = await api.post("/reviews", {
      movieId: payload.movieId,
      rating: payload.rating,
      reviewText: payload.reviewText ?? null,
    });
    return response.data;
  },

  async updateReview(
    reviewId: number,
    payload: UpdateReviewPayload,
  ): Promise<Review> {
    const body: Record<string, unknown> = {};
    if (payload.rating != null) body.rating = payload.rating;
    if (payload.reviewText !== undefined) body.reviewText = payload.reviewText;
    const response = await api.put(`/reviews/${reviewId}`, body);
    return response.data;
  },

  async deleteReview(reviewId: number): Promise<void> {
    await api.delete(`/reviews/${reviewId}`);
  },

  async getMyReviews(page = 0, size = 50): Promise<PageResponse<Review>> {
    const response = await api.get("/reviews/my-reviews", {
      params: { page, size },
    });
    return response.data;
  },

  /** Scan paginated movie reviews until the current user’s review is found. */
  async findMyReviewForMovie(
    movieId: number,
    myUserId: number,
    maxPages = 20,
    pageSize = 20,
  ): Promise<Review | null> {
    for (let page = 0; page < maxPages; page++) {
      const res = await this.getReviewsForMovie(movieId, page, pageSize);
      const mine = res.content.find((r) => r.user?.id === myUserId);
      if (mine) return mine;
      if (res.last) break;
    }
    return null;
  },
};
