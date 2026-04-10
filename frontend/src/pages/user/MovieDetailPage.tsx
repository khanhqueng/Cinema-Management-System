import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "motion/react";
import {
  Calendar,
  Clock,
  Star,
  Play,
  ArrowLeft,
  User,
  Tag,
  DollarSign,
  Loader2,
  MessageSquare,
  Pencil,
  Trash2,
} from "lucide-react";

import { movieService } from "../../services/movieService";
import { reviewService } from "../../services/reviewService";
import { authService } from "../../services/authService";
import { Movie, Review } from "../../types";

import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Textarea } from "../../components/ui/textarea";
import { Alert, AlertDescription } from "../../components/ui/alert";

const REVIEW_PAGE_SIZE = 10;

function parseApiError(err: unknown): string {
  if (err && typeof err === "object" && "response" in err) {
    const data = (err as { response?: { data?: unknown } }).response?.data;
    if (typeof data === "string") return data;
    if (data && typeof data === "object" && "message" in data) {
      return String((data as { message: string }).message);
    }
  }
  return "Something went wrong. Please try again.";
}

const MovieDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const movieId = id ? parseInt(id, 10) : NaN;

  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsPage, setReviewsPage] = useState(0);
  const [reviewsHasMore, setReviewsHasMore] = useState(false);
  const [reviewsLoadingMore, setReviewsLoadingMore] = useState(false);

  const [myReview, setMyReview] = useState<Review | null>(null);
  const [formRating, setFormRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [formText, setFormText] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  const refreshMovie = useCallback(async () => {
    if (!Number.isFinite(movieId)) return;
    try {
      const data = await movieService.getMovieByIdEnhanced(movieId);
      setMovie(data);
    } catch (e) {
      console.error(e);
    }
  }, [movieId]);

  const loadReviewsInitial = useCallback(async () => {
    if (!Number.isFinite(movieId)) return;
    setReviewsLoading(true);
    try {
      const page = await reviewService.getReviewsForMovie(
        movieId,
        0,
        REVIEW_PAGE_SIZE,
      );
      setReviews(page.content);
      setReviewsPage(0);
      setReviewsHasMore(!page.last);

      if (authService.isAuthenticated()) {
        const u = authService.getCurrentUserFromStorage();
        if (u?.id) {
          const mine = await reviewService.findMyReviewForMovie(
            movieId,
            u.id,
          );
          setMyReview(mine);
          if (mine) {
            setFormRating(mine.rating);
            setFormText(mine.reviewText ?? "");
            setEditing(false);
          } else {
            setFormRating(5);
            setFormText("");
            setEditing(false);
          }
        }
      } else {
        setMyReview(null);
        setFormRating(5);
        setFormText("");
        setEditing(false);
      }
    } catch (e) {
      console.error("Failed to load reviews", e);
      setReviews([]);
      setReviewsHasMore(false);
    } finally {
      setReviewsLoading(false);
    }
  }, [movieId]);

  useEffect(() => {
    const fetchMovie = async () => {
      if (!id || !Number.isFinite(movieId)) {
        setError("Movie ID not provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const movieData = await movieService.getMovieByIdEnhanced(movieId);
        setMovie(movieData);
      } catch (err) {
        setError("Failed to load movie details");
        console.error("Error fetching movie:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMovie();
  }, [id, movieId]);

  useEffect(() => {
    if (!movie?.id) return;
    loadReviewsInitial();
  }, [movie?.id, loadReviewsInitial]);

  const loadMoreReviews = async () => {
    if (!Number.isFinite(movieId) || !reviewsHasMore || reviewsLoadingMore)
      return;
    setReviewsLoadingMore(true);
    try {
      const next = reviewsPage + 1;
      const page = await reviewService.getReviewsForMovie(
        movieId,
        next,
        REVIEW_PAGE_SIZE,
      );
      setReviews((prev) => [...prev, ...page.content]);
      setReviewsPage(next);
      setReviewsHasMore(!page.last);
    } catch (e) {
      console.error(e);
    } finally {
      setReviewsLoadingMore(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!Number.isFinite(movieId) || !authService.isAuthenticated()) return;
    setFormSubmitting(true);
    setFormError(null);
    try {
      if (myReview && editing) {
        await reviewService.updateReview(myReview.id, {
          rating: formRating,
          reviewText: formText.trim() || null,
        });
      } else {
        await reviewService.createReview({
          movieId,
          rating: formRating,
          reviewText: formText.trim() || null,
        });
      }
      setEditing(false);
      await refreshMovie();
      await loadReviewsInitial();
    } catch (err) {
      setFormError(parseApiError(err));
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!myReview) return;
    if (!window.confirm("Remove your review for this movie?")) return;
    setFormSubmitting(true);
    setFormError(null);
    try {
      await reviewService.deleteReview(myReview.id);
      setMyReview(null);
      setFormRating(5);
      setFormText("");
      setEditing(false);
      await refreshMovie();
      await loadReviewsInitial();
    } catch (err) {
      setFormError(parseApiError(err));
    } finally {
      setFormSubmitting(false);
    }
  };

  const startEdit = () => {
    if (!myReview) return;
    setFormRating(myReview.rating);
    setFormText(myReview.reviewText ?? "");
    setEditing(true);
    setFormError(null);
  };

  const cancelEdit = () => {
    if (myReview) {
      setFormRating(myReview.rating);
      setFormText(myReview.reviewText ?? "");
    }
    setEditing(false);
    setFormError(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-red-500 mx-auto mb-4" />
              <p className="text-gray-300 text-lg">Loading movie details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="min-h-screen bg-gray-950 pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center min-h-[400px]">
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-8 text-center">
                <h2 className="text-2xl font-bold text-white mb-4">
                  Movie Not Found
                </h2>
                <p className="text-gray-400 mb-6">
                  {error || "The requested movie could not be found."}
                </p>
                <Button asChild className="bg-red-600 hover:bg-red-700 text-white">
                  <Link to="/movies">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Movies
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const isLoggedIn = authService.isAuthenticated();

  return (
    <div className="min-h-screen bg-gray-950">
      <section className="relative h-[80vh] overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={
              movie.posterUrl ||
              `https://placehold.co/1920x1080/141414/E50914?text=${encodeURIComponent(movie.title)}`
            }
            alt={movie.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                `https://placehold.co/1920x1080/141414/E50914?text=${encodeURIComponent(movie.title)}`;
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-950 via-gray-950/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent" />
        </div>

        <div className="relative container mx-auto px-4 h-full flex items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl pt-16"
          >
            <div className="mb-4">
              <Link
                to="/movies"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Movies
              </Link>
              <span className="text-gray-600 mx-2">/</span>
              <span className="text-white">{movie.title}</span>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
              {movie.title}
            </h1>

            <div className="space-y-4 mb-8">
              <div className="flex items-center space-x-6 text-gray-300">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span className="text-gray-400">Director:</span>
                  <span className="font-medium">{movie.director}</span>
                </div>
              </div>

              <div className="flex items-center space-x-6 text-gray-300">
                <div className="flex items-center space-x-2">
                  <Tag className="w-4 h-4" />
                  <span className="text-gray-400">Genre:</span>
                  <Badge
                    variant="secondary"
                    className="bg-red-600 text-white hover:bg-red-700"
                  >
                    {movie.genre}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span>{movie.formattedDuration}</span>
                </div>
              </div>

              <div className="flex items-center space-x-6 text-gray-300">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span className="text-gray-400">Release:</span>
                  <span>
                    {new Date(movie.releaseDate).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4" />
                  <span className="text-green-500 font-bold text-lg">
                    {movieService.formatPrice(movie.priceBase)}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-4 text-gray-300">
                <div className="flex items-center space-x-2">
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  <span className="font-semibold text-lg">
                    {movie.averageRating > 0
                      ? `${movieService.formatRating(movie.averageRating)}/5.0`
                      : "No rating yet"}
                  </span>
                </div>
                <span className="text-gray-400 text-sm">
                  ({movie.reviewCount} review
                  {movie.reviewCount !== 1 ? "s" : ""})
                </span>
              </div>

              {movie.currentlyShowing && (
                <Badge className="bg-red-600 text-white hover:bg-red-700">
                  Currently Showing
                </Badge>
              )}
            </div>

            <div className="flex items-center space-x-4">
              <Button asChild size="lg" className="bg-red-600 hover:bg-red-700 text-white">
                <Link to={`/movies/${movie.id}/showtimes`}>
                  <Play className="w-5 h-5 mr-2" />
                  Book Tickets
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="bg-gray-800! border-gray-600! text-white! hover:bg-white! hover:text-black!"
              >
                <Link to="/movies" className="flex items-center">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Movies
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <main className="py-20 bg-gray-900">
        <div className="container mx-auto px-4">
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-16"
          >
            <h2 className="text-3xl font-bold text-white mb-6">Synopsis</h2>
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-8">
                <p className="text-gray-300 text-lg leading-relaxed max-w-4xl">
                  {movie.description ||
                    "No description available for this movie."}
                </p>
              </CardContent>
            </Card>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mb-16"
          >
            {/* Section header */}
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-red-600/20 rounded-lg">
                <MessageSquare className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white">Ratings & Reviews</h2>
                <p className="text-gray-400 text-sm mt-0.5">
                  {movie.reviewCount > 0
                    ? `${movie.reviewCount} review${movie.reviewCount !== 1 ? "s" : ""}`
                    : "No reviews yet"}
                </p>
              </div>
            </div>

            {/* Rating summary card */}
            {movie.reviewCount > 0 && (
              <Card className="bg-gradient-to-br from-gray-800 to-gray-800/50 border-gray-700/60 mb-8">
                <CardContent className="p-6">
                  <div className="flex items-center gap-6">
                    <div className="text-center shrink-0">
                      <p className="text-6xl font-black text-white leading-none">
                        {movieService.formatRating(movie.averageRating)}
                      </p>
                      <div className="flex justify-center gap-0.5 my-2">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star
                            key={n}
                            className={`w-4 h-4 ${
                              n <= Math.round(movie.averageRating)
                                ? "text-yellow-400 fill-yellow-400"
                                : "text-gray-600"
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-gray-400 text-xs">out of 5</p>
                    </div>
                    <div className="flex-1 space-y-1.5">
                      {[5, 4, 3, 2, 1].map((star) => {
                        const count = reviews.filter((r) => r.rating === star).length;
                        const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                        return (
                          <div key={star} className="flex items-center gap-2 text-xs">
                            <span className="text-gray-400 w-3">{star}</span>
                            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400 shrink-0" />
                            <div className="flex-1 bg-gray-700 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-yellow-400 h-full rounded-full transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-gray-500 w-4 text-right">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Write / edit review form */}
            {isLoggedIn && (
              <Card className="bg-gray-800/60 border-gray-700/60 mb-8 overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-red-600 via-red-500 to-orange-500" />
                <CardContent className="p-6">
                  {myReview && !editing ? (
                    /* My submitted review preview */
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-sm font-semibold text-red-400 uppercase tracking-wide">
                          Your Review
                        </p>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="bg-gray-700! border-gray-600! text-gray-200! hover:bg-gray-600! h-8 px-3"
                            onClick={startEdit}
                            disabled={formSubmitting}
                          >
                            <Pencil className="w-3 h-3 mr-1.5" />
                            Edit
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="border-red-800! text-red-400! hover:bg-red-950! h-8 px-3"
                            onClick={handleDeleteReview}
                            disabled={formSubmitting}
                          >
                            <Trash2 className="w-3 h-3 mr-1.5" />
                            Delete
                          </Button>
                        </div>
                      </div>
                      <div className="flex gap-0.5 mb-3">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star
                            key={n}
                            className={`w-5 h-5 ${
                              n <= myReview.rating
                                ? "text-yellow-400 fill-yellow-400"
                                : "text-gray-600"
                            }`}
                          />
                        ))}
                        <span className="ml-2 text-sm text-gray-400 self-center">
                          {myReview.rating}/5
                        </span>
                      </div>
                      {myReview.reviewText?.trim() ? (
                        <p className="text-gray-300 leading-relaxed bg-gray-900/50 rounded-lg p-3">
                          {myReview.reviewText}
                        </p>
                      ) : (
                        <p className="text-gray-500 text-sm italic">No written comment.</p>
                      )}
                    </div>
                  ) : (
                    /* Review form */
                    <form onSubmit={handleSubmitReview} className="space-y-5">
                      <p className="text-sm font-semibold text-red-400 uppercase tracking-wide">
                        {myReview && editing ? "Edit Your Review" : "Write a Review"}
                      </p>

                      {/* Star rating picker */}
                      <div>
                        <span className="text-gray-300 text-sm block mb-3">
                          Your rating
                        </span>
                        <div className="flex gap-1" onMouseLeave={() => setHoverRating(0)}>
                          {[1, 2, 3, 4, 5].map((n) => (
                            <button
                              key={n}
                              type="button"
                              onClick={() => setFormRating(n)}
                              onMouseEnter={() => setHoverRating(n)}
                              className="transition-transform hover:scale-110 active:scale-95"
                              aria-label={`${n} stars`}
                            >
                              <Star
                                className={`w-9 h-9 transition-colors duration-100 ${
                                  n <= (hoverRating || formRating)
                                    ? "text-yellow-400 fill-yellow-400"
                                    : "text-gray-600"
                                }`}
                              />
                            </button>
                          ))}
                          <span className="self-center ml-2 text-gray-400 text-sm min-w-[60px]">
                            {["", "Poor", "Fair", "Good", "Great", "Excellent"][
                              hoverRating || formRating
                            ]}
                          </span>
                        </div>
                      </div>

                      {/* Comment textarea */}
                      <div>
                        <label
                          htmlFor="review-text"
                          className="text-gray-300 text-sm block mb-2"
                        >
                          Comment{" "}
                          <span className="text-gray-500">(optional)</span>
                        </label>
                        <Textarea
                          id="review-text"
                          value={formText}
                          onChange={(e) => setFormText(e.target.value)}
                          placeholder="Share what you thought about this movie..."
                          className="min-h-[110px] bg-gray-900/80 border-gray-600 text-white placeholder:text-gray-500 resize-none focus:border-red-500 transition-colors"
                          maxLength={2000}
                          disabled={formSubmitting}
                        />
                        <p className="text-right text-xs text-gray-600 mt-1">
                          {formText.length}/2000
                        </p>
                      </div>

                      {formError && (
                        <Alert className="bg-red-950/50 border-red-800 text-red-200">
                          <AlertDescription>{formError}</AlertDescription>
                        </Alert>
                      )}

                      <div className="flex flex-wrap gap-3 pt-1">
                        <Button
                          type="submit"
                          className="bg-red-600 hover:bg-red-700 text-white px-6"
                          disabled={formSubmitting}
                        >
                          {formSubmitting ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : myReview && editing ? (
                            "Save changes"
                          ) : (
                            "Post review"
                          )}
                        </Button>
                        {myReview && editing && (
                          <Button
                            type="button"
                            variant="outline"
                            className="bg-gray-700! border-gray-600! text-white!"
                            onClick={cancelEdit}
                            disabled={formSubmitting}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </form>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Not logged in CTA */}
            {!isLoggedIn && (
              <Card className="bg-gray-800/60 border-gray-700/60 mb-8 overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-red-600 via-red-500 to-orange-500" />
                <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <p className="text-white font-medium">Want to share your thoughts?</p>
                    <p className="text-gray-400 text-sm mt-1">
                      Sign in to rate this movie and leave a comment.
                    </p>
                  </div>
                  <Button
                    asChild
                    className="bg-red-600 hover:bg-red-700 text-white shrink-0 px-6"
                  >
                    <Link to="/login">Sign in</Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Review list */}
            {reviewsLoading ? (
              <div className="flex justify-center py-16">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-red-500 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">Loading reviews...</p>
                </div>
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-16">
                <MessageSquare className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                <p className="text-gray-400 font-medium">No reviews yet</p>
                <p className="text-gray-600 text-sm mt-1">
                  Be the first to share your thoughts!
                </p>
              </div>
            ) : (
              <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl overflow-hidden">
                {[
                  // own review always on top
                  ...reviews.filter((r) => myReview && r.id === myReview.id),
                  ...reviews.filter((r) => !myReview || r.id !== myReview.id),
                ].map((r, index, arr) => {
                  const initials = (r.user?.fullName ?? "U")
                    .split(" ")
                    .map((w) => w[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase();
                  const isOwn = myReview?.id === r.id;
                  const isLast = index === arr.length - 1;
                  return (
                    <motion.div
                      key={r.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: index * 0.04 }}
                      className={`flex gap-4 px-5 py-4 ${
                        isOwn ? "bg-red-950/20" : "hover:bg-gray-700/20"
                      } ${!isLast ? "border-b border-gray-700/40" : ""} transition-colors`}
                    >
                      {/* Avatar */}
                      <div className="shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white text-xs font-bold shadow-md mt-0.5">
                        {initials}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mb-1">
                          <span className="font-semibold text-white text-sm">
                            {r.user?.fullName ?? "User"}
                          </span>
                          {isOwn && (
                            <Badge className="bg-red-600/30 text-red-300 border-red-700/50 text-[10px] px-1.5 py-0">
                              You
                            </Badge>
                          )}
                          <div className="flex gap-0.5 ml-1">
                            {[1, 2, 3, 4, 5].map((n) => (
                              <Star
                                key={n}
                                className={`w-3 h-3 ${
                                  n <= r.rating
                                    ? "text-yellow-400 fill-yellow-400"
                                    : "text-gray-600"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-gray-500 text-xs ml-auto">
                            {new Date(r.createdAt).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>

                        {r.reviewText?.trim() ? (
                          <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                            {r.reviewText}
                          </p>
                        ) : (
                          <p className="text-gray-600 text-xs italic">
                            No written comment.
                          </p>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Load more */}
            {reviewsHasMore && !reviewsLoading && (
              <div className="flex justify-center mt-8">
                <Button
                  type="button"
                  variant="outline"
                  className="bg-gray-800! border-gray-700! text-gray-300! hover:bg-gray-700! hover:text-white! px-8"
                  onClick={loadMoreReviews}
                  disabled={reviewsLoadingMore}
                >
                  {reviewsLoadingMore ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Load more reviews"
                  )}
                </Button>
              </div>
            )}
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-16"
          >
            <h2 className="text-3xl font-bold text-white mb-6">
              Movie Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-2">
                    <User className="w-5 h-5 text-red-500" />
                    <h3 className="font-semibold text-white">Director</h3>
                  </div>
                  <p className="text-gray-300">{movie.director}</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-2">
                    <Tag className="w-5 h-5 text-red-500" />
                    <h3 className="font-semibold text-white">Genre</h3>
                  </div>
                  <p className="text-gray-300">{movie.genre}</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-2">
                    <Clock className="w-5 h-5 text-red-500" />
                    <h3 className="font-semibold text-white">Duration</h3>
                  </div>
                  <p className="text-gray-300">{movie.formattedDuration}</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-2">
                    <Calendar className="w-5 h-5 text-red-500" />
                    <h3 className="font-semibold text-white">Release Date</h3>
                  </div>
                  <p className="text-gray-300">
                    {new Date(movie.releaseDate).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-2">
                    <DollarSign className="w-5 h-5 text-red-500" />
                    <h3 className="font-semibold text-white">Base Price</h3>
                  </div>
                  <p className="text-green-500 font-bold text-lg">
                    {movieService.formatPrice(movie.priceBase)}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-2">
                    <Play className="w-5 h-5 text-red-500" />
                    <h3 className="font-semibold text-white">Status</h3>
                  </div>
                  <p className="text-gray-300">
                    {movie.currentlyShowing ? "Now Showing" : "Coming Soon"}
                  </p>
                </CardContent>
              </Card>
            </div>
          </motion.section>
        </div>
      </main>
    </div>
  );
};

export default MovieDetailPage;
