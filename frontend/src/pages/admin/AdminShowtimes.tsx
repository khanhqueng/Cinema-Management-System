import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  Clock,
  Film,
  Building2,
  Plus,
  Edit3,
  Trash2,
  X,
  Save,
  Loader2,
  AlertCircle,
  Calendar,
  DollarSign,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import adminService, {
  CreateShowtimeRequest,
} from "../../services/adminService";
import { movieService } from "../../services/movieService";
import { theaterService } from "../../services/theaterService";
import { showtimeService } from "../../services/showtimeService";
import { Movie, Theater, Showtime, PageResponse } from "../../types";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";

const AdminShowtimes: React.FC = () => {
  const [showtimes, setShowtimes] = useState<PageResponse<Showtime> | null>(
    null
  );
  const [movies, setMovies] = useState<Movie[]>([]);
  const [theaters, setTheaters] = useState<Theater[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingShowtime, setEditingShowtime] = useState<Showtime | null>(null);
  const [formData, setFormData] = useState<CreateShowtimeRequest>({
    movieId: 0,
    theaterId: 0,
    showDatetime: "",
    price: 0,
  });
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    fetchInitialData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchShowtimes();
  }, [currentPage]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchInitialData = async () => {
    try {
      const [moviesResponse, theatersResponse] = await Promise.all([
        movieService.getAllMovies({
          page: 0,
          size: 100,
          sortBy: "title",
          sortDir: "asc",
        }),
        theaterService.getAllTheaters({
          page: 0,
          size: 100,
          sortBy: "name",
          sortDir: "asc",
        }),
      ]);
      setMovies(moviesResponse.content);
      setTheaters(theatersResponse.content);
      fetchShowtimes();
    } catch (err) {
      console.error("Error fetching initial data:", err);
      setError("Failed to load initial data");
    }
  };

  const fetchShowtimes = async () => {
    try {
      setLoading(true);
      const data = await showtimeService.getAllShowtimes({
        page: currentPage,
        size: 10,
        sortBy: "showDatetime",
        sortDir: "desc",
      });
      setShowtimes(data);
    } catch (err) {
      console.error("Error fetching showtimes:", err);
      setError("Failed to load showtimes");
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingShowtime) {
        await adminService.updateShowtime(editingShowtime.id, formData);
        alert("Showtime updated successfully!");
      } else {
        await adminService.createShowtime(formData);
        alert("Showtime created successfully!");
      }
      setShowForm(false);
      setEditingShowtime(null);
      resetForm();
      fetchShowtimes();
    } catch (err) {
      console.error("Error saving showtime:", err);
      alert("Failed to save showtime");
    }
  };

  const handleEdit = (showtime: Showtime) => {
    setEditingShowtime(showtime);
    setFormData({
      movieId: showtime.movieId,
      theaterId: showtime.theaterId,
      showDatetime: new Date(showtime.showDatetime).toISOString().slice(0, 16),
      price: showtime.price,
    });
    setShowForm(true);
  };

  const handleDelete = async (showtimeId: number) => {
    if (
      window.confirm(
        "Are you sure you want to delete this showtime? This will also cancel all associated bookings."
      )
    ) {
      try {
        await adminService.deleteShowtime(showtimeId);
        alert("Showtime deleted successfully!");
        fetchShowtimes();
      } catch (err) {
        console.error("Error deleting showtime:", err);
        alert("Failed to delete showtime");
      }
    }
  };

  const resetForm = () => {
    setFormData({ movieId: 0, theaterId: 0, showDatetime: "", price: 0 });
  };

  const getMovieTitle = (movieId: number) =>
    movies.find((m) => m.id === movieId)?.title || "Unknown Movie";

  const getTheaterName = (theaterId: number) =>
    theaters.find((t) => t.id === theaterId)?.name || "Unknown Theater";

  // Loading state
  if (loading && !showtimes) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
        <p className="text-gray-400">Loading showtimes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-600/15 border border-red-500/20 rounded-lg">
            <Clock className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">
              Showtime Management
            </h1>
            <p className="text-sm text-gray-400">
              {showtimes?.totalElements ?? 0} total showtimes
            </p>
          </div>
        </div>
        <Button
          onClick={() => {
            setEditingShowtime(null);
            resetForm();
            setShowForm(true);
          }}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Showtime
        </Button>
      </motion.div>

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 bg-red-900/40 border border-red-600/50 text-red-300 p-4 rounded-lg text-sm"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </motion.div>
      )}

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-red-400" />
                <h2 className="text-lg font-semibold text-white">
                  {editingShowtime ? "Edit Showtime" : "Add New Showtime"}
                </h2>
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-white hover:bg-gray-700 p-1.5 rounded-lg transition-colors"
                title="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form
              onSubmit={handleFormSubmit}
              className="p-6 overflow-auto space-y-5"
            >
              {/* Movie & Theater */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-300 flex items-center gap-1.5">
                    <Film className="w-3.5 h-3.5" /> Movie *
                  </label>
                  <select
                    value={formData.movieId}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        movieId: parseInt(e.target.value),
                      })
                    }
                    required
                    title="Select movie"
                    className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  >
                    <option value={0}>Select a movie</option>
                    {movies.map((movie) => (
                      <option key={movie.id} value={movie.id}>
                        {movie.title} (
                        {adminService.formatDate(movie.releaseDate)})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-300 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" /> Theater *
                  </label>
                  <select
                    value={formData.theaterId}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        theaterId: parseInt(e.target.value),
                      })
                    }
                    required
                    title="Select theater"
                    className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  >
                    <option value={0}>Select a theater</option>
                    {theaters.map((theater) => (
                      <option key={theater.id} value={theater.id}>
                        {theater.name} (Capacity: {theater.capacity})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date & Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-300 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" /> Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.showDatetime}
                    onChange={(e) =>
                      setFormData({ ...formData, showDatetime: e.target.value })
                    }
                    required
                    title="Show date and time"
                    className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-300 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5" /> Price (VND) *
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        price: parseFloat(e.target.value),
                      })
                    }
                    required
                    min="0"
                    step="1000"
                    placeholder="e.g., 100000"
                    className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 placeholder-gray-500"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  <X className="w-4 h-4 mr-2" /> Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {editingShowtime ? "Update" : "Create"} Showtime
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Showtimes Table */}
      {showtimes && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gray-900 border-gray-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700 bg-gray-800/50">
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">
                      Movie
                    </th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">
                      Theater
                    </th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">
                      Date & Time
                    </th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">
                      Price
                    </th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">
                      Seats
                    </th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">
                      Status
                    </th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {showtimes.content.map((showtime) => (
                    <tr
                      key={showtime.id}
                      className="hover:bg-gray-800/40 transition-colors"
                    >
                      {/* Movie */}
                      <td className="px-4 py-3">
                        <div className="font-medium text-white">
                          {showtime.movieTitle ||
                            getMovieTitle(showtime.movieId)}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {showtime.movieDurationMinutes || "N/A"} min
                        </div>
                      </td>

                      {/* Theater */}
                      <td className="px-4 py-3">
                        <div className="font-medium text-white">
                          {showtime.theaterName ||
                            getTheaterName(showtime.theaterId)}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          Cap: {showtime.theaterCapacity || "N/A"}
                        </div>
                      </td>

                      {/* Date & Time */}
                      <td className="px-4 py-3">
                        <div className="text-white font-medium">
                          {adminService.formatDateTime(showtime.showDatetime)}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {getRelativeTime(showtime.showDatetime)}
                        </div>
                      </td>

                      {/* Price */}
                      <td className="px-4 py-3">
                        <span className="text-red-400 font-semibold">
                          {adminService.formatCurrency(showtime.price)}
                        </span>
                      </td>

                      {/* Seats */}
                      <td className="px-4 py-3">
                        <div className="text-white font-semibold">
                          {showtime.availableSeats}
                          <span className="text-gray-500 font-normal text-xs ml-1">
                            / {showtime.theaterCapacity || "N/A"}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {getOccupancyDisplay(
                            showtime.availableSeats,
                            showtime.theaterCapacity
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <StatusBadge dateTimeString={showtime.showDatetime} />
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(showtime)}
                            disabled={isPast(showtime.showDatetime)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Edit"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(showtime.id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {showtimes.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800 bg-gray-800/30">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 0}
                  className="border-gray-700 text-gray-300 hover:bg-gray-700"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" /> Previous
                </Button>
                <span className="text-sm text-gray-400">
                  Page{" "}
                  <span className="text-white font-medium">
                    {currentPage + 1}
                  </span>{" "}
                  of{" "}
                  <span className="text-white font-medium">
                    {showtimes.totalPages}
                  </span>
                  <span className="text-gray-600 ml-2">
                    ({showtimes.totalElements} total)
                  </span>
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage >= showtimes.totalPages - 1}
                  className="border-gray-700 text-gray-300 hover:bg-gray-700"
                >
                  Next <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}
          </Card>
        </motion.div>
      )}
    </div>
  );
};

// Status Badge component
function StatusBadge({ dateTimeString }: { dateTimeString: string }) {
  const status = getShowtimeStatus(dateTimeString);
  const styles: Record<string, string> = {
    Past: "bg-gray-700/50 text-gray-400 border-gray-600/50",
    Today: "bg-red-600/20 text-red-400 border-red-500/30",
    "This Week": "bg-orange-600/20 text-orange-400 border-orange-500/30",
    Upcoming: "bg-green-600/20 text-green-400 border-green-500/30",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
        styles[status] ?? styles["Past"]
      }`}
    >
      {status}
    </span>
  );
}

// Helper functions
const getRelativeTime = (dateTimeString: string): string => {
  const diffInHours = Math.round(
    (new Date(dateTimeString).getTime() - Date.now()) / (1000 * 60 * 60)
  );
  if (diffInHours < -24)
    return `${Math.abs(Math.round(diffInHours / 24))} days ago`;
  if (diffInHours < 0) return `${Math.abs(diffInHours)} hours ago`;
  if (diffInHours < 24) return `in ${diffInHours} hours`;
  return `in ${Math.round(diffInHours / 24)} days`;
};

const getShowtimeStatus = (dateTimeString: string): string => {
  const now = Date.now();
  const showTime = new Date(dateTimeString).getTime();
  if (showTime < now) return "Past";
  if (showTime - now < 24 * 60 * 60 * 1000) return "Today";
  if (showTime - now < 7 * 24 * 60 * 60 * 1000) return "This Week";
  return "Upcoming";
};

const getOccupancyDisplay = (
  availableSeats: number,
  totalCapacity: number
): string => {
  if (!totalCapacity) return "N/A";
  const rate = Math.round(
    ((totalCapacity - availableSeats) / totalCapacity) * 100
  );
  return `${rate}% booked`;
};

const isPast = (dateTimeString: string): boolean =>
  new Date(dateTimeString) < new Date();

export default AdminShowtimes;
