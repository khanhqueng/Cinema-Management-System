import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  CalendarDays,
  MapPin,
  Ticket,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Film,
  AlertCircle,
  Tag,
  XCircle,
  Clock,
} from "lucide-react";
import { bookingService } from "../../services/bookingService";
import { authService } from "../../services/authService";
import { BookingHistoryDto } from "../../types";
import styles from "./BookingHistoryPage.module.css";

// ─── helpers ────────────────────────────────────────────────────────────────

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString("vi-VN", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ─── constants ───────────────────────────────────────────────────────────────

const STATUS_FILTERS = [
  { label: "All", value: "" },
  { label: "Confirmed", value: "CONFIRMED" },
  { label: "Cancelled", value: "CANCELLED" },
];

const PAGE_SIZE = 8;

// ─── page component ──────────────────────────────────────────────────────────

const BookingHistoryPage: React.FC = () => {
  const navigate = useNavigate();

  const [bookings, setBookings] = useState<BookingHistoryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  // ── data fetching ──────────────────────────────────────────────────────────

  const loadBookings = useCallback(async () => {
    if (!authService.isAuthenticated()) {
      navigate("/login");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const response = await bookingService.getMyBookingHistory({
        page,
        size: PAGE_SIZE,
        status: statusFilter || undefined,
      });
      setBookings(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load booking history");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, navigate]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  // ── handlers ──────────────────────────────────────────────────────────────

  const handleCancelBooking = async (bookingId: number) => {
    if (!window.confirm("Are you sure you want to cancel this booking?"))
      return;
    try {
      setCancellingId(bookingId);
      await bookingService.cancelBooking(bookingId);
      await loadBookings();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to cancel booking");
    } finally {
      setCancellingId(null);
    }
  };

  const handleFilterChange = (value: string) => {
    setStatusFilter(value);
    setPage(0);
  };

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={styles.pageHeader}
        >
          <h1 className={styles.pageTitle}>My Bookings</h1>
          <p className={styles.pageSubtitle}>
            {loading
              ? "Loading…"
              : totalElements > 0
                ? `${totalElements} booking${totalElements !== 1 ? "s" : ""} found`
                : "Your booking history"}
          </p>
        </motion.div>

        {/* Status filter tabs */}
        <div className={styles.filterBar}>
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => handleFilterChange(f.value)}
              className={`${styles.filterBtn} ${
                statusFilter === f.value ? styles.filterBtnActive : ""
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Error banner */}
        {error && (
          <div className={styles.errorBanner}>
            <AlertCircle size={18} color="#E50914" />
            <span className={styles.errorText}>{error}</span>
          </div>
        )}

        {/* Loading spinner */}
        {loading ? (
          <div className={styles.loadingWrapper}>
            <Loader2 size={40} color="#E50914" className={styles.spinner} />
          </div>
        ) : bookings.length === 0 ? (
          /* Empty state */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={styles.emptyState}
          >
            <Film size={64} color="#444" className={styles.emptyIcon} />
            <p className={styles.emptyText}>
              {statusFilter
                ? `No ${statusFilter.toLowerCase()} bookings found`
                : "You haven't made any bookings yet"}
            </p>
            <button
              onClick={() => navigate("/movies")}
              className={styles.browseBtnCta}
            >
              Browse Movies
            </button>
          </motion.div>
        ) : (
          <>
            {/* Booking cards */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`${page}-${statusFilter}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={styles.cardList}
              >
                {bookings.map((booking, index) => (
                  <motion.div
                    key={booking.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`${styles.card} ${
                      booking.bookingStatus === "CANCELLED"
                        ? styles.cardCancelled
                        : ""
                    }`}
                  >
                    {/* Poster thumbnail */}
                    <div className={styles.poster}>
                      {booking.showtime.moviePosterUrl ? (
                        <img
                          src={booking.showtime.moviePosterUrl}
                          alt={booking.showtime.movieTitle}
                          className={styles.posterImg}
                        />
                      ) : (
                        <div className={styles.posterPlaceholder}>
                          <Film size={32} color="#444" />
                        </div>
                      )}
                    </div>

                    {/* Card body */}
                    <div className={styles.cardBody}>
                      {/* Left: movie info */}
                      <div className={styles.cardLeft}>
                        <div className={styles.titleRow}>
                          <h3 className={styles.movieTitle}>
                            {booking.showtime.movieTitle}
                          </h3>
                          <span
                            className={
                              booking.bookingStatus === "CONFIRMED"
                                ? styles.statusBadgeConfirmed
                                : styles.statusBadgeCancelled
                            }
                          >
                            {booking.bookingStatus === "CONFIRMED"
                              ? "✓ Confirmed"
                              : "✕ Cancelled"}
                          </span>
                        </div>

                        <div className={styles.detailList}>
                          <div className={styles.detailItem}>
                            <CalendarDays size={14} color="#666" />
                            <span>
                              {formatDateTime(booking.showtime.showDatetime)}
                            </span>
                          </div>
                          <div className={styles.detailItem}>
                            <MapPin size={14} color="#666" />
                            <span>{booking.showtime.theaterName}</span>
                          </div>
                          <div className={styles.detailItem}>
                            <Ticket
                              size={14}
                              color="#666"
                              style={{ marginTop: "2px" }}
                            />
                            <span>
                              {booking.seatsBooked} seat
                              {booking.seatsBooked !== 1 ? "s" : ""}
                              {booking.seatBookings &&
                                booking.seatBookings.length > 0 && (
                                  <span className={styles.seatLabels}>
                                    (
                                    {booking.seatBookings
                                      .map((s) => s.seatLabel)
                                      .join(", ")}
                                    )
                                  </span>
                                )}
                            </span>
                          </div>
                          <div className={styles.detailItem}>
                            <Tag size={14} color="#666" />
                            <span className={styles.refCode}>
                              {booking.bookingReference}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: amount + cancel */}
                      <div className={styles.cardRight}>
                        <div className={styles.amountBlock}>
                          <div className={styles.amount}>
                            {formatCurrency(booking.totalAmount)}
                          </div>
                          <div className={styles.bookedOn}>
                            <Clock size={11} color="#555" />
                            <span className={styles.bookedOnText}>
                              {formatDate(booking.createdAt)}
                            </span>
                          </div>
                        </div>

                        {booking.canCancel && (
                          <button
                            onClick={() => handleCancelBooking(booking.id)}
                            disabled={cancellingId === booking.id}
                            className={styles.cancelBtn}
                          >
                            {cancellingId === booking.id ? (
                              <Loader2 size={13} className={styles.spinner} />
                            ) : (
                              <XCircle size={13} />
                            )}
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className={styles.pagination}>
                <button
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page === 0}
                  className={styles.pageBtn}
                >
                  <ChevronLeft size={16} /> Previous
                </button>
                <span className={styles.pageInfo}>
                  Page {page + 1} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= totalPages - 1}
                  className={styles.pageBtn}
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default BookingHistoryPage;
