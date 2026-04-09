import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { Search, Filter, Star, Clock, Play, Calendar, Loader2, Sparkles } from 'lucide-react';

// OLD API services (keep 100% logic) - UNCHANGED
import { movieService } from '../../services/movieService';
import { Movie, PageResponse } from '../../types';
import SemanticSearch from '../../components/SemanticSearch';

// NEW UI components
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Input } from '../../components/ui/input';

const MoviesPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const [genres, setGenres] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [showSemanticSearch, setShowSemanticSearch] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 12;

  useEffect(() => {
    // Check if user came from AI search link
    const searchParam = searchParams.get('search');
    if (searchParam === 'true') {
      setShowSemanticSearch(true);
    }

    fetchGenres();
    fetchMovies();
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchMovies();
  }, [currentPage, sortBy, sortDir]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchGenres = async () => {
    try {
      const genresData = await movieService.getGenres();
      setGenres(genresData);
    } catch (err) {
      console.error('Error fetching genres:', err);
    }
  };

  const fetchMovies = async () => {
    try {
      setLoading(true);
      let moviesResponse: PageResponse<Movie>;

      if (searchQuery.trim()) {
        moviesResponse = await movieService.searchMoviesEnhanced({
          query: searchQuery,
          page: currentPage,
          size: pageSize,
          sortBy,
          sortDir
        });
      } else if (selectedGenre) {
        moviesResponse = await movieService.getMoviesByGenreEnhanced(selectedGenre, {
          page: currentPage,
          size: pageSize,
          sortBy,
          sortDir
        });
      } else {
        moviesResponse = await movieService.getAllMoviesEnhanced({
          page: currentPage,
          size: pageSize,
          sortBy,
          sortDir
        });
      }

      setMovies(moviesResponse.content);
      setTotalPages(moviesResponse.totalPages);
      setTotalElements(moviesResponse.totalElements);
    } catch (err) {
      setError('Failed to fetch movies');
      console.error('Error fetching movies:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(0);
    setSelectedGenre('');
    fetchMovies();
  };

  const handleGenreFilter = (genre: string) => {
    setSelectedGenre(genre);
    setSearchQuery('');
    setCurrentPage(0);
    fetchMovies();
  };

  const handleSort = (newSortBy: string) => {
    if (sortBy === newSortBy) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortDir('desc');
    }
    setCurrentPage(0);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedGenre('');
    setCurrentPage(0);
    fetchMovies();
  };

  // NEW loading UI
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-red-500 mx-auto mb-4" />
              <p className="text-gray-300 text-lg">Loading movies...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // NEW error UI
  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center min-h-[400px]">
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-8 text-center">
                <h2 className="text-2xl font-bold text-white mb-4">Something went wrong</h2>
                <p className="text-gray-400 mb-6">Error: {error}</p>
                <Button
                  onClick={() => {
                    setError(null);
                    fetchMovies();
                  }}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Try Again
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 pt-24 pb-16">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2">
            All Movies ({totalElements} movies)
          </h1>
          <p className="text-gray-400">Discover your next favorite film</p>
        </motion.div>

        {/* AI Semantic Search Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 text-center"
        >
          <Button
            onClick={() => setShowSemanticSearch(!showSemanticSearch)}
            variant={showSemanticSearch ? "default" : "outline"}
            className={`
              ${showSemanticSearch
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-gray-800! border-gray-600! text-white! hover:bg-red-600! hover:text-white!'
              }
            `}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {showSemanticSearch ? 'Traditional Search' : 'AI Smart Search'}
          </Button>
        </motion.div>

        {/* Search Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          {showSemanticSearch ? (
            /* AI Semantic Search - preserve OLD logic */
            <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
              <SemanticSearch
                onResults={(results) => {
                  setMovies(results);
                  setTotalPages(1);
                  setTotalElements(results.length);
                  setCurrentPage(0);
                }}
                className="search-section"
              />
            </div>
          ) : (
            /* Traditional Search - NEW UI with OLD logic */
            <form onSubmit={handleSearch} className="flex gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search movies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full min-h-11! h-auto! pl-12 pr-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              <Button type="submit" className="bg-red-600 hover:bg-red-700 h-auto text-white">
                Search
              </Button>
            </form>
          )}
        </motion.div>

        {/* Filters Section - NEW UI with OLD logic */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8 bg-gray-900/30 rounded-xl p-6 border border-gray-800"
        >
          <div className="flex flex-wrap gap-6 items-end">
            {/* Genre Filter */}
            <div className="min-w-[200px]">
              <label className="block text-sm font-medium text-gray-300 mb-2">Genre:</label>
              <Select
                value={selectedGenre || "__all__"}
                onValueChange={(v) =>
                  handleGenreFilter(v === "__all__" ? "" : v)
                }
              >
                <div className="relative">
                  <Filter className="absolute left-4 top-1/2 z-10 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  <SelectTrigger
                    aria-label="Filter by genre"
                    className="h-11 w-full rounded-lg border border-gray-800 bg-gray-900 pl-12 pr-3 text-sm text-white shadow-none focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-red-500"
                  >
                    <SelectValue placeholder="All Genres" />
                  </SelectTrigger>
                </div>
                <SelectContent className="max-h-[280px] border-gray-800 bg-gray-900 text-white">
                  <SelectItem
                    value="__all__"
                    className="focus:bg-gray-800 focus:text-white"
                  >
                    All Genres
                  </SelectItem>
                  {genres.map((genre) => (
                    <SelectItem
                      key={genre}
                      value={genre}
                      className="focus:bg-gray-800 focus:text-white"
                    >
                      {genre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sort Options */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Sort by:</label>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleSort('title')}
                  variant={sortBy === 'title' ? 'default' : 'outline'}
                  size="sm"
                  className={sortBy === 'title' ? 'bg-red-600 hover:bg-red-700 text-white' : '!bg-gray-800 !border-gray-600 !text-white hover:!bg-red-600 hover:!text-white'}
                >
                  Title {sortBy === 'title' && (sortDir === 'asc' ? '↑' : '↓')}
                </Button>
                <Button
                  onClick={() => handleSort('averageRating')}
                  variant={sortBy === 'averageRating' ? 'default' : 'outline'}
                  size="sm"
                  className={sortBy === 'averageRating' ? 'bg-red-600 hover:bg-red-700 text-white' : '!bg-gray-800 !border-gray-600 !text-white hover:!bg-red-600 hover:!text-white'}
                >
                  Rating {sortBy === 'averageRating' && (sortDir === 'asc' ? '↑' : '↓')}
                </Button>
                <Button
                  onClick={() => handleSort('createdAt')}
                  variant={sortBy === 'createdAt' ? 'default' : 'outline'}
                  size="sm"
                  className={sortBy === 'createdAt' ? 'bg-red-600 hover:bg-red-700 text-white' : '!bg-gray-800 !border-gray-600 !text-white hover:!bg-red-600 hover:!text-white'}
                >
                  Latest {sortBy === 'createdAt' && (sortDir === 'asc' ? '↑' : '↓')}
                </Button>
              </div>
            </div>

            {/* Clear Filters */}
            {(searchQuery || selectedGenre) && (
              <Button
                onClick={clearFilters}
                variant="outline"
                size="sm"
                className="!bg-gray-800 !border-gray-600 !text-gray-400 hover:!bg-gray-700 hover:!text-white"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </motion.div>

        {/* Results Count */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-gray-400 mb-6"
        >
          {totalElements} {totalElements === 1 ? 'movie' : 'movies'} found
        </motion.p>

        {/* Movies Grid or No Results */}
        {movies.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-900 rounded-full mb-4">
              <Search className="w-10 h-10 text-gray-600" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">No movies found</h3>
            <p className="text-gray-400">
              {searchQuery || selectedGenre ? 'Try adjusting your search or filters' : 'No movies available at the moment'}
            </p>
          </motion.div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {movies.map((movie, index) => (
                <motion.div
                  key={movie.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    duration: 0.4,
                    delay: 0.1 * (index % 8) // Stagger by grid position
                  }}
                  whileHover={{ scale: 1.02 }}
                  className="group cursor-pointer"
                >
                  <Card className="bg-gray-900 border-gray-800 overflow-hidden hover:bg-gray-800 transition-all duration-300 hover:shadow-2xl hover:shadow-red-500/10">
                    {/* Poster Section */}
                    <div className="relative aspect-[2/3] overflow-hidden">
                      <img
                        src={movie.posterUrl || `https://placehold.co/300x450/141414/E50914?text=${encodeURIComponent(movie.title)}`}
                        alt={movie.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                      {/* Badges */}
                      {movie.currentlyShowing && (
                        <div className="absolute top-3 left-3 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-md uppercase">
                          Now Showing
                        </div>
                      )}
                      {movie.averageRating > 0 && (
                        <div className="absolute top-3 right-3 bg-black/80 text-yellow-500 text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1">
                          <Star className="w-3 h-3 fill-yellow-500" />
                          {movieService.formatRating(movie.averageRating)}
                        </div>
                      )}

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Play className="w-12 h-12 text-white" />
                      </div>
                    </div>

                    {/* Movie Info */}
                    <CardContent className="p-4">
                      <h3 className="text-white font-semibold text-lg mb-1 line-clamp-1">{movie.title}</h3>
                      <p className="text-gray-400 text-sm mb-2 italic">Directed by {movie.director}</p>
                      <p className="text-red-500 font-semibold text-sm mb-3">{movie.genre}</p>

                      {/* Meta Info */}
                      <div className="flex items-center justify-between text-sm text-gray-400 mb-3">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{movie.formattedDuration}</span>
                        </div>
                        <span className="text-green-500 font-bold">
                          {movieService.formatPrice(movie.priceBase)}
                        </span>
                      </div>

                      {/* Reviews */}
                      {movie.reviewCount > 0 && (
                        <p className="text-gray-500 text-xs mb-3">
                          {movie.reviewCount} review{movie.reviewCount !== 1 ? 's' : ''}
                        </p>
                      )}

                      {/* Description */}
                      <p className="text-gray-300 text-sm mb-4 line-clamp-2">
                        {movie.description && movie.description.length > 100
                          ? `${movie.description.substring(0, 100)}...`
                          : movie.description || 'No description available'
                        }
                      </p>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <Button asChild size="sm" className="text-white flex-1 bg-red-600 hover:bg-red-700">
                          <Link to={`/movies/${movie.id}`}>
                            <Play className="w-4 h-4 mr-1" />
                            Details
                          </Link>
                        </Button>
                        <Button asChild variant="outline" size="sm" className="flex-1 !bg-gray-800 !border-gray-600 !text-white hover:!bg-green-600 hover:!border-green-600 hover:!text-white">
                          <Link to={`/movies/${movie.id}/showtimes`}>
                            <Calendar className="w-4 h-4 mr-1" />
                            Showtimes
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Pagination - NEW UI with OLD logic */}
            {totalPages > 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex justify-center items-center gap-4 mt-12 py-8"
              >
                <Button
                  onClick={() => setCurrentPage(0)}
                  disabled={currentPage === 0}
                  variant="outline"
                  size="sm"
                  className="!bg-gray-800 !border-gray-600 !text-white hover:!bg-red-600 hover:!border-red-600 hover:!text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  First
                </Button>
                <Button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 0}
                  variant="outline"
                  size="sm"
                  className="!bg-gray-800 !border-gray-600 !text-white hover:!bg-red-600 hover:!border-red-600 hover:!text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </Button>

                <span className="text-gray-400 font-medium px-4">
                  Page {currentPage + 1} of {totalPages}
                </span>

                <Button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage >= totalPages - 1}
                  variant="outline"
                  size="sm"
                  className="!bg-gray-800 !border-gray-600 !text-white hover:!bg-red-600 hover:!border-red-600 hover:!text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </Button>
                <Button
                  onClick={() => setCurrentPage(totalPages - 1)}
                  disabled={currentPage >= totalPages - 1}
                  variant="outline"
                  size="sm"
                  className="!bg-gray-800 !border-gray-600 !text-white hover:!bg-red-600 hover:!border-red-600 hover:!text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Last
                </Button>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
};


export default MoviesPage;