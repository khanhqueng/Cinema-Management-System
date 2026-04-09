import React from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Star, Clock, Play, Calendar } from "lucide-react";
import { Movie } from "../types";
import { formatDuration, formatPrice } from "../utils/format";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";

interface RecommendationCardProps {
  movie: Movie;
  onViewDetails: (movie: Movie) => void;
  onViewShowtimes: (movie: Movie) => void;
  showReason?: string;
  compact?: boolean;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({
  movie,
  showReason,
}) => {
  const placeholderImage = `https://placehold.co/300x450/141414/E50914?text=${encodeURIComponent(movie.title)}`;

  return (
    <motion.div whileHover={{ scale: 1.02 }} className="group cursor-pointer">
      <Card className="bg-gray-900 border-gray-800 overflow-hidden hover:bg-gray-800 transition-all duration-300 hover:shadow-2xl hover:shadow-red-500/10">
        {/* Poster */}
        <Link to={`/movies/${movie.id}`} className="block">
          <div className="relative aspect-[2/3] overflow-hidden">
            <img
              src={movie.posterUrl || placeholderImage}
              alt={movie.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              onError={(e) => {
                (e.target as HTMLImageElement).src = placeholderImage;
              }}
            />

            {/* Badges */}
            {movie.currentlyShowing && (
              <div className="absolute top-3 left-3 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-md uppercase">
                Now Showing
              </div>
            )}
            {showReason && (
              <div className="absolute top-3 left-3 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-md">
                {showReason}
              </div>
            )}
            {movie.averageRating > 0 && (
              <div className="absolute top-3 right-3 bg-black/80 text-yellow-500 text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1">
                <Star className="w-3 h-3 fill-yellow-500" />
                {movie.averageRating.toFixed(1)}
              </div>
            )}

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Play className="w-12 h-12 text-white" />
            </div>
          </div>
        </Link>

        {/* Info */}
        <CardContent className="p-4">
          <h3 className="text-white font-semibold text-lg mb-1 line-clamp-1">
            {movie.title}
          </h3>
          <p className="text-gray-400 text-sm mb-2 italic">
            Directed by {movie.director}
          </p>
          <p className="text-red-500 font-semibold text-sm mb-3">
            {movie.genre}
          </p>

          <div className="flex items-center justify-between text-sm text-gray-400 mb-3">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{formatDuration(movie.durationMinutes)}</span>
            </div>
            <span className="text-green-500 font-bold">
              {formatPrice(movie.priceBase)}
            </span>
          </div>

          {movie.reviewCount > 0 && (
            <p className="text-gray-500 text-xs mb-3">
              {movie.reviewCount} review{movie.reviewCount !== 1 ? "s" : ""}
            </p>
          )}

          <p className="text-gray-300 text-sm mb-4 line-clamp-2">
            {movie.description
              ? movie.description.length > 100
                ? `${movie.description.substring(0, 100)}...`
                : movie.description
              : "No description available"}
          </p>

          <div className="flex gap-2">
            <Button
              asChild
              size="sm"
              className="flex-1 text-white bg-red-600 hover:bg-red-700"
            >
              <Link to={`/movies/${movie.id}`}>
                <Play className="w-4 h-4 mr-1" />
                Details
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="flex-1 !bg-gray-800 !border-gray-600 !text-white hover:!bg-green-600 hover:!border-green-600 hover:!text-white"
            >
              <Link to={`/movies/${movie.id}/showtimes`}>
                <Calendar className="w-4 h-4 mr-1" />
                Showtimes
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default RecommendationCard;
