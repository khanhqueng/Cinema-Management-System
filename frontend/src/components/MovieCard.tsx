import { motion } from 'motion/react';
import { Clock, Star, Calendar } from 'lucide-react';
import { Movie } from '../data/mockData';
import { Link } from 'react-router';

interface MovieCardProps {
  movie: Movie;
  index?: number;
}

export function MovieCard({ movie, index = 0 }: MovieCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -8 }}
      className="group relative"
    >
      <Link to={`/movie/${movie.id}`}>
        <div className="relative overflow-hidden rounded-xl bg-gray-900 shadow-lg">
          {/* Poster */}
          <div className="aspect-[2/3] overflow-hidden">
            <img
              src={movie.poster}
              alt={movie.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>

          {/* Rating Badge */}
          <div className="absolute top-3 right-3 flex items-center space-x-1 bg-yellow-500/90 backdrop-blur-sm px-2 py-1 rounded-lg">
            <Star className="w-3 h-3 fill-white text-white" />
            <span className="text-xs font-bold text-white">{movie.rating}</span>
          </div>

          {/* Genre Badge */}
          <div className="absolute top-3 left-3 bg-red-600/90 backdrop-blur-sm px-3 py-1 rounded-lg">
            <span className="text-xs font-semibold text-white">{movie.genre}</span>
          </div>

          {/* Info Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
            <h3 className="text-lg font-bold text-white mb-2 line-clamp-1">{movie.title}</h3>
            
            <div className="flex items-center space-x-4 text-xs text-gray-300 mb-2">
              <div className="flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>{movie.duration} min</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="w-3 h-3" />
                <span>{new Date(movie.releaseDate).getFullYear()}</span>
              </div>
            </div>

            <p className="text-sm text-gray-400 line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              {movie.description}
            </p>

            <button className="mt-3 w-full py-2 bg-gradient-to-r from-red-600 to-red-500 rounded-lg text-sm font-semibold text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:shadow-lg hover:shadow-red-500/50">
              View Details
            </button>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
