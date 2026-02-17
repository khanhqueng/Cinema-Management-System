import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Building2,
  Search,
  Plus,
  Edit3,
  Trash2,
  X,
  Save,
  Loader2,
  AlertCircle,
  Users,
  Calendar,
  ArrowLeft,
  ArrowRight,
  Activity,
  Star,
  Crown,
  Volume2
} from 'lucide-react';

// OLD API services (keep 100% logic) - UNCHANGED
import adminService, { CreateTheaterRequest, UpdateTheaterRequest, TheaterUtilization } from '../../services/adminService';
import { Theater, TheaterType, PageResponse } from '../../types';
import { theaterService } from '../../services/theaterService';

// NEW UI components
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';

const AdminTheaters: React.FC = () => {
  const [theaters, setTheaters] = useState<PageResponse<Theater> | null>(null);
  const [theaterTypes, setTheaterTypes] = useState<TheaterType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingTheater, setEditingTheater] = useState<Theater | null>(null);
  const [formData, setFormData] = useState<CreateTheaterRequest>({
    name: '',
    capacity: 0,
    theaterType: TheaterType.STANDARD
  });
  const [currentPage, setCurrentPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchTheaters();
  }, [currentPage]);

  const fetchInitialData = async () => {
    try {
      const types = await adminService.getTheaterTypes();
      setTheaterTypes(types);
      fetchTheaters();
    } catch (err) {
      console.error('Error fetching initial data:', err);
      setError('Failed to load initial data');
    }
  };

  const fetchTheaters = async () => {
    try {
      setLoading(true);
      const response = await theaterService.getAllTheaters({
        page: currentPage,
        size: 10,
        sortBy: 'name',
        sortDir: 'asc'
      });
      setTheaters(response);
    } catch (err) {
      console.error('Error fetching theaters:', err);
      setError('Failed to load theaters');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchTheaters();
      return;
    }

    try {
      setLoading(true);
      const response = await theaterService.searchTheaters({
        name: searchQuery,
        page: currentPage,
        size: 10
      });
      setTheaters(response);
    } catch (err) {
      console.error('Error searching theaters:', err);
      setError('Failed to search theaters');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTheater) {
        await adminService.updateTheater(editingTheater.id, formData);
        alert('Theater updated successfully!');
      } else {
        await adminService.createTheater(formData);
        alert('Theater created successfully!');
      }

      setShowForm(false);
      setEditingTheater(null);
      resetForm();
      fetchTheaters();
    } catch (err) {
      console.error('Error saving theater:', err);
      alert('Failed to save theater');
    }
  };

  const handleEdit = (theater: Theater) => {
    setEditingTheater(theater);
    setFormData({
      name: theater.name,
      capacity: theater.capacity,
      theaterType: theater.theaterType
    });
    setShowForm(true);
  };

  const handleDelete = async (theaterId: number) => {
    if (window.confirm('Are you sure you want to delete this theater? This will also delete all associated showtimes.')) {
      try {
        await adminService.deleteTheater(theaterId);
        alert('Theater deleted successfully!');
        fetchTheaters();
      } catch (err) {
        console.error('Error deleting theater:', err);
        alert('Failed to delete theater');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      capacity: 0,
      theaterType: TheaterType.STANDARD
    });
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  // NEW loading UI (modern design)
  if (loading && !theaters) {
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

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header Section - NEW UI */}
      <section className="bg-gradient-to-r from-green-900 to-green-800 py-16 text-center">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 rounded-full mb-6">
              <Building2 className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Theater Management</h1>
            <p className="text-lg text-green-100 max-w-2xl mx-auto">
              Manage your cinema's theater configurations and seating
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
                <h2 className="text-2xl font-bold text-white mb-2">Theaters</h2>
                <p className="text-gray-400">Add, edit, and manage theater configurations</p>
              </div>
              <Button
                onClick={() => {
                  setEditingTheater(null);
                  resetForm();
                  setShowForm(true);
                }}
                className="bg-red-600 hover:bg-red-700"
                size="lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add New Theater
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
                        placeholder="Search theaters by name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <Button onClick={handleSearch} className="bg-green-600 hover:bg-green-700" size="lg">
                    <Search className="w-4 h-4 mr-2" />
                    Search
                  </Button>
                  {searchQuery && (
                    <Button
                      onClick={() => {
                        setSearchQuery('');
                        fetchTheaters();
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

            {/* Theater Form Modal - NEW UI with OLD logic */}
            {showForm && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className="bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden"
                >
                  {/* Modal Header */}
                  <div className="bg-gray-700 px-8 py-6 border-b border-gray-600">
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-bold text-white flex items-center">
                        <Building2 className="w-6 h-6 mr-3 text-green-500" />
                        {editingTheater ? 'Edit Theater' : 'Add New Theater'}
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
                  <div className="p-8">
                    <form onSubmit={handleFormSubmit} className="space-y-6">
                      {/* Theater Name Field */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300 flex items-center">
                          <Building2 className="w-4 h-4 mr-2" />
                          Theater Name *
                        </label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          required
                          placeholder="e.g., Theater A, VIP Hall 1"
                          className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>

                      {/* Form Fields Row */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-300 flex items-center">
                            <Users className="w-4 h-4 mr-2" />
                            Capacity *
                          </label>
                          <input
                            type="number"
                            value={formData.capacity}
                            onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value)})}
                            required
                            min="1"
                            placeholder="Number of seats"
                            className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-300 flex items-center">
                            <Activity className="w-4 h-4 mr-2" />
                            Theater Type *
                          </label>
                          <select
                            value={formData.theaterType}
                            onChange={(e) => setFormData({...formData, theaterType: e.target.value as TheaterType})}
                            required
                            className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          >
                            {theaterTypes.map(type => (
                              <option key={type} value={type} className="bg-gray-700 text-white">
                                {adminService.getTheaterTypeDisplay(type)}
                              </option>
                            ))}
                          </select>
                        </div>
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
                          className="bg-green-600 hover:bg-green-700"
                          size="lg"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          {editingTheater ? 'Update' : 'Create'} Theater
                        </Button>
                      </div>
                    </form>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* Theaters List - NEW UI with OLD logic */}
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
                {theaters && (
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  >
                    <Card className="bg-gray-800 border-gray-700 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-gray-700 border-b border-gray-600">
                              <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Theater Name</th>
                              <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Type</th>
                              <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Capacity</th>
                              <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Status</th>
                              <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Created</th>
                              <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {theaters.content.map((theater, index) => {
                              const TypeIcon = getTheaterTypeIcon(theater.theaterType);
                              return (
                                <motion.tr
                                  key={theater.id}
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.3, delay: index * 0.05 }}
                                  className="border-b border-gray-600 hover:bg-gray-700/30 transition-colors"
                                >
                                  <td className="px-6 py-4">
                                    <div className="font-semibold text-white mb-1">{theater.name}</div>
                                    <div className="text-sm text-gray-400">ID: {theater.id}</div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <Badge variant="secondary" className={getTheaterTypeBadgeClass(theater.theaterType)}>
                                      <TypeIcon className="w-3 h-3 mr-1" />
                                      {adminService.getTheaterTypeDisplay(theater.theaterType)}
                                    </Badge>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="text-center">
                                      <div className="text-xl font-bold text-white">{theater.capacity}</div>
                                      <div className="text-xs text-gray-400">seats</div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <Badge variant="secondary" className="bg-green-600 text-white">
                                      <Activity className="w-3 h-3 mr-1" />
                                      Active
                                    </Badge>
                                  </td>
                                  <td className="px-6 py-4 text-gray-300">
                                    <div className="flex items-center">
                                      <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                                      {adminService.formatDate(theater.createdAt)}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="flex items-center space-x-2">
                                      <Button
                                        onClick={() => handleEdit(theater)}
                                        size="sm"
                                        className="bg-green-600 hover:bg-green-700"
                                      >
                                        <Edit3 className="w-4 h-4 mr-1" />
                                        Edit
                                      </Button>
                                      <Button
                                        onClick={() => handleDelete(theater.id)}
                                        size="sm"
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        <Trash2 className="w-4 h-4 mr-1" />
                                        Delete
                                      </Button>
                                    </div>
                                  </td>
                                </motion.tr>
                              );
                            })}
                          </tbody>
                        </table>

                      </div>

                      {/* Pagination - NEW UI with OLD logic */}
                      {theaters.totalPages > 1 && (
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
                              Page {currentPage + 1} of {theaters.totalPages} • {theaters.totalElements} total theaters
                            </div>

                            <div className="flex items-center space-x-2">
                              <Button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage >= theaters.totalPages - 1}
                                variant="outline"
                                size="sm"
                                className="!bg-gray-800 !border-gray-600 !text-white hover:!bg-gray-600 hover:!text-white disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Next
                              </Button>
                              <Button
                                onClick={() => handlePageChange(theaters.totalPages - 1)}
                                disabled={currentPage >= theaters.totalPages - 1}
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

// Helper functions for theater type styling - NEW approach with icons
const getTheaterTypeIcon = (type: TheaterType) => {
  switch (type) {
    case TheaterType.STANDARD:
      return Building2;
    case TheaterType.VIP:
      return Crown;
    case TheaterType.IMAX:
      return Star;
    case TheaterType.DOLBY:
      return Volume2;
    default:
      return Building2;
  }
};

const getTheaterTypeBadgeClass = (type: TheaterType): string => {
  switch (type) {
    case TheaterType.STANDARD:
      return 'bg-green-600 text-white';
    case TheaterType.VIP:
      return 'bg-orange-600 text-white';
    case TheaterType.IMAX:
      return 'bg-blue-600 text-white';
    case TheaterType.DOLBY:
      return 'bg-purple-600 text-white';
    default:
      return 'bg-gray-600 text-white';
  }
};


export default AdminTheaters;