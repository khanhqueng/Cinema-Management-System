import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Calendar,
  Clock,
  Film,
  Building2,
  Star,
  MapPin,
  Users,
  DollarSign,
  Filter,
  Search,
  ArrowLeft,
  ArrowRight,
  Loader2,
  AlertCircle,
  Eye,
  Ticket
} from 'lucide-react';

// OLD API services (keep 100% logic) - UNCHANGED
import { showtimeService } from '../../services/showtimeService';
import { Showtime, PageResponse } from '../../types';

// NEW UI components
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';

const AllShowtimesPage: React.FC = () => {
  const [showtimes, setShowtimes] = useState<PageResponse<Showtime> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchShowtimes();
  }, [currentPage, selectedDate]);

  const fetchShowtimes = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get all showtimes with pagination
      const params: any = {
        page: currentPage,
        size: 12,
        sortBy: 'showDatetime',
        sortDir: 'asc'
      };

      // Add date filter if selected
      if (selectedDate) {
        params.date = selectedDate;
      }

      const response = await showtimeService.getAllShowtimes(params);
      setShowtimes(response);
    } catch (err: any) {
      console.error('Error fetching showtimes:', err);
      setError('Failed to load showtimes');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchShowtimes();
      return;
    }

    try {
      setLoading(true);
      const response = await showtimeService.searchShowtimes({
        query: searchQuery,
        page: currentPage,
        size: 12
      });
      setShowtimes(response);
    } catch (err: any) {
      console.error('Error searching showtimes:', err);
      setError('Failed to search showtimes');
    } finally {
      setLoading(false);
    }
  };

  const handleDateFilter = (date: string) => {
    setSelectedDate(date);
    setCurrentPage(0);
  };

  const clearFilters = () => {
    setSelectedDate('');
    setSearchQuery('');
    setCurrentPage(0);
    fetchShowtimes();
  };

  const getStatusBadge = (showDatetime: string) => {
    const now = new Date();
    const showTime = new Date(showDatetime);

    if (showTime < now) {
      return <Badge variant="secondary" className="bg-gray-600 text-white">Past</Badge>;
    } else if (showTime.getTime() - now.getTime() < 24 * 60 * 60 * 1000) {
      return <Badge variant="secondary" className="bg-red-600 text-white">Today</Badge>;
    } else if (showTime.getTime() - now.getTime() < 7 * 24 * 60 * 60 * 1000) {
      return <Badge variant="secondary" className="bg-orange-600 text-white">This Week</Badge>;
    } else {
      return <Badge variant="secondary" className="bg-green-600 text-white">Upcoming</Badge>;
    }
  };

  const getNextDates = () => {
    const dates = [];
    const today = new Date();

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push({
        value: date.toISOString().split('T')[0],
        label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
      });
    }

    return dates;
  };

  // NEW loading UI (modern design)
  if (loading && !showtimes) {
    return (
      <div className="min-h-screen bg-gray-950 pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-red-500 mx-auto mb-4" />
              <p className="text-gray-300 text-lg">Loading all showtimes...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header Section - NEW UI */}
      <section className="bg-gradient-to-r from-indigo-900 to-purple-800 py-16 text-center">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 rounded-full mb-6">
              <Clock className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">All Showtimes</h1>
            <p className="text-lg text-indigo-100 max-w-2xl mx-auto">
              Discover all movie showtimes across our theaters
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
            className="space-y-8"
          >
            {/* Filters Section - NEW UI */}
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-end">
                  {/* Search */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300 flex items-center">
                      <Search className="w-4 h-4 mr-2" />
                      Search Movies & Theaters
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search movies or theaters..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Date Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300 flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      Filter by Date
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {getNextDates().map(date => (
                        <Button
                          key={date.value}
                          onClick={() => handleDateFilter(date.value)}
                          variant={selectedDate === date.value ? "default" : "outline"}
                          size="sm"
                          className={selectedDate === date.value ?
                            "bg-indigo-600 hover:bg-indigo-700" :
                            "border-gray-600 text-white hover:bg-gray-700"
                          }
                        >
                          {date.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Button onClick={handleSearch} className="bg-indigo-600 hover:bg-indigo-700">
                        <Search className="w-4 h-4 mr-2" />
                        Search
                      </Button>
                      {(searchQuery || selectedDate) && (
                        <Button onClick={clearFilters} variant="outline" className="!bg-gray-800 !border-gray-600 !text-white hover:!bg-gray-700 hover:!text-white">
                          Clear
                        </Button>
                      )}
                    </div>
                    <p className="text-sm text-gray-400">
                      {showtimes ? `${showtimes.totalElements} showtimes found` : 'Loading...'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Showtimes Grid - NEW UI with OLD logic */}
            {error ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="bg-red-900/50 border-red-600">
                  <CardContent className="p-6">
                    <div className="flex items-center text-red-300">
                      <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                      {error}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <>
                {showtimes && showtimes.content.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card className="bg-gray-900 border-gray-800">
                      <CardContent className="p-12 text-center">
                        <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-4">No Showtimes Found</h3>
                        <p className="text-gray-400 mb-8">
                          {searchQuery || selectedDate
                            ? 'Try adjusting your filters to see more results.'
                            : 'No showtimes are currently available.'}
                        </p>
                        <Button
                          onClick={() => window.location.href = '/movies'}
                          className="bg-indigo-600 hover:bg-indigo-700"
                        >
                          <Film className="w-5 h-5 mr-2" />
                          Browse Movies
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  >
                    {showtimes?.content.map((showtime, index) => (
                      <motion.div
                        key={showtime.id}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.05 }}
                      >
                        <ShowtimeCard showtime={showtime} />
                      </motion.div>
                    ))}
                  </motion.div>
                )}

                {/* Pagination */}
                {showtimes && showtimes.totalPages > 1 && (
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
                      Page {currentPage + 1} of {showtimes.totalPages}
                    </span>

                    <Button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage >= showtimes.totalPages - 1}
                      variant="outline"
                      className="!bg-gray-800 !border-gray-600 !text-white hover:!bg-gray-700 hover:!text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </Button>
                    <Button
                      onClick={() => setCurrentPage(showtimes.totalPages - 1)}
                      disabled={currentPage >= showtimes.totalPages - 1}
                      variant="outline"
                      className="!bg-gray-800 !border-gray-600 !text-white hover:!bg-gray-700 hover:!text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Last
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </motion.div>
                )}
              </>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
};

// Showtime Card Component - NEW UI with OLD logic
const ShowtimeCard: React.FC<{ showtime: Showtime }> = ({ showtime }) => {
  const showDate = new Date(showtime.showDatetime);
  const isPast = showDate < new Date();

  const getStatusBadge = () => {
    const now = new Date();

    if (showDate < now) {
      return <Badge variant="secondary" className="bg-gray-600 text-white">Past</Badge>;
    } else if (showDate.getTime() - now.getTime() < 24 * 60 * 60 * 1000) {
      return <Badge variant="secondary" className="bg-red-600 text-white">Today</Badge>;
    } else if (showDate.getTime() - now.getTime() < 7 * 24 * 60 * 60 * 1000) {
      return <Badge variant="secondary" className="bg-orange-600 text-white">This Week</Badge>;
    } else {
      return <Badge variant="secondary" className="bg-green-600 text-white">Upcoming</Badge>;
    }
  };

  return (
    <Card className="bg-gray-800 border-gray-700 hover:border-indigo-500 transition-all duration-300 h-full">
      <CardContent className="p-6 flex flex-col h-full">
        {/* Movie Info */}
        <div className="flex items-start space-x-4 mb-4">
          <div className="w-16 h-24 bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
            {showtime.moviePosterUrl ? (
              <img
                src={showtime.moviePosterUrl}
                alt={showtime.movieTitle}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <Film className="w-6 h-6 text-gray-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-white mb-1 truncate">
              {showtime.movieTitle || 'Unknown Movie'}
            </h3>
            <div className="flex items-center text-gray-400 text-sm mb-2">
              <Building2 className="w-4 h-4 mr-1" />
              {showtime.theaterName || 'Unknown Theater'}
            </div>
            {showtime.movieDurationMinutes && (
              <div className="flex items-center text-gray-400 text-sm">
                <Clock className="w-4 h-4 mr-1" />
                {showtime.movieDurationMinutes} min
              </div>
            )}
          </div>
        </div>

        {/* Show Details */}
        <div className="space-y-3 flex-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center text-white">
              <Calendar className="w-4 h-4 mr-2 text-indigo-400" />
              <span className="font-medium">
                {showDate.toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric'
                })}
              </span>
            </div>
            {getStatusBadge()}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center text-white">
              <Clock className="w-4 h-4 mr-2 text-indigo-400" />
              <span className="font-bold text-lg">
                {showDate.toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                })}
              </span>
            </div>
            <div className="flex items-center text-green-400">
              <DollarSign className="w-4 h-4 mr-1" />
              <span className="font-bold">
                {showtime.price?.toLocaleString('en-US')} VND
              </span>
            </div>
          </div>

          {showtime.availableSeats !== undefined && showtime.theaterCapacity && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center text-gray-400">
                <Users className="w-4 h-4 mr-1" />
                Available Seats
              </div>
              <span className={`font-bold ${showtime.availableSeats > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {showtime.availableSeats} / {showtime.theaterCapacity}
              </span>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="mt-6 pt-4 border-t border-gray-700">
          <Button
            asChild
            className={`w-full ${isPast ? 'bg-gray-600 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
            disabled={isPast}
          >
            <Link to={isPast ? '#' : `/movies/${showtime.movieId}/showtimes/${showtime.id}/booking`}>
              {isPast ? (
                <>
                  <Eye className="w-4 h-4 mr-2" />
                  Show Details
                </>
              ) : (
                <>
                  <Ticket className="w-4 h-4 mr-2" />
                  Book Tickets
                </>
              )}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AllShowtimesPage;