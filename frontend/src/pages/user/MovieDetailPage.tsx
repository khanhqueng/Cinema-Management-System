import React, { useState, useEffect } from "react";
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
} from "lucide-react";

// OLD API services (keep 100% logic) - UNCHANGED
import { movieService } from "../../services/movieService";
import { Movie } from "../../types";

// NEW UI components
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";

const MovieDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMovie = async () => {
      if (!id) {
        setError("Movie ID not provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const movieData = await movieService.getMovieByIdEnhanced(
          parseInt(id, 10),
        );
        setMovie(movieData);
      } catch (err) {
        setError("Failed to load movie details");
        console.error("Error fetching movie:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMovie();
  }, [id]);

  // NEW loading UI (modern design)
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

  // NEW error UI (modern design)
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
                <Button asChild className="bg-red-600 hover:bg-red-700">
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

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Hero Section - NEW UI with OLD data */}
      <section className="relative h-[80vh] overflow-hidden">
        {/* Background Image */}
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

        {/* Hero Content */}
        <div className="relative container mx-auto px-4 h-full flex items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl pt-16"
          >
            {/* Breadcrumb */}
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

            {/* Movie Info */}
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

              {movie.averageRating > 0 && (
                <div className="flex items-center space-x-4 text-gray-300">
                  <div className="flex items-center space-x-2">
                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                    <span className="font-semibold text-lg">
                      {movieService.formatRating(movie.averageRating)}/5.0
                    </span>
                  </div>
                  {movie.reviewCount > 0 && (
                    <span className="text-gray-400 text-sm">
                      ({movie.reviewCount} review
                      {movie.reviewCount !== 1 ? "s" : ""})
                    </span>
                  )}
                </div>
              )}

              {movie.currentlyShowing && (
                <Badge className="bg-red-600 text-white hover:bg-red-700">
                  Currently Showing
                </Badge>
              )}
            </div>

            {/* Action Buttons */}
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

      {/* Content Section */}
      <main className="py-20 bg-gray-900">
        <div className="container mx-auto px-4">
          {/* Synopsis */}
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

          {/* Movie Details Grid */}
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
