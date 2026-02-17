import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Search,
  Filter,
  MapPin,
  Users,
  Calendar,
  Clock,
  Film,
  ArrowLeft,
  ArrowRight,
  Loader2,
  AlertCircle,
  Eye,
  Building2,
  X
} from 'lucide-react';

// OLD API services (keep 100% logic) - UNCHANGED
import { theaterService } from '../../services/theaterService';
import { showtimeService } from '../../services/showtimeService';
import { Theater, TheaterType, PageResponse, Showtime } from '../../types';

// NEW UI components
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';

const TheaterPage: React.FC = () => {
  const [theaters, setTheaters] = useState<Theater[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<TheaterType | ''>('');
  const [theaterTypes, setTheaterTypes] = useState<TheaterType[]>([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 12;

  useEffect(() => {
    fetchTheaterTypes();
    fetchTheaters();
  }, []);

  useEffect(() => {
    fetchTheaters();
  }, [currentPage, selectedType]);

  const fetchTheaterTypes = async () => {
    try {
      const types = await theaterService.getTheaterTypes();
      setTheaterTypes(types);
    } catch (err) {
      console.error('Error fetching theater types:', err);
    }
  };

  const fetchTheaters = async () => {
    try {
      setLoading(true);
      let theatersResponse: PageResponse<Theater>;

      if (searchQuery.trim()) {
        theatersResponse = await theaterService.searchTheaters({
          name: searchQuery,
          page: currentPage,
          size: pageSize
        });
      } else if (selectedType) {
        theatersResponse = await theaterService.getTheatersByType({
          type: selectedType,
          page: currentPage,
          size: pageSize
        });
      } else {
        theatersResponse = await theaterService.getAllTheaters({
          page: currentPage,
          size: pageSize,
          sortBy: 'name',
          sortDir: 'asc'
        });
      }

      setTheaters(theatersResponse.content);
      setTotalPages(theatersResponse.totalPages);
      setTotalElements(theatersResponse.totalElements);
    } catch (err) {
      setError('Failed to fetch theaters');
      console.error('Error fetching theaters:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(0);
    setSelectedType('');
    fetchTheaters();
  };

  const handleTypeFilter = (type: TheaterType | '') => {
    setSelectedType(type);
    setSearchQuery('');
    setCurrentPage(0);
    fetchTheaters();
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedType('');
    setCurrentPage(0);
    fetchTheaters();
  };

  // NEW loading UI (modern design)
  if (loading && theaters.length === 0) {
    return (
      <div className="min-h-screen bg-gray-950 pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-red-500 mx-auto mb-4" />
              <p className="text-gray-300 text-lg">Loading theaters...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // NEW error UI (modern design)
  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center min-h-[400px]">
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-8 text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-4">Error Loading Theaters</h2>
                <p className="text-gray-400 mb-6">{error}</p>
                <Button onClick={fetchTheaters} className="bg-red-600 hover:bg-red-700">
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
    <div className="min-h-screen bg-gray-950">
      {/* Header Section - NEW UI */}
      <section className="bg-gradient-to-r from-red-900 to-red-800 py-16 text-center">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 rounded-full mb-6">
              <Building2 className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Our Theaters</h1>
            <p className="text-lg text-red-100 max-w-2xl mx-auto">
              Experience movies like never before in our state-of-the-art theaters
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content Section */}
      <main className="py-12 bg-gray-950">
        <div className="container mx-auto px-4 max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Search and Filters */}
            <Card className="bg-gray-800 border-gray-700 mb-8">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                  {/* Search */}
                  <form onSubmit={handleSearch} className="space-y-2">
                    <label className="text-sm font-medium text-gray-300 flex items-center">
                      <Search className="w-4 h-4 mr-2" />
                      Search Theaters
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        placeholder="Search theaters..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-1 px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                      <Button type="submit" className="bg-red-600 hover:bg-red-700">
                        <Search className="w-4 h-4" />
                      </Button>
                    </div>
                  </form>

                  {/* Theater Type Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300 flex items-center">
                      <Filter className="w-4 h-4 mr-2" />
                      Theater Type
                    </label>
                    <select
                      value={selectedType}
                      onChange={(e) => handleTypeFilter(e.target.value as TheaterType | '')}
                      className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <option value="">All Types</option>
                      {theaterTypes.map(type => (
                        <option key={type} value={type}>
                          {theaterService.getTheaterTypeDisplay(type)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Clear Filters & Results Info */}
                  <div className="space-y-2">
                    {(searchQuery || selectedType) && (
                      <Button
                        onClick={clearFilters}
                        variant="outline"
                        className="w-full !bg-gray-800 !border-gray-600 !text-white hover:!bg-gray-700 hover:!text-white"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Clear Filters
                      </Button>
                    )}
                    <p className="text-sm text-gray-400 text-center">
                      Showing {theaters.length} of {totalElements} theaters
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Theaters Grid */}
            {theaters.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Card className="bg-gray-900 border-gray-800">
                  <CardContent className="p-12 text-center">
                    <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-4">No Theaters Found</h3>
                    <p className="text-gray-400">
                      {searchQuery || selectedType
                        ? 'Try adjusting your filters to see more results.'
                        : 'No theaters are currently available.'}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
              >
                {theaters.map((theater, index) => (
                  <motion.div
                    key={theater.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                  >
                    <TheaterCard theater={theater} />
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="flex items-center justify-center space-x-2"
              >
                <Button
                  onClick={() => setCurrentPage(0)}
                  disabled={currentPage === 0}
                  variant="outline"
                  className="!bg-gray-800 !border-gray-600 !text-white hover:!bg-gray-700 hover:!text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  First
                </Button>
                <Button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 0}
                  variant="outline"
                  className="!bg-gray-800 !border-gray-600 !text-white hover:!bg-gray-700 hover:!text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </Button>

                <span className="px-4 py-2 text-gray-300 font-medium">
                  Page {currentPage + 1} of {totalPages}
                </span>

                <Button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage >= totalPages - 1}
                  variant="outline"
                  className="!bg-gray-800 !border-gray-600 !text-white hover:!bg-gray-700 hover:!text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </Button>
                <Button
                  onClick={() => setCurrentPage(totalPages - 1)}
                  disabled={currentPage >= totalPages - 1}
                  variant="outline"
                  className="!bg-gray-800 !border-gray-600 !text-white hover:!bg-gray-700 hover:!text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Last
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </motion.div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
};

// Theater Card Component - NEW UI with OLD logic
const TheaterCard: React.FC<{ theater: Theater }> = ({ theater }) => {
  const [upcomingShowtimes, setUpcomingShowtimes] = useState<Showtime[]>([]);
  const [loadingShowtimes, setLoadingShowtimes] = useState(true);

  useEffect(() => {
    const fetchUpcomingShowtimes = async () => {
      try {
        const showtimesResponse = await showtimeService.getShowtimesByTheater(theater.id, {
          size: 3
        });
        setUpcomingShowtimes(showtimesResponse.content.slice(0, 3));
      } catch (err) {
        console.error('Error fetching showtimes:', err);
      } finally {
        setLoadingShowtimes(false);
      }
    };

    fetchUpcomingShowtimes();
  }, [theater.id]);

  return (
    <Card className="bg-gray-800 border-gray-700 hover:border-red-500 transition-all duration-300 h-full">
      <CardContent className="p-6 flex flex-col h-full">
        {/* Theater Header */}
        <div className="flex items-start space-x-4 mb-6">
          <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-white mb-2 truncate">{theater.name}</h3>
            <div className="space-y-1">
              <Badge variant="secondary" className="bg-blue-600 text-white">
                {theaterService.getTheaterTypeDisplay(theater.theaterType)}
              </Badge>
              <div className="flex items-center text-gray-400 text-sm">
                <Users className="w-4 h-4 mr-1" />
                {theater.capacity} seats ({theaterService.getCapacityCategory(theater.capacity)})
              </div>
            </div>
          </div>
        </div>

        {/* Showtimes Section */}
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center">
            <Calendar className="w-4 h-4 mr-2" />
            Upcoming Showtimes
          </h4>
          {loadingShowtimes ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
              <span className="text-gray-400 text-sm ml-2">Loading...</span>
            </div>
          ) : upcomingShowtimes.length > 0 ? (
            <div className="space-y-3">
              {upcomingShowtimes.map(showtime => (
                <div key={showtime.id} className="bg-gray-700/50 rounded-lg p-3">
                  <div className="font-medium text-white text-sm mb-1 truncate">
                    {showtime.movieTitle}
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <div className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {showtimeService.formatShowTime(showtime)}
                    </div>
                    <span>
                      {new Date(showtime.showDatetime).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-400 text-sm">
              No upcoming showtimes
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="mt-6 pt-4 border-t border-gray-700">
          <Button asChild className="w-full bg-red-600 hover:bg-red-700">
            <Link to={`/theaters/${theater.id}/showtimes`}>
              <Eye className="w-4 h-4 mr-2" />
              View All Showtimes
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TheaterPage;