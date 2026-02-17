import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  LayoutDashboard,
  Film,
  Building2,
  Clock,
  Ticket,
  Users,
  TrendingUp,
  BarChart3,
  Loader2,
  AlertCircle,
  RefreshCw,
  Calendar,
  Target,
  Activity
} from 'lucide-react';

// OLD API services (keep 100% logic) - UNCHANGED
import adminService, { MovieStats, ShowtimeStats, TheaterStats, TheaterUtilization } from '../../services/adminService';

// NEW UI components
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';

const AdminDashboard: React.FC = () => {
  const [movieStats, setMovieStats] = useState<MovieStats | null>(null);
  const [showtimeStats, setShowtimeStats] = useState<ShowtimeStats | null>(null);
  const [theaterStats, setTheaterStats] = useState<TheaterStats | null>(null);
  const [theaterUtilization, setTheaterUtilization] = useState<TheaterUtilization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [movies, showtimes, theaters, utilization] = await Promise.all([
          adminService.getMovieStats(),
          adminService.getShowtimeStats(),
          adminService.getTheaterStats(),
          adminService.getTheaterUtilization()
        ]);

        setMovieStats(movies);
        setShowtimeStats(showtimes);
        setTheaterStats(theaters);
        setTheaterUtilization(utilization);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // NEW loading UI (modern design)
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-red-500 mx-auto mb-4" />
              <p className="text-gray-300 text-lg">Loading dashboard...</p>
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
                <h2 className="text-2xl font-bold text-white mb-4">Error</h2>
                <p className="text-gray-400 mb-6">{error}</p>
                <Button onClick={() => window.location.reload()} className="bg-red-600 hover:bg-red-700">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
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
      <section className="bg-gradient-to-r from-slate-900 to-gray-800 py-16 text-center">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 rounded-full mb-6">
              <LayoutDashboard className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Admin Dashboard</h1>
            <p className="text-lg text-gray-200 max-w-2xl mx-auto">
              Cinema management overview
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content Section */}
      <main className="py-12 bg-gray-950">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="space-y-12">

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <Target className="w-6 h-6 mr-3 text-blue-500" />
                Quick Actions
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                >
                  <Card className="bg-gray-800 border-gray-700 hover:border-red-500 transition-all duration-300">
                    <CardContent className="p-6">
                      <Link to="/admin/movies" className="flex flex-col items-center space-y-4 text-center">
                        <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center">
                          <Film className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-white font-semibold">Manage Movies</span>
                      </Link>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                >
                  <Card className="bg-gray-800 border-gray-700 hover:border-blue-500 transition-all duration-300">
                    <CardContent className="p-6">
                      <Link to="/admin/theaters" className="flex flex-col items-center space-y-4 text-center">
                        <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                          <Building2 className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-white font-semibold">Manage Theaters</span>
                      </Link>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                >
                  <Card className="bg-gray-800 border-gray-700 hover:border-green-500 transition-all duration-300">
                    <CardContent className="p-6">
                      <Link to="/admin/showtimes" className="flex flex-col items-center space-y-4 text-center">
                        <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                          <Clock className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-white font-semibold">Manage Showtimes</span>
                      </Link>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                >
                  <Card className="bg-gray-800 border-gray-700 hover:border-yellow-500 transition-all duration-300">
                    <CardContent className="p-6">
                      <Link to="/admin/bookings" className="flex flex-col items-center space-y-4 text-center">
                        <div className="w-12 h-12 bg-yellow-600 rounded-lg flex items-center justify-center">
                          <Ticket className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-white font-semibold">View Bookings</span>
                      </Link>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </motion.div>

            {/* Statistics Cards */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <BarChart3 className="w-6 h-6 mr-3 text-green-500" />
                Statistics Overview
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                {/* Movie Stats */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                >
                  <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-700">
                        <h3 className="text-xl font-bold text-white">Movies</h3>
                        <Film className="w-8 h-8 text-red-500" />
                      </div>
                      {movieStats && (
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400 text-sm">Total Movies:</span>
                            <span className="text-white font-bold text-lg">{movieStats.totalMovies}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400 text-sm">Currently Showing:</span>
                            <span className="text-white font-bold text-lg">{movieStats.currentlyShowing}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400 text-sm">Upcoming:</span>
                            <span className="text-white font-bold text-lg">{movieStats.upcoming}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400 text-sm">Total Genres:</span>
                            <span className="text-white font-bold text-lg">{movieStats.totalGenres}</span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Theater Stats */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                >
                  <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-700">
                        <h3 className="text-xl font-bold text-white">Theaters</h3>
                        <Building2 className="w-8 h-8 text-blue-500" />
                      </div>
                      {theaterStats && (
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400 text-sm">Total Theaters:</span>
                            <span className="text-white font-bold text-lg">{theaterStats.totalTheaters}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400 text-sm">Standard:</span>
                            <span className="text-white font-bold text-lg">{theaterStats.standardTheaters}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400 text-sm">VIP:</span>
                            <span className="text-white font-bold text-lg">{theaterStats.vipTheaters}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400 text-sm">Total Capacity:</span>
                            <span className="text-white font-bold text-lg">{theaterStats.totalCapacity}</span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Showtime Stats */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                >
                  <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-700">
                        <h3 className="text-xl font-bold text-white">Showtimes</h3>
                        <Clock className="w-8 h-8 text-green-500" />
                      </div>
                      {showtimeStats && (
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400 text-sm">Total Showtimes:</span>
                            <span className="text-white font-bold text-lg">{showtimeStats.totalShowtimes}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400 text-sm">Upcoming:</span>
                            <span className="text-white font-bold text-lg">{showtimeStats.upcomingShowtimes}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400 text-sm">Available Seats:</span>
                            <span className="text-white font-bold text-lg">{showtimeStats.totalAvailableSeats}</span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </motion.div>

            {/* Theater Utilization */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <Activity className="w-6 h-6 mr-3 text-purple-500" />
                Theater Utilization
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {theaterUtilization.map((theater, index) => {
                  const utilizationRate = adminService.calculateUtilizationRate(
                    theater.totalBookedSeats,
                    theater.capacity
                  );

                  return (
                    <motion.div
                      key={theater.id}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                    >
                      <Card className="bg-gray-800 border-gray-700">
                        <CardContent className="p-6">
                          <div className="flex justify-between items-center mb-4">
                            <h4 className="text-lg font-bold text-white">{theater.name}</h4>
                            <Badge
                              style={{ backgroundColor: adminService.getUtilizationColor(utilizationRate) }}
                              className="text-white font-medium"
                            >
                              {utilizationRate}%
                            </Badge>
                          </div>
                          <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-400">Capacity:</span>
                              <span className="text-gray-300">{theater.capacity} seats</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-400">Booked:</span>
                              <span className="text-gray-300">{theater.totalBookedSeats} seats</span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2 mt-3">
                              <div
                                className="h-2 rounded-full transition-all duration-300"
                                style={{
                                  width: `${utilizationRate}%`,
                                  backgroundColor: adminService.getUtilizationColor(utilizationRate)
                                }}
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;