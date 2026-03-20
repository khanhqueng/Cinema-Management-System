import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import {
  LayoutDashboard,
  Film,
  Building2,
  Clock,
  Ticket,
  BarChart3,
  Loader2,
  AlertCircle,
  RefreshCw,
  Target,
  Activity,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

// OLD API services (keep 100% logic) - UNCHANGED
import adminService, {
  MovieStats,
  ShowtimeStats,
  TheaterStats,
  TheaterUtilization,
} from "../../services/adminService";

// NEW UI components
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";

const CHART_COLORS = [
  "#ef4444",
  "#3b82f6",
  "#22c55e",
  "#eab308",
  "#a855f7",
  "#ec4899",
];

const CustomTooltipContent = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 shadow-lg">
      <p className="text-gray-300 text-sm font-medium mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-sm" style={{ color: entry.color }}>
          {entry.name}: <span className="font-bold">{entry.value}</span>
        </p>
      ))}
    </div>
  );
};

// Maps utilization rate to Tailwind background color class
const getUtilizationBarClass = (rate: number): string => {
  if (rate >= 80) return "bg-red-500";
  if (rate >= 60) return "bg-orange-500";
  if (rate >= 40) return "bg-yellow-500";
  return "bg-green-500";
};

// Maps utilization rate to nearest Tailwind width class (steps of 10)
const getUtilizationWidthClass = (rate: number): string => {
  const clamped = Math.min(Math.max(Math.round(rate / 10) * 10, 0), 100);
  const map: Record<number, string> = {
    0: "w-0",
    10: "w-1/10",
    20: "w-1/5",
    30: "w-3/10",
    40: "w-2/5",
    50: "w-1/2",
    60: "w-3/5",
    70: "w-7/10",
    80: "w-4/5",
    90: "w-9/10",
    100: "w-full",
  };
  return map[clamped] ?? "w-0";
};

const AdminDashboard: React.FC = () => {
  const [movieStats, setMovieStats] = useState<MovieStats | null>(null);
  const [showtimeStats, setShowtimeStats] = useState<ShowtimeStats | null>(
    null,
  );
  const [theaterStats, setTheaterStats] = useState<TheaterStats | null>(null);
  const [theaterUtilization, setTheaterUtilization] = useState<
    TheaterUtilization[]
  >([]);
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
          adminService.getTheaterUtilization(),
        ]);

        setMovieStats(movies);
        setShowtimeStats(showtimes);
        setTheaterStats(theaters);
        setTheaterUtilization(utilization);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load dashboard data");
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
          <div className="flex items-center justify-center min-h-100">
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
          <div className="flex items-center justify-center min-h-100">
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-8 text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-4">Error</h2>
                <p className="text-gray-400 mb-6">{error}</p>
                <Button
                  onClick={() => window.location.reload()}
                  className="bg-red-600 hover:bg-red-700"
                >
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
      <section className="bg-linear-to-r from-slate-900 to-gray-800 py-16 text-center">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 rounded-full mb-6">
              <LayoutDashboard className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Admin Dashboard
            </h1>
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
            {/* Charts Section */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <BarChart3 className="w-6 h-6 mr-3 text-emerald-500" />
                Analytics Overview
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Movie Distribution Pie Chart */}
                {movieStats && (
                  <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="p-6">
                      <h3 className="text-lg font-bold text-white mb-4">
                        Movie Status Distribution
                      </h3>
                      <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                          <Pie
                            data={[
                              {
                                name: "Currently Showing",
                                value: movieStats.currentlyShowing,
                              },
                              { name: "Upcoming", value: movieStats.upcoming },
                              {
                                name: "Others",
                                value: Math.max(
                                  0,
                                  movieStats.totalMovies -
                                    movieStats.currentlyShowing -
                                    movieStats.upcoming,
                                ),
                              },
                            ].filter((d) => d.value > 0)}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={3}
                            dataKey="value"
                            stroke="none"
                          >
                            {[
                              {
                                name: "Currently Showing",
                                value: movieStats.currentlyShowing,
                              },
                              { name: "Upcoming", value: movieStats.upcoming },
                              {
                                name: "Others",
                                value: Math.max(
                                  0,
                                  movieStats.totalMovies -
                                    movieStats.currentlyShowing -
                                    movieStats.upcoming,
                                ),
                              },
                            ]
                              .filter((d) => d.value > 0)
                              .map((_, i) => (
                                <Cell key={i} fill={CHART_COLORS[i]} />
                              ))}
                          </Pie>
                          <Tooltip content={<CustomTooltipContent />} />
                          <Legend
                            wrapperStyle={{
                              color: "#d1d5db",
                              fontSize: 13,
                              paddingTop: 10,
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="text-center mt-2">
                        <span className="text-3xl font-bold text-white">
                          {movieStats.totalMovies}
                        </span>
                        <span className="text-gray-400 text-sm ml-2">
                          total movies
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Theater Type Pie Chart */}
                {theaterStats && (
                  <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="p-6">
                      <h3 className="text-lg font-bold text-white mb-4">
                        Theater Types
                      </h3>
                      <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                          <Pie
                            data={[
                              {
                                name: "Standard",
                                value: theaterStats.standardTheaters,
                              },
                              { name: "VIP", value: theaterStats.vipTheaters },
                            ].filter((d) => d.value > 0)}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={3}
                            dataKey="value"
                            stroke="none"
                          >
                            <Cell fill="#3b82f6" />
                            <Cell fill="#eab308" />
                          </Pie>
                          <Tooltip content={<CustomTooltipContent />} />
                          <Legend
                            wrapperStyle={{
                              color: "#d1d5db",
                              fontSize: 13,
                              paddingTop: 10,
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="text-center mt-2">
                        <span className="text-3xl font-bold text-white">
                          {theaterStats.totalTheaters}
                        </span>
                        <span className="text-gray-400 text-sm ml-2">
                          total theaters
                        </span>
                        <span className="text-gray-500 text-sm ml-1">
                          ({theaterStats.totalCapacity} seats)
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Theater Utilization Bar Chart */}
                {theaterUtilization.length > 0 && (
                  <Card className="bg-gray-800 border-gray-700 lg:col-span-2">
                    <CardContent className="p-6">
                      <h3 className="text-lg font-bold text-white mb-4">
                        Theater Utilization Rate
                      </h3>
                      <ResponsiveContainer width="100%" height={320}>
                        <BarChart
                          data={theaterUtilization.map((t) => ({
                            name: t.name,
                            "Booked Seats": t.totalBookedSeats,
                            "Available Seats": Math.max(
                              0,
                              t.capacity - t.totalBookedSeats,
                            ),
                            rate: adminService.calculateUtilizationRate(
                              t.totalBookedSeats,
                              t.capacity,
                            ),
                          }))}
                          margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#374151"
                          />
                          <XAxis
                            dataKey="name"
                            tick={{ fill: "#9ca3af", fontSize: 12 }}
                          />
                          <YAxis tick={{ fill: "#9ca3af", fontSize: 12 }} />
                          <Tooltip content={<CustomTooltipContent />} />
                          <Legend
                            wrapperStyle={{ color: "#d1d5db", fontSize: 13 }}
                          />
                          <Bar
                            dataKey="Booked Seats"
                            stackId="a"
                            fill="#ef4444"
                            radius={[0, 0, 0, 0]}
                          />
                          <Bar
                            dataKey="Available Seats"
                            stackId="a"
                            fill="#374151"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}

                {/* Showtimes Overview */}
                {showtimeStats &&
                  (() => {
                    const pastShowtimes = Math.max(
                      0,
                      showtimeStats.totalShowtimes -
                        showtimeStats.upcomingShowtimes,
                    );
                    const upcomingPct =
                      showtimeStats.totalShowtimes > 0
                        ? Math.round(
                            (showtimeStats.upcomingShowtimes /
                              showtimeStats.totalShowtimes) *
                              100,
                          )
                        : 0;
                    return (
                      <Card className="bg-gray-800 border-gray-700 lg:col-span-2">
                        <CardContent className="p-6">
                          <h3 className="text-lg font-bold text-white mb-6">
                            Showtimes Overview
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Donut chart */}
                            <div>
                              <ResponsiveContainer width="100%" height={240}>
                                <PieChart>
                                  <Pie
                                    data={[
                                      {
                                        name: "Upcoming",
                                        value: showtimeStats.upcomingShowtimes,
                                      },
                                      { name: "Past", value: pastShowtimes },
                                    ].filter((d) => d.value > 0)}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={55}
                                    outerRadius={90}
                                    paddingAngle={3}
                                    dataKey="value"
                                    stroke="none"
                                  >
                                    <Cell fill="#22c55e" />
                                    <Cell fill="#4b5563" />
                                  </Pie>
                                  <Tooltip content={<CustomTooltipContent />} />
                                  <Legend
                                    wrapperStyle={{
                                      color: "#d1d5db",
                                      fontSize: 13,
                                      paddingTop: 8,
                                    }}
                                  />
                                </PieChart>
                              </ResponsiveContainer>
                            </div>

                            {/* Stat cards */}
                            <div className="flex flex-col justify-center gap-4">
                              <div className="bg-gray-900 rounded-xl p-4 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-lg bg-green-600/20 flex items-center justify-center">
                                  <Clock className="w-6 h-6 text-green-400" />
                                </div>
                                <div>
                                  <p className="text-gray-400 text-sm">
                                    Total Showtimes
                                  </p>
                                  <p className="text-white text-2xl font-bold">
                                    {showtimeStats.totalShowtimes}
                                  </p>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div className="bg-gray-900 rounded-xl p-4 text-center">
                                  <p className="text-green-400 text-2xl font-bold">
                                    {showtimeStats.upcomingShowtimes}
                                  </p>
                                  <p className="text-gray-400 text-xs mt-1">
                                    Upcoming
                                  </p>
                                </div>
                                <div className="bg-gray-900 rounded-xl p-4 text-center">
                                  <p className="text-gray-400 text-2xl font-bold">
                                    {pastShowtimes}
                                  </p>
                                  <p className="text-gray-400 text-xs mt-1">
                                    Past
                                  </p>
                                </div>
                              </div>

                              <div className="bg-gray-900 rounded-xl p-4">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-gray-400 text-sm">
                                    Upcoming ratio
                                  </span>
                                  <span className="text-green-400 font-bold text-sm">
                                    {upcomingPct}%
                                  </span>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-2">
                                  <div
                                    className="h-2 rounded-full bg-green-500 transition-all duration-500"
                                    style={{ width: `${upcomingPct}%` }}
                                  />
                                </div>
                              </div>

                              <div className="bg-gray-900 rounded-xl p-4 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-lg bg-blue-600/20 flex items-center justify-center">
                                  <Ticket className="w-6 h-6 text-blue-400" />
                                </div>
                                <div>
                                  <p className="text-gray-400 text-sm">
                                    Available Seats
                                  </p>
                                  <p className="text-white text-2xl font-bold">
                                    {showtimeStats.totalAvailableSeats.toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })()}
              </div>
            </motion.div>

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
                      <Link
                        to="/admin/movies"
                        className="flex flex-col items-center space-y-4 text-center"
                      >
                        <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center">
                          <Film className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-white font-semibold">
                          Manage Movies
                        </span>
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
                      <Link
                        to="/admin/theaters"
                        className="flex flex-col items-center space-y-4 text-center"
                      >
                        <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                          <Building2 className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-white font-semibold">
                          Manage Theaters
                        </span>
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
                      <Link
                        to="/admin/showtimes"
                        className="flex flex-col items-center space-y-4 text-center"
                      >
                        <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                          <Clock className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-white font-semibold">
                          Manage Showtimes
                        </span>
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
                      <Link
                        to="/admin/bookings"
                        className="flex flex-col items-center space-y-4 text-center"
                      >
                        <div className="w-12 h-12 bg-yellow-600 rounded-lg flex items-center justify-center">
                          <Ticket className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-white font-semibold">
                          View Bookings
                        </span>
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
                            <span className="text-gray-400 text-sm">
                              Total Movies:
                            </span>
                            <span className="text-white font-bold text-lg">
                              {movieStats.totalMovies}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400 text-sm">
                              Currently Showing:
                            </span>
                            <span className="text-white font-bold text-lg">
                              {movieStats.currentlyShowing}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400 text-sm">
                              Upcoming:
                            </span>
                            <span className="text-white font-bold text-lg">
                              {movieStats.upcoming}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400 text-sm">
                              Total Genres:
                            </span>
                            <span className="text-white font-bold text-lg">
                              {movieStats.totalGenres}
                            </span>
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
                        <h3 className="text-xl font-bold text-white">
                          Theaters
                        </h3>
                        <Building2 className="w-8 h-8 text-blue-500" />
                      </div>
                      {theaterStats && (
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400 text-sm">
                              Total Theaters:
                            </span>
                            <span className="text-white font-bold text-lg">
                              {theaterStats.totalTheaters}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400 text-sm">
                              Standard:
                            </span>
                            <span className="text-white font-bold text-lg">
                              {theaterStats.standardTheaters}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400 text-sm">VIP:</span>
                            <span className="text-white font-bold text-lg">
                              {theaterStats.vipTheaters}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400 text-sm">
                              Total Capacity:
                            </span>
                            <span className="text-white font-bold text-lg">
                              {theaterStats.totalCapacity}
                            </span>
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
                        <h3 className="text-xl font-bold text-white">
                          Showtimes
                        </h3>
                        <Clock className="w-8 h-8 text-green-500" />
                      </div>
                      {showtimeStats && (
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400 text-sm">
                              Total Showtimes:
                            </span>
                            <span className="text-white font-bold text-lg">
                              {showtimeStats.totalShowtimes}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400 text-sm">
                              Upcoming:
                            </span>
                            <span className="text-white font-bold text-lg">
                              {showtimeStats.upcomingShowtimes}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400 text-sm">
                              Available Seats:
                            </span>
                            <span className="text-white font-bold text-lg">
                              {showtimeStats.totalAvailableSeats}
                            </span>
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
              {theaterUtilization.length === 0 && (
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-12 text-center">
                    <Activity className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">
                      No Utilization Data
                    </h3>
                    <p className="text-gray-400">
                      There is no theater utilization data available yet.
                    </p>
                  </CardContent>
                </Card>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {theaterUtilization.map((theater, index) => {
                  const utilizationRate = adminService.calculateUtilizationRate(
                    theater.totalBookedSeats,
                    theater.capacity,
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
                            <h4 className="text-lg font-bold text-white">
                              {theater.name}
                            </h4>
                            <Badge
                              className={`text-white font-medium ${getUtilizationBarClass(
                                utilizationRate,
                              )}`}
                            >
                              {utilizationRate}%
                            </Badge>
                          </div>
                          <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-400">Capacity:</span>
                              <span className="text-gray-300">
                                {theater.capacity} seats
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-400">Booked:</span>
                              <span className="text-gray-300">
                                {theater.totalBookedSeats} seats
                              </span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2 mt-3">
                              <div
                                className={`h-2 rounded-full transition-all duration-300 ${getUtilizationWidthClass(
                                  utilizationRate,
                                )} ${getUtilizationBarClass(utilizationRate)}`}
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
