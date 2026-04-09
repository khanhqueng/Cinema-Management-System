import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
  Film,
  Search,
  Plus,
  Edit3,
  Trash2,
  X,
  Save,
  Loader2,
  AlertCircle,
  Calendar,
  Clock,
  User,
  DollarSign,
  Image,
  FileText,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";

import { movieService } from "../../services/movieService";
import adminService, { CreateMovieRequest } from "../../services/adminService";
import { Movie, PageResponse } from "../../types";

import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Textarea } from "../../components/ui/textarea";

const inputClass =
  "w-full h-11 px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 placeholder-gray-500";

const paginationBtnClass =
  "bg-gray-800! border-gray-600! text-white! hover:bg-gray-600! hover:text-white! disabled:opacity-50 disabled:cursor-not-allowed";

const MOVIE_GENRES = [
  "Action",
  "Adventure",
  "Animation",
  "Biography",
  "Comedy",
  "Crime",
  "Documentary",
  "Drama",
  "Family",
  "Fantasy",
  "History",
  "Horror",
  "Music",
  "Mystery",
  "Romance",
  "Sci-Fi",
  "Sport",
  "Thriller",
  "War",
  "Western",
] as const;

const AdminMovies: React.FC = () => {
  const [movies, setMovies] = useState<PageResponse<Movie> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [formData, setFormData] = useState<CreateMovieRequest>({
    title: "",
    description: "",
    genre: "",
    director: "",
    durationMinutes: 0,
    releaseDate: "",
    posterUrl: "",
    priceBase: 0,
  });
  const [currentPage, setCurrentPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [uploadingPoster, setUploadingPoster] = useState(false);
  const [posterUploadError, setPosterUploadError] = useState<string | null>(
    null,
  );
  const [genreError, setGenreError] = useState<string | null>(null);
  const releaseDateInputRef = useRef<HTMLInputElement>(null);
  const posterFileInputRef = useRef<HTMLInputElement>(null);

  const fetchMovies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await movieService.getAllMovies({
        page: currentPage,
        size: 10,
        sortBy: "createdAt",
        sortDir: "desc",
      });
      setMovies(response);
    } catch (err) {
      console.error("Error fetching movies:", err);
      setError("Failed to load movies");
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    fetchMovies();
  }, [fetchMovies]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchMovies();
      return;
    }
    try {
      setLoading(true);
      const response = await movieService.searchMovies({
        query: searchQuery,
        page: 0,
        size: 10,
      });
      setMovies(response);
    } catch (err) {
      console.error("Error searching movies:", err);
      setError("Failed to search movies");
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.genre.trim()) {
      setGenreError("Please select a genre.");
      return;
    }
    setGenreError(null);

    try {
      if (editingMovie) {
        await adminService.updateMovie(editingMovie.id, formData);
        toast.success("Movie updated successfully!");
      } else {
        await adminService.createMovie(formData);
        toast.success("Movie created successfully!");
      }
      setShowForm(false);
      setEditingMovie(null);
      resetForm();
      fetchMovies();
    } catch (err) {
      console.error("Error saving movie:", err);
      toast.error("Failed to save movie");
    }
  };

  const handlePosterUpload = async (file: File) => {
    try {
      setUploadingPoster(true);
      setPosterUploadError(null);
      const response = await adminService.uploadMoviePoster(file);
      setFormData((prev) => ({ ...prev, posterUrl: response.publicUrl }));
    } catch (err) {
      console.error("Error uploading poster:", err);
      setPosterUploadError("Không thể upload ảnh. Vui lòng thử lại.");
    } finally {
      setUploadingPoster(false);
    }
  };

  const handleEdit = (movie: Movie) => {
    setEditingMovie(movie);
    setPosterUploadError(null);
    setGenreError(null);
    setFormData({
      title: movie.title,
      description: movie.description,
      genre: movie.genre,
      director: movie.director,
      durationMinutes: movie.durationMinutes,
      releaseDate: movie.releaseDate.split("T")[0],
      posterUrl: movie.posterUrl || "",
      priceBase: movie.priceBase,
    });
    setShowForm(true);
  };

  const handleDelete = async (movieId: number) => {
    if (!window.confirm("Are you sure you want to delete this movie?")) return;
    try {
      await adminService.deleteMovie(movieId);
      toast.success("Movie deleted successfully!");
      fetchMovies();
    } catch (err) {
      console.error("Error deleting movie:", err);
      toast.error("Failed to delete movie");
    }
  };

  const resetForm = () => {
    setPosterUploadError(null);
    setGenreError(null);
    setFormData({
      title: "",
      description: "",
      genre: "",
      director: "",
      durationMinutes: 0,
      releaseDate: "",
      posterUrl: "",
      priceBase: 0,
    });
  };

  if (loading && !movies) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
        <p className="text-gray-400">Loading movies...</p>
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
            <Film className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Movie Management</h1>
            <p className="text-sm text-gray-400">
              {movies?.totalElements ?? 0} total movies
            </p>
          </div>
        </div>
        <Button
          onClick={() => {
            setEditingMovie(null);
            resetForm();
            setShowForm(true);
          }}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Movie
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

      {/* Search */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            title="Search movies"
            placeholder="Search movies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="w-full h-11 pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 placeholder-gray-500"
          />
        </div>
        <Button
          onClick={handleSearch}
          className="bg-red-600 h-auto hover:bg-red-700 text-white"
        >
          <Search className="w-4 h-4 mr-2" /> Search
        </Button>
        {searchQuery && (
          <Button
            variant="outline"
            onClick={() => {
              setSearchQuery("");
              fetchMovies();
            }}
            className="border-gray-700 text-gray-300 hover:bg-gray-700"
          >
            <X className="w-4 h-4 mr-1" /> Clear
          </Button>
        )}
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <div className="flex items-center gap-2">
                <Film className="w-5 h-5 text-red-400" />
                <h2 className="text-lg font-semibold text-white">
                  {editingMovie ? "Edit Movie" : "Add New Movie"}
                </h2>
              </div>
              <button
                onClick={() => {
                  setShowForm(false);
                  setPosterUploadError(null);
                }}
                className="text-gray-400 hover:text-white hover:bg-gray-700 p-1.5 rounded-lg transition-colors"
                title="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleFormSubmit}
              className="p-6 overflow-auto space-y-5"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-300 flex items-center gap-1.5">
                    <Film className="w-3.5 h-3.5" /> Title *
                  </label>
                  <Input
                    type="text"
                    title="Movie title"
                    placeholder="e.g. The Dark Knight"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    required
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-300 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" /> Genre *
                  </label>
                  <Select
                    value={formData.genre || "__none__"}
                    onValueChange={(value) => {
                      const nextGenre = value === "__none__" ? "" : value;
                      setFormData({
                        ...formData,
                        genre: nextGenre,
                      });
                      setGenreError(nextGenre ? null : "Please select a genre.");
                    }}
                  >
                    <SelectTrigger
                      title="Movie genre"
                      className={`min-h-11 w-full border bg-gray-800 text-sm text-white ${
                        genreError
                          ? "border-red-500 focus-visible:ring-red-500/50"
                          : "border-gray-700"
                      }`}
                    >
                      <SelectValue placeholder="Select genre" />
                    </SelectTrigger>
                    <SelectContent className="max-h-72 border-gray-700 bg-gray-800 text-white">
                      <SelectItem value="__none__">Select genre</SelectItem>
                      {MOVIE_GENRES.map((genre) => (
                        <SelectItem key={genre} value={genre}>
                          {genre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input type="hidden" value={formData.genre} />
                  {genreError && (
                    <p className="text-xs text-red-300">{genreError}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-300 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" /> Director *
                  </label>
                  <Input
                    type="text"
                    title="Movie director"
                    placeholder="e.g. Christopher Nolan"
                    value={formData.director}
                    onChange={(e) =>
                      setFormData({ ...formData, director: e.target.value })
                    }
                    required
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-300 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> Duration (min) *
                  </label>
                  <Input
                    type="number"
                    title="Duration in minutes"
                    placeholder="e.g. 120"
                    value={formData.durationMinutes}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        durationMinutes: parseInt(e.target.value),
                      })
                    }
                    required
                    min="1"
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-300 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" /> Release Date *
                  </label>
                  <div className="relative">
                    <Input
                      ref={releaseDateInputRef}
                      type="date"
                      title="Release date"
                      value={formData.releaseDate}
                      onChange={(e) =>
                        setFormData({ ...formData, releaseDate: e.target.value })
                      }
                      required
                      className={`${inputClass} pr-10 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer`}
                    />
                    <button
                      type="button"
                      title="Open release date picker"
                      onClick={() =>
                        (releaseDateInputRef.current as HTMLInputElement & {
                          showPicker?: () => void;
                        })?.showPicker?.() ?? releaseDateInputRef.current?.focus()
                      }
                      className="absolute inset-y-0 right-0 px-3 flex items-center text-white/90 hover:text-white"
                    >
                      <Calendar className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-300 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5" /> Base Price (VND) *
                  </label>
                  <Input
                    type="number"
                    title="Base price in VND"
                    placeholder="e.g. 100000"
                    value={formData.priceBase}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        priceBase: parseFloat(e.target.value),
                      })
                    }
                    required
                    min="0"
                    step="1000"
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-300 flex items-center gap-1.5">
                  <Image className="w-3.5 h-3.5" /> Poster URL{" "}
                  <span className="text-gray-500">(optional)</span>
                </label>
                <div className="flex items-center gap-3">
                  <Input
                    ref={posterFileInputRef}
                    type="file"
                    accept="image/*"
                    title="Upload poster image"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handlePosterUpload(file);
                      }
                      e.target.value = "";
                    }}
                    disabled={uploadingPoster}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={uploadingPoster}
                    onClick={() => posterFileInputRef.current?.click()}
                    className="h-11 border-gray-600 text-gray-200 hover:bg-gray-700 hover:text-white"
                  >
                    {uploadingPoster ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Image className="w-4 h-4 mr-2" />
                        Upload from device
                      </>
                    )}
                  </Button>
                  <span className="text-xs text-gray-400">
                    JPG, PNG, WEBP (max 5MB)
                  </span>
                </div>
                <Input
                  type="url"
                  title="Poster image URL"
                  placeholder="https://example.com/poster.jpg"
                  value={formData.posterUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, posterUrl: e.target.value })
                  }
                  className={inputClass}
                />
                {uploadingPoster && (
                  <p className="text-xs text-blue-300 flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Đang upload ảnh...
                  </p>
                )}
                {posterUploadError && (
                  <p className="text-xs text-red-300">{posterUploadError}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-300 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" /> Description *
                </label>
                <Textarea
                  title="Movie description"
                  placeholder="Enter movie description..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  required
                  rows={3}
                  className={`${inputClass} resize-vertical`}
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setPosterUploadError(null);
                  }}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  <X className="w-4 h-4 mr-2" /> Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={uploadingPoster}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {uploadingPoster
                    ? "Uploading poster..."
                    : `${editingMovie ? "Update" : "Create"} Movie`}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Movies Table */}
      {movies && (
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
                      Poster
                    </th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">
                      Title
                    </th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">
                      Genre
                    </th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">
                      Director
                    </th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">
                      Duration
                    </th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">
                      Release
                    </th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">
                      Price
                    </th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {movies.content.map((movie) => (
                    <tr
                      key={movie.id}
                      className="hover:bg-gray-800/40 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <img
                          src={
                            movie.posterUrl ||
                            `https://placehold.co/40x60?text=${encodeURIComponent(
                              movie.title.slice(0, 2),
                            )}`
                          }
                          alt={movie.title}
                          className="w-10 h-14 object-cover rounded"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-white">
                          {movie.title}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5 line-clamp-1 max-w-xs">
                          {movie.description}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="secondary"
                          className="bg-purple-600/20 text-purple-300 border-purple-500/30"
                        >
                          {movie.genre}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-300">
                        {movie.director}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-gray-300">
                          <Clock className="w-3.5 h-3.5 text-gray-500" />
                          {movie.durationMinutes} min
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-gray-300">
                          <Calendar className="w-3.5 h-3.5 text-gray-500" />
                          {adminService.formatDate(movie.releaseDate)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-red-400 font-semibold">
                          {adminService.formatCurrency(movie.priceBase)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(movie)}
                            title="Edit movie"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(movie.id)}
                            title="Delete movie"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
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
            {movies.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800 bg-gray-800/30">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 0}
                  className={paginationBtnClass}
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
                    {movies.totalPages}
                  </span>
                  <span className="text-gray-600 ml-2">
                    ({movies.totalElements} total)
                  </span>
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage >= movies.totalPages - 1}
                  className={paginationBtnClass}
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

export default AdminMovies;
