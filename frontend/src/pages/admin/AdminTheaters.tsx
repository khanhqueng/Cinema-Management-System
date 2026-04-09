import React, { useState, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
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
  Volume2,
  Layers,
} from "lucide-react";

import adminService, {
  CreateTheaterRequest,
} from "../../services/adminService";
import { Theater, TheaterType, PageResponse } from "../../types";
import { theaterService } from "../../services/theaterService";

import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Input } from "../../components/ui/input";

const AdminTheaters: React.FC = () => {
  const [theaters, setTheaters] = useState<PageResponse<Theater> | null>(null);
  const [theaterTypes, setTheaterTypes] = useState<TheaterType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingTheater, setEditingTheater] = useState<Theater | null>(null);
  const [formData, setFormData] = useState<CreateTheaterRequest>({
    name: "",
    capacity: 0,
    theaterType: TheaterType.STANDARD,
    rows: 10,
    seatsPerRow: 12,
  });
  const [currentPage, setCurrentPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  // Initialize seats modal state
  const [showInitModal, setShowInitModal] = useState(false);
  const [initTheater, setInitTheater] = useState<Theater | null>(null);
  const [initRows, setInitRows] = useState(10);
  const [initSeatsPerRow, setInitSeatsPerRow] = useState(12);
  const [initLoading, setInitLoading] = useState(false);
  const [initSuccess, setInitSuccess] = useState<string | null>(null);
  const [initError, setInitError] = useState<string | null>(null);

  const fetchTheaters = useCallback(async () => {
    try {
      setLoading(true);
      const response = await theaterService.getAllTheaters({
        page: currentPage,
        size: 10,
        sortBy: "name",
        sortDir: "asc",
      });
      setTheaters(response);
    } catch (err) {
      console.error("Error fetching theaters:", err);
      setError("Failed to load theaters");
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const types = await adminService.getTheaterTypes();
        setTheaterTypes(types);
        await fetchTheaters();
      } catch (err) {
        console.error("Error fetching initial data:", err);
        setError("Failed to load initial data");
      }
    };
    fetchInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchTheaters();
  }, [currentPage, fetchTheaters]);

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
        size: 10,
      });
      setTheaters(response);
    } catch (err) {
      console.error("Error searching theaters:", err);
      setError("Failed to search theaters");
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTheater) {
        await adminService.updateTheater(editingTheater.id, formData);
        toast.success("Theater updated successfully!");
      } else {
        const created = await adminService.createTheater(formData);
        // Auto-initialize seats using rows/cols from the form
        const rows = formData.rows ?? 10;
        const cols = formData.seatsPerRow ?? 12;
        try {
          await adminService.initializeTheaterSeats(created.id, rows, cols);
        } catch (seatErr) {
          console.warn(
            "Theater created but seat initialization failed:",
            seatErr,
          );
        }
        toast.success(`Theater created with ${rows * cols} seats initialized!`);
      }
      setShowForm(false);
      setEditingTheater(null);
      resetForm();
      fetchTheaters();
    } catch (err) {
      console.error("Error saving theater:", err);
      toast.error("Failed to save theater");
    }
  };

  const handleEdit = (theater: Theater) => {
    setEditingTheater(theater);
    setFormData({
      name: theater.name,
      capacity: theater.capacity,
      theaterType: theater.theaterType,
      // rows/seatsPerRow not needed for edit (no auto-init on update)
    });
    setShowForm(true);
  };

  const handleDelete = async (theaterId: number) => {
    if (
      window.confirm(
        "Are you sure you want to delete this theater? This will also delete all associated showtimes.",
      )
    ) {
      try {
        await adminService.deleteTheater(theaterId);
        toast.success("Theater deleted successfully!");
        fetchTheaters();
      } catch (err) {
        console.error("Error deleting theater:", err);
        toast.error("Failed to delete theater");
      }
    }
  };

  const handleOpenInitModal = (theater: Theater) => {
    setInitTheater(theater);
    // Smart defaults: derive rows/cols from theater capacity
    const capacity = theater.capacity;
    const cols = Math.round(Math.sqrt(capacity * 1.5));
    const rows = Math.ceil(capacity / cols);
    setInitRows(rows);
    setInitSeatsPerRow(cols);
    setInitSuccess(null);
    setInitError(null);
    setShowInitModal(true);
  };

  const handleInitializeSeats = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!initTheater) return;
    setInitLoading(true);
    setInitSuccess(null);
    setInitError(null);
    try {
      await adminService.initializeTheaterSeats(
        initTheater.id,
        initRows,
        initSeatsPerRow,
      );
      setInitSuccess(
        `✓ Successfully initialized ${
          initRows * initSeatsPerRow
        } seats (${initRows} rows × ${initSeatsPerRow} per row) for "${
          initTheater.name
        }".`,
      );
    } catch (err: any) {
      console.error("Error initializing seats:", err);
      const status = err?.response?.status;
      const serverMessage = err?.response?.data?.message;
      if (
        serverMessage?.includes("existing bookings") ||
        serverMessage?.includes("booking")
      ) {
        setInitError(serverMessage);
      } else if (status === 409 || status === 400) {
        setInitError(
          serverMessage ??
            "Cannot reinitialize seats. There may be existing bookings.",
        );
      } else {
        setInitError(
          serverMessage ?? "Failed to initialize seats. Please try again.",
        );
      }
    } finally {
      setInitLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      capacity: 0,
      theaterType: TheaterType.STANDARD,
      rows: 10,
      seatsPerRow: 12,
    });
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  if (loading && !theaters) {
    return (
      <div className="min-h-screen bg-gray-950 pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center min-h-100">
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
                <p className="text-gray-400">
                  Add, edit, and manage theater configurations
                </p>
              </div>
              <Button
                onClick={() => {
                  setEditingTheater(null);
                  resetForm();
                  setShowForm(true);
                }}
                className="bg-red-600 hover:bg-red-700 text-white"
                size="lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add New Theater
              </Button>
            </div>

            {/* Search Section */}
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        type="text"
                        title="Search theaters"
                        placeholder="Search theaters by name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                        className="w-full h-11 pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handleSearch}
                    className="bg-green-600 hover:bg-green-700 text-white"
                    size="lg"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Search
                  </Button>
                  {searchQuery && (
                    <Button
                      onClick={() => {
                        setSearchQuery("");
                        fetchTheaters();
                      }}
                      variant="outline"
                      className="bg-gray-800! border-gray-600! text-white! hover:bg-gray-700! hover:text-white!"
                      size="lg"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Clear
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Theater Form Modal */}
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
                  <div className="bg-gray-700 px-8 py-6 border-b border-gray-600">
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-bold text-white flex items-center">
                        <Building2 className="w-6 h-6 mr-3 text-green-500" />
                        {editingTheater ? "Edit Theater" : "Add New Theater"}
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

                  <div className="p-8">
                    <form onSubmit={handleFormSubmit} className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300 flex items-center">
                          <Building2 className="w-4 h-4 mr-2" />
                          Theater Name *
                        </label>
                        <input
                          type="text"
                          title="Theater name"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          required
                          placeholder="e.g., Theater A, VIP Hall 1"
                          className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-300 flex items-center">
                            <Users className="w-4 h-4 mr-2" />
                            Theater Type *
                          </label>
                          <Select
                            value={formData.theaterType}
                            onValueChange={(v) =>
                              setFormData({
                                ...formData,
                                theaterType: v as TheaterType,
                              })
                            }
                            required
                          >
                            <SelectTrigger
                              title="Theater type"
                              aria-label="Theater type"
                              className="h-11 w-full rounded-lg border border-gray-600 bg-gray-700/50 px-4 text-sm text-white shadow-none focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-green-500"
                            >
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent className="border-gray-600 bg-gray-800 text-white">
                              {theaterTypes.map((type) => (
                                <SelectItem
                                  key={type}
                                  value={type}
                                  className="focus:bg-gray-700 focus:text-white"
                                >
                                  {adminService.getTheaterTypeDisplay(type)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-300 flex items-center">
                            <Activity className="w-4 h-4 mr-2" />
                            Capacity
                          </label>
                          <input
                            type="number"
                            title="Theater capacity (auto-calculated)"
                            value={
                              editingTheater
                                ? formData.capacity
                                : (formData.rows ?? 10) *
                                  (formData.seatsPerRow ?? 12)
                            }
                            readOnly={!editingTheater}
                            onChange={(e) =>
                              editingTheater &&
                              setFormData({
                                ...formData,
                                capacity: parseInt(e.target.value) || 0,
                              })
                            }
                            min="1"
                            className={`w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${!editingTheater ? "opacity-60 cursor-not-allowed" : ""}`}
                          />
                          {!editingTheater && (
                            <p className="text-xs text-gray-500">
                              Auto-calculated from rows × seats per row
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Seat Layout - only shown when creating */}
                      {!editingTheater && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-gray-300 flex items-center">
                              <Layers className="w-4 h-4 mr-2 text-blue-400" />
                              Seat Layout
                            </label>
                            <span className="text-xs text-blue-300 bg-blue-900/30 border border-blue-800 rounded px-2 py-0.5">
                              Auto-initialized on create
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-xs text-gray-400">
                                Number of Rows
                              </label>
                              <input
                                type="number"
                                title="Number of rows"
                                value={formData.rows ?? 10}
                                onChange={(e) => {
                                  const rows = Math.max(
                                    1,
                                    parseInt(e.target.value) || 1,
                                  );
                                  setFormData({
                                    ...formData,
                                    rows,
                                    capacity:
                                      rows * (formData.seatsPerRow ?? 12),
                                  });
                                }}
                                min="1"
                                max="30"
                                className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs text-gray-400">
                                Seats per Row
                              </label>
                              <input
                                type="number"
                                title="Seats per row"
                                value={formData.seatsPerRow ?? 12}
                                onChange={(e) => {
                                  const seatsPerRow = Math.max(
                                    1,
                                    parseInt(e.target.value) || 1,
                                  );
                                  setFormData({
                                    ...formData,
                                    seatsPerRow,
                                    capacity:
                                      (formData.rows ?? 10) * seatsPerRow,
                                  });
                                }}
                                min="1"
                                max="30"
                                className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                          <div className="bg-gray-700/40 border border-gray-600 rounded-lg px-4 py-2 text-sm text-gray-300 flex items-center justify-between">
                            <span>Total seats:</span>
                            <span className="text-white font-bold">
                              {(formData.rows ?? 10) *
                                (formData.seatsPerRow ?? 12)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">
                            First 2 rows → VIP · Last row → Couple · Aisle
                            middle rows → Wheelchair · Rest → Standard
                          </p>
                        </div>
                      )}

                      <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-600">
                        <Button
                          type="button"
                          onClick={() => setShowForm(false)}
                          variant="outline"
                          className="bg-gray-800! border-gray-600! text-white! hover:bg-gray-700! hover:text-white!"
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
                          {editingTheater ? "Update" : "Create"} Theater
                        </Button>
                      </div>
                    </form>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* Initialize Seats Modal */}
            {showInitModal && initTheater && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className="bg-gray-800 rounded-lg w-full max-w-lg overflow-hidden"
                >
                  {/* Modal Header */}
                  <div className="bg-gray-700 px-8 py-6 border-b border-gray-600">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold text-white flex items-center">
                        <Layers className="w-5 h-5 mr-3 text-blue-400" />
                        Reconfigure Seat Layout
                      </h2>
                      <Button
                        onClick={() => setShowInitModal(false)}
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-white"
                      >
                        <X className="w-5 h-5" />
                      </Button>
                    </div>
                    <p className="text-gray-400 text-sm mt-1">
                      Theater:{" "}
                      <span className="text-white font-semibold">
                        {initTheater.name}
                      </span>
                      <span className="ml-2 text-gray-500">
                        (capacity: {initTheater.capacity})
                      </span>
                    </p>
                  </div>

                  {/* Modal Body */}
                  <div className="p-8">
                    {/* Info box */}
                    <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4 mb-6 text-sm text-blue-200">
                      <p className="font-semibold mb-1">
                        Auto seat-type assignment:
                      </p>
                      <ul className="list-disc list-inside space-y-0.5 text-blue-300">
                        <li>
                          First 2 rows →{" "}
                          <span className="text-yellow-400 font-medium">
                            VIP
                          </span>
                        </li>
                        <li>
                          Last row (even positions, not last) →{" "}
                          <span className="text-pink-400 font-medium">
                            Couple
                          </span>
                        </li>
                        <li>
                          Middle rows, aisle seats →{" "}
                          <span className="text-green-400 font-medium">
                            Wheelchair
                          </span>
                        </li>
                        <li>
                          All others →{" "}
                          <span className="text-gray-300 font-medium">
                            Standard
                          </span>
                        </li>
                      </ul>
                    </div>

                    {initSuccess && (
                      <div className="bg-green-900/40 border border-green-600 rounded-lg p-4 mb-4 text-green-300 text-sm">
                        {initSuccess}
                      </div>
                    )}
                    {initError && (
                      <div className="bg-red-900/40 border border-red-600 rounded-lg p-4 mb-4 text-red-300 text-sm flex items-start">
                        <AlertCircle className="w-4 h-4 mr-2 shrink-0 mt-0.5" />
                        {initError}
                      </div>
                    )}

                    <form
                      onSubmit={handleInitializeSeats}
                      className="space-y-5"
                    >
                      <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-300 flex items-center">
                            <Layers className="w-4 h-4 mr-2" />
                            Number of Rows *
                          </label>
                          <input
                            type="number"
                            title="Number of rows"
                            value={initRows}
                            onChange={(e) =>
                              setInitRows(
                                Math.max(1, parseInt(e.target.value) || 1),
                              )
                            }
                            required
                            min="1"
                            max="30"
                            className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-300 flex items-center">
                            <Users className="w-4 h-4 mr-2" />
                            Seats per Row *
                          </label>
                          <input
                            type="number"
                            title="Seats per row"
                            value={initSeatsPerRow}
                            onChange={(e) =>
                              setInitSeatsPerRow(
                                Math.max(1, parseInt(e.target.value) || 1),
                              )
                            }
                            required
                            min="1"
                            max="30"
                            className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>

                      {/* Live preview */}
                      <div className="bg-gray-700/40 border border-gray-600 rounded-lg px-5 py-3 text-sm text-gray-300 flex items-center justify-between">
                        <span>Total seats to create:</span>
                        <span className="text-white font-bold text-lg">
                          {initRows * initSeatsPerRow}
                        </span>
                      </div>

                      <div className="flex items-center justify-end space-x-3 pt-2 border-t border-gray-600">
                        <Button
                          type="button"
                          onClick={() => setShowInitModal(false)}
                          variant="outline"
                          className="bg-gray-800! border-gray-600! text-white! hover:bg-gray-700! hover:text-white!"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Close
                        </Button>
                        <Button
                          type="submit"
                          disabled={initLoading || !!initSuccess}
                          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {initLoading ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Layers className="w-4 h-4 mr-2" />
                          )}
                          {initLoading ? "Initializing…" : "Initialize Seats"}
                        </Button>
                      </div>
                    </form>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* Theaters List */}
            {error ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="bg-red-900/50 border-red-600">
                  <CardContent className="p-6">
                    <div className="flex items-center text-red-300">
                      <AlertCircle className="w-5 h-5 mr-2 shrink-0" />
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
                              <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">
                                Theater Name
                              </th>
                              <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">
                                Type
                              </th>
                              <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">
                                Capacity
                              </th>
                              <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">
                                Status
                              </th>
                              <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">
                                Created
                              </th>
                              <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {theaters.content.map((theater, index) => {
                              const TypeIcon = getTheaterTypeIcon(
                                theater.theaterType,
                              );
                              return (
                                <motion.tr
                                  key={theater.id}
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{
                                    duration: 0.3,
                                    delay: index * 0.05,
                                  }}
                                  className="border-b border-gray-600 hover:bg-gray-700/30 transition-colors"
                                >
                                  <td className="px-6 py-4">
                                    <div className="font-semibold text-white mb-1">
                                      {theater.name}
                                    </div>
                                    <div className="text-sm text-gray-400">
                                      ID: {theater.id}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <Badge
                                      variant="secondary"
                                      className={getTheaterTypeBadgeClass(
                                        theater.theaterType,
                                      )}
                                    >
                                      <TypeIcon className="w-3 h-3 mr-1" />
                                      {adminService.getTheaterTypeDisplay(
                                        theater.theaterType,
                                      )}
                                    </Badge>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="text-center">
                                      <div className="text-xl font-bold text-white">
                                        {theater.capacity}
                                      </div>
                                      <div className="text-xs text-gray-400">
                                        seats
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <Badge
                                      variant="secondary"
                                      className="bg-green-600 text-white"
                                    >
                                      <Activity className="w-3 h-3 mr-1" />
                                      Active
                                    </Badge>
                                  </td>
                                  <td className="px-6 py-4 text-gray-300">
                                    <div className="flex items-center">
                                      <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                                      {adminService.formatDate(
                                        theater.createdAt,
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="flex items-center space-x-2">
                                      {/* <Button
                                        onClick={() =>
                                          handleOpenInitModal(theater)
                                        }
                                        size="sm"
                                        className="bg-blue-600 hover:bg-blue-700"
                                        title="Reconfigure seat layout for this theater"
                                      >
                                        <Layers className="w-4 h-4 mr-1" />
                                        Reconfigure
                                      </Button> */}
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

                      {/* Pagination */}
                      {theaters.totalPages > 1 && (
                        <div className="bg-gray-700 px-6 py-4 border-t border-gray-600">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Button
                                onClick={() => handlePageChange(0)}
                                disabled={currentPage === 0}
                                variant="outline"
                                size="sm"
                                className="bg-gray-800! border-gray-600! text-white! hover:bg-gray-600! hover:text-white! disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <ArrowLeft className="w-4 h-4 mr-1" />
                                First
                              </Button>
                              <Button
                                onClick={() =>
                                  handlePageChange(currentPage - 1)
                                }
                                disabled={currentPage === 0}
                                variant="outline"
                                size="sm"
                                className="bg-gray-800! border-gray-600! text-white! hover:bg-gray-600! hover:text-white! disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Previous
                              </Button>
                            </div>

                            <div className="text-sm text-gray-300">
                              Page {currentPage + 1} of {theaters.totalPages} •{" "}
                              {theaters.totalElements} total theaters
                            </div>

                            <div className="flex items-center space-x-2">
                              <Button
                                onClick={() =>
                                  handlePageChange(currentPage + 1)
                                }
                                disabled={
                                  currentPage >= theaters.totalPages - 1
                                }
                                variant="outline"
                                size="sm"
                                className="bg-gray-800! border-gray-600! text-white! hover:bg-gray-600! hover:text-white! disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Next
                              </Button>
                              <Button
                                onClick={() =>
                                  handlePageChange(theaters.totalPages - 1)
                                }
                                disabled={
                                  currentPage >= theaters.totalPages - 1
                                }
                                variant="outline"
                                size="sm"
                                className="bg-gray-800! border-gray-600! text-white! hover:bg-gray-600! hover:text-white! disabled:opacity-50 disabled:cursor-not-allowed"
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

// Helper functions for theater type styling
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
      return "bg-green-600 text-white";
    case TheaterType.VIP:
      return "bg-orange-600 text-white";
    case TheaterType.IMAX:
      return "bg-blue-600 text-white";
    case TheaterType.DOLBY:
      return "bg-purple-600 text-white";
    default:
      return "bg-gray-600 text-white";
  }
};

export default AdminTheaters;
