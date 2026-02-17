import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
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
  CheckCircle2,
  Calendar,
  Clock,
  User,
  DollarSign,
  Image,
  FileText,
  ArrowLeft,
  ArrowRight,
  Eye
} from 'lucide-react';

// OLD API services (keep 100% logic) - UNCHANGED
import { movieService } from '../../services/movieService';
import adminService, { CreateMovieRequest, UpdateMovieRequest } from '../../services/adminService';
import { Movie, PageResponse } from '../../types';

// NEW UI components
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';

const AdminMovies: React.FC = () => {
  const [movies, setMovies] = useState<PageResponse<Movie> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [formData, setFormData] = useState<CreateMovieRequest>({
    title: '',
    description: '',
    genre: '',
    director: '',
    durationMinutes: 0,
    releaseDate: '',
    posterUrl: '',
    priceBase: 0
  });
  const [currentPage, setCurrentPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchMovies();
  }, [currentPage]);

  const fetchMovies = async () => {
    try {
      setLoading(true);
      const response = await movieService.getAllMovies({
        page: currentPage,
        size: 10,
        sortBy: 'createdAt',
        sortDir: 'desc'
      });
      setMovies(response);
    } catch (err) {
      console.error('Error fetching movies:', err);
      setError('Failed to load movies');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchMovies();
      return;
    }

    try {
      setLoading(true);
      const response = await movieService.searchMovies({
        query: searchQuery,
        page: currentPage,
        size: 10
      });
      setMovies(response);
    } catch (err) {
      console.error('Error searching movies:', err);
      setError('Failed to search movies');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingMovie) {
        await adminService.updateMovie(editingMovie.id, formData);
        alert('Movie updated successfully!');
      } else {
        await adminService.createMovie(formData);
        alert('Movie created successfully!');
      }

      setShowForm(false);
      setEditingMovie(null);
      resetForm();
      fetchMovies();
    } catch (err) {
      console.error('Error saving movie:', err);
      alert('Failed to save movie');
    }
  };

  const handleEdit = (movie: Movie) => {
    setEditingMovie(movie);
    setFormData({
      title: movie.title,
      description: movie.description,
      genre: movie.genre,
      director: movie.director,
      durationMinutes: movie.durationMinutes,
      releaseDate: movie.releaseDate.split('T')[0], // Format for date input
      posterUrl: movie.posterUrl || '',
      priceBase: movie.priceBase
    });
    setShowForm(true);
  };

  const handleDelete = async (movieId: number) => {
    if (window.confirm('Are you sure you want to delete this movie?')) {
      try {
        await adminService.deleteMovie(movieId);
        alert('Movie deleted successfully!');
        fetchMovies();
      } catch (err) {
        console.error('Error deleting movie:', err);
        alert('Failed to delete movie');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      genre: '',
      director: '',
      durationMinutes: 0,
      releaseDate: '',
      posterUrl: '',
      priceBase: 0
    });
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  // NEW loading UI (modern design)
  if (loading && !movies) {
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

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header Section - NEW UI */}
      <section className="bg-gradient-to-r from-blue-900 to-blue-800 py-16 text-center">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 rounded-full mb-6">
              <Film className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Movie Management</h1>
            <p className="text-lg text-blue-100 max-w-2xl mx-auto">
              Manage your cinema's movie catalog
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
            {/* Action Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Movies</h2>
                <p className="text-gray-400">Add, edit, and manage movie information</p>
              </div>
              <Button
                onClick={() => {
                  setEditingMovie(null);
                  resetForm();
                  setShowForm(true);
                }}
                className="bg-red-600 hover:bg-red-700"
                size="lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add New Movie
              </Button>
            </div>

            {/* Search Section - NEW UI with OLD logic */}
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search movies..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <Button onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700" size="lg">
                    <Search className="w-4 h-4 mr-2" />
                    Search
                  </Button>
                  {searchQuery && (
                    <Button
                      onClick={() => {
                        setSearchQuery('');
                        fetchMovies();
                      }}
                      variant="outline"
                      className="!bg-gray-800 !border-gray-600 !text-white hover:!bg-gray-700 hover:!text-white"
                      size="lg"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Clear
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Movie Form Modal - NEW UI with OLD logic */}
            {showForm && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className="bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden"
                >
                  {/* Modal Header */}
                  <div className="bg-gray-700 px-8 py-6 border-b border-gray-600">
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-bold text-white flex items-center">
                        <Film className="w-6 h-6 mr-3 text-blue-500" />
                        {editingMovie ? 'Edit Movie' : 'Add New Movie'}
                      </h2>
                      <Button
                        onClick={() => setShowForm(false)}
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-white"
                      >
                        <X className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>

                  {/* Modal Content */}
                  <div className="p-8 overflow-y-auto max-h-[calc(90vh-8rem)]">
                    <form onSubmit={handleFormSubmit} className="space-y-6">
                      {/* Form Fields - Row 1 */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-300 flex items-center">
                            <Film className="w-4 h-4 mr-2" />
                            Title *
                          </label>
                          <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({...formData, title: e.target.value})}
                            required
                            className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-300 flex items-center">
                            <FileText className="w-4 h-4 mr-2" />
                            Genre *
                          </label>
                          <input
                            type="text"
                            value={formData.genre}
                            onChange={(e) => setFormData({...formData, genre: e.target.value})}
                            required
                            className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>

                      {/* Form Fields - Row 2 */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-300 flex items-center">
                            <User className="w-4 h-4 mr-2" />
                            Director *
                          </label>
                          <input
                            type="text"
                            value={formData.director}
                            onChange={(e) => setFormData({...formData, director: e.target.value})}
                            required
                            className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-300 flex items-center">
                            <Clock className="w-4 h-4 mr-2" />
                            Duration (minutes) *
                          </label>
                          <input
                            type="number"
                            value={formData.durationMinutes}
                            onChange={(e) => setFormData({...formData, durationMinutes: parseInt(e.target.value)})}
                            required
                            className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>

                      {/* Form Fields - Row 3 */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-300 flex items-center">
                            <Calendar className="w-4 h-4 mr-2" />
                            Release Date *
                          </label>
                          <input
                            type="date"
                            value={formData.releaseDate}
                            onChange={(e) => setFormData({...formData, releaseDate: e.target.value})}
                            required
                            className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-300 flex items-center">
                            <DollarSign className="w-4 h-4 mr-2" />
                            Base Price (VND) *
                          </label>
                          <input
                            type="number"
                            value={formData.priceBase}
                            onChange={(e) => setFormData({...formData, priceBase: parseFloat(e.target.value)})}
                            required
                            className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>

                      {/* Poster URL Field */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300 flex items-center">
                          <Image className="w-4 h-4 mr-2" />
                          Poster URL <span className="text-gray-500 ml-1">(optional)</span>
                        </label>
                        <input
                          type="url"
                          value={formData.posterUrl}
                          onChange={(e) => setFormData({...formData, posterUrl: e.target.value})}
                          placeholder="https://example.com/poster.jpg"
                          className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      {/* Description Field */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300 flex items-center">
                          <FileText className="w-4 h-4 mr-2" />
                          Description *
                        </label>
                        <textarea
                          value={formData.description}
                          onChange={(e) => setFormData({...formData, description: e.target.value})}
                          required
                          rows={4}
                          className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
                        />
                      </div>

                      {/* Form Actions */}
                      <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-600">
                        <Button
                          type="button"
                          onClick={() => setShowForm(false)}
                          variant="outline"
                          className="!bg-gray-800 !border-gray-600 !text-white hover:!bg-gray-700 hover:!text-white"
                          size="lg"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          className="bg-blue-600 hover:bg-blue-700"
                          size="lg"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          {editingMovie ? 'Update' : 'Create'} Movie
                        </Button>
                      </div>
                    </form>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* Movies List - NEW UI with OLD logic */}
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
                {movies && (
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  >
                    <Card className="bg-gray-800 border-gray-700 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">{/* table content continues */}
                          <thead>
                            <tr className="bg-gray-700 border-b border-gray-600">
                              <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Poster</th>
                              <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Title</th>
                              <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Genre</th>
                              <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Director</th>
                              <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Duration</th>
                              <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Release Date</th>
                              <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Price</th>
                              <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {movies.content.map((movie, index) => (
                              <motion.tr
                                key={movie.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.05 }}
                                className="border-b border-gray-600 hover:bg-gray-700/30 transition-colors"
                              >
                                <td className="px-6 py-4">
                                  <img
                                    src={movie.posterUrl || `https://via.placeholder.com/60x90/141414/E50914?text=${encodeURIComponent(movie.title.slice(0, 3))}`}
                                    alt={movie.title}
                                    className="w-16 h-24 object-cover rounded-lg border border-gray-600"
                                  />
                                </td>
                                <td className="px-6 py-4">
                                  <div className="font-semibold text-white mb-1">{movie.title}</div>
                                  <div className="text-sm text-gray-400 line-clamp-3 max-w-md">
                                    {movie.description.length > 100
                                      ? movie.description.substring(0, 100) + '...'
                                      : movie.description}
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <Badge variant="secondary" className="bg-purple-600 text-white">
                                    {movie.genre}
                                  </Badge>
                                </td>
                                <td className="px-6 py-4 text-gray-300">{movie.director}</td>
                                <td className="px-6 py-4 text-gray-300">
                                  <div className="flex items-center">
                                    <Clock className="w-4 h-4 mr-1 text-gray-400" />
                                    {movie.durationMinutes} min
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-gray-300">
                                  <div className="flex items-center">
                                    <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                                    {adminService.formatDate(movie.releaseDate)}
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-gray-300">
                                  <div className="flex items-center">
                                    <DollarSign className="w-4 h-4 mr-1 text-gray-400" />
                                    {adminService.formatCurrency(movie.priceBase)}
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center space-x-2">
                                    <Button
                                      onClick={() => handleEdit(movie)}
                                      size="sm"
                                      className="bg-green-600 hover:bg-green-700"
                                    >
                                      <Edit3 className="w-4 h-4 mr-1" />
                                      Edit
                                    </Button>
                                    <Button
                                      onClick={() => handleDelete(movie.id)}
                                      size="sm"
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      <Trash2 className="w-4 h-4 mr-1" />
                                      Delete
                                    </Button>
                                  </div>
                                </td>
                              </motion.tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination - NEW UI with OLD logic */}
                      {movies.totalPages > 1 && (
                        <div className="bg-gray-700 px-6 py-4 border-t border-gray-600">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Button
                                onClick={() => handlePageChange(0)}
                                disabled={currentPage === 0}
                                variant="outline"
                                size="sm"
                                className="!bg-gray-800 !border-gray-600 !text-white hover:!bg-gray-600 hover:!text-white disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <ArrowLeft className="w-4 h-4 mr-1" />
                                First
                              </Button>
                              <Button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 0}
                                variant="outline"
                                size="sm"
                                className="!bg-gray-800 !border-gray-600 !text-white hover:!bg-gray-600 hover:!text-white disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Previous
                              </Button>
                            </div>

                            <div className="text-sm text-gray-300">
                              Page {currentPage + 1} of {movies.totalPages} • {movies.totalElements} total movies
                            </div>

                            <div className="flex items-center space-x-2">
                              <Button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage >= movies.totalPages - 1}
                                variant="outline"
                                size="sm"
                                className="!bg-gray-800 !border-gray-600 !text-white hover:!bg-gray-600 hover:!text-white disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Next
                              </Button>
                              <Button
                                onClick={() => handlePageChange(movies.totalPages - 1)}
                                disabled={currentPage >= movies.totalPages - 1}
                                variant="outline"
                                size="sm"
                                className="!bg-gray-800 !border-gray-600 !text-white hover:!bg-gray-600 hover:!text-white disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Last
                                <ArrowRight className="w-4 h-4 ml-1" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </Card>
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


export default AdminMovies;