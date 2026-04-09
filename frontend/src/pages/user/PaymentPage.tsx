import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate, Link } from "react-router-dom";
import { motion } from "motion/react";
import {
  Clock,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  ArrowLeft,
  Timer,
  Film,
  MapPin,
  Calendar,
  DollarSign,
  Loader2,
  AlertCircle,
} from "lucide-react";

// OLD API services (keep 100% logic) - UNCHANGED
import { bookingService } from "../../services/bookingService";
import { Showtime } from "../../types";

// NEW UI components
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";

interface PaymentPageState {
  selectedSeats: number[];
  totalPrice: number;
  showtime: Showtime;
  reservedUntil: number; // timestamp
}

const PaymentPage: React.FC = () => {
  const { showtimeId } = useParams<{ showtimeId: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const state = location.state as PaymentPageState;

  // Recovered state when navigation state is missing (page reload)
  const [recoveredState, setRecoveredState] = useState<PaymentPageState | null>(
    null,
  );
  const [recovering, setRecovering] = useState(!state);

  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [reservedUntil, setReservedUntil] = useState<number>(
    state?.reservedUntil ?? 0,
  );
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Active state is either from navigation or from recovery
  const activeState = state ?? recoveredState;

  // Recovery: When page is reloaded (no location.state), read sessionStorage + query Redis TTL
  useEffect(() => {
    if (state) return; // normal navigation — nothing to recover

    const raw = localStorage.getItem("pendingPayment");
    if (!raw) {
      setRecovering(false);
      return;
    }

    const parsed = JSON.parse(raw) as {
      selectedSeats: number[];
      showtimeId: number;
      showtime: Showtime;
      totalPrice: number;
    };

    // Verify the showtimeId matches the current URL
    if (String(parsed.showtimeId) !== showtimeId) {
      localStorage.removeItem("pendingPayment");
      setRecovering(false);
      return;
    }

    bookingService
      .getSeatLockStatus(parsed.showtimeId, parsed.selectedSeats)
      .then((lockStatus) => {
        if (lockStatus.locked && lockStatus.remainingMs > 0) {
          const until = Date.now() + lockStatus.remainingMs;
          // Use actual locked seatIds from API for accurate count
          const actualSeats =
            lockStatus.seatIds && lockStatus.seatIds.length > 0
              ? lockStatus.seatIds
              : parsed.selectedSeats;
          setReservedUntil(until);
          setRecoveredState({
            selectedSeats: actualSeats,
            totalPrice: parsed.totalPrice,
            showtime: parsed.showtime,
            reservedUntil: until,
          });
        } else {
          // Locks expired — send user back to booking with seats pre-selected
          localStorage.removeItem("pendingPayment");
          navigate(`/booking/${showtimeId}`, {
            state: { prevSelectedSeats: parsed.selectedSeats },
          });
        }
      })
      .catch(() => {
        localStorage.removeItem("pendingPayment");
        navigate(`/booking/${showtimeId}`);
      })
      .finally(() => setRecovering(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync local reservedUntil when navigation state provides a fresh timestamp
  useEffect(() => {
    if (state?.reservedUntil) {
      setReservedUntil(state.reservedUntil);
    }
  }, [state?.reservedUntil]);

  // Countdown timer
  useEffect(() => {
    if (!reservedUntil) return;

    const tick = () => {
      const remaining = Math.max(0, reservedUntil - Date.now());
      setTimeRemaining(remaining);
      if (remaining <= 0) handleTimeout();
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reservedUntil]);

  // Handle timeout - release seats and redirect
  const handleTimeout = async () => {
    if (!showtimeId || !activeState?.selectedSeats) return;

    try {
      await bookingService.releaseSeatsReservation({
        showtimeId: parseInt(showtimeId, 10),
        seatIds: activeState.selectedSeats,
      });
    } catch (err) {
      console.error("Error releasing seats on timeout:", err);
    }

    localStorage.removeItem("pendingPayment");
    navigate(`/booking/${showtimeId}`, {
      state: { prevSelectedSeats: activeState.selectedSeats },
    });
  };

  // Handle payment completion
  const handlePayment = async () => {
    if (!showtimeId || !activeState?.selectedSeats) return;

    setPaymentLoading(true);

    try {
      const bookingResponse = await bookingService.createBookingWithSeats({
        showtimeId: parseInt(showtimeId, 10),
        seatIds: activeState.selectedSeats,
      });

      localStorage.removeItem("pendingPayment");
      navigate(`/booking-confirmation/${bookingResponse.booking.id}`, {
        state: { bookingData: bookingResponse },
      });
    } catch (err: any) {
      console.error("Error creating booking:", err);

      if (err.response?.status === 409) {
        setError(
          "Seats are no longer available. Redirecting to seat selection...",
        );
        setTimeout(() => {
          navigate(`/booking/${showtimeId}`);
        }, 2000);
      } else {
        setError("Payment failed. Please try again.");
      }
    } finally {
      setPaymentLoading(false);
    }
  };

  // Handle cancel - release seats and go back
  const handleCancel = async () => {
    if (!showtimeId || !activeState?.selectedSeats) return;

    try {
      await bookingService.releaseSeatsReservation({
        showtimeId: parseInt(showtimeId, 10),
        seatIds: activeState.selectedSeats,
      });
    } catch (err) {
      console.error("Error releasing seats on cancel:", err);
    }

    localStorage.removeItem("pendingPayment");
    navigate(`/booking/${showtimeId}`, {
      state: { prevSelectedSeats: activeState.selectedSeats },
    });
  };

  // Format time remaining
  const formatTimeRemaining = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // Show spinner while recovering state from sessionStorage + Redis
  if (recovering) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-red-500 mx-auto mb-4" />
          <p className="text-gray-300">Restoring your session...</p>
        </div>
      </div>
    );
  }

  // NEW error UI (modern design) - Check if we have valid state
  if (!activeState || !activeState.selectedSeats || !activeState.showtime) {
    return (
      <div className="min-h-screen bg-gray-950 pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center min-h-[400px]">
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-8 text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-4">
                  Payment Not Available
                </h2>
                <p className="text-gray-400 mb-6">
                  No valid seat reservation found.
                </p>
                <Button asChild className="bg-red-600 hover:bg-red-700 text-white">
                  <Link to="/movies">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Movies
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const isExpiringSoon = timeRemaining < 60000; // Less than 1 minute

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header with timer - NEW UI */}
      <section
        className={`py-4 border-b-4 ${isExpiringSoon ? "border-red-500 bg-red-900/20" : "border-yellow-500 bg-yellow-900/20"}`}
      >
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <div
              className={`text-xl font-bold mb-2 flex items-center justify-center ${
                isExpiringSoon ? "text-red-400" : "text-yellow-400"
              }`}
            >
              <Timer className="w-6 h-6 mr-2" />
              Time remaining: {formatTimeRemaining(timeRemaining)}
            </div>
            {isExpiringSoon && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-red-400 text-sm flex items-center justify-center animate-pulse"
              >
                <AlertTriangle className="w-4 h-4 mr-1" />
                Your reservation will expire soon!
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Payment content */}
      <main className="py-8 bg-gray-950">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="space-y-8">
            {/* Booking Summary */}
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-8">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <h2 className="text-2xl font-bold text-yellow-400 mb-6 flex items-center">
                    <CheckCircle2 className="w-6 h-6 mr-2" />
                    Complete Your Booking
                  </h2>

                  {/* Movie Info */}
                  <div className="flex items-center space-x-4 p-4 bg-gray-700 rounded-lg mb-6">
                    <img
                      src={
                        activeState.showtime.moviePosterUrl ||
                        `https://placehold.co/80x120/141414/E50914?text=${encodeURIComponent(activeState.showtime.movieTitle)}`
                      }
                      alt={activeState.showtime.movieTitle}
                      className="w-15 h-22 object-cover rounded"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          `https://placehold.co/80x120/141414/E50914?text=${encodeURIComponent(activeState.showtime.movieTitle)}`;
                      }}
                    />
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white mb-2 flex items-center">
                        <Film className="w-4 h-4 mr-2" />
                        {activeState.showtime.movieTitle}
                      </h3>
                      <p className="text-gray-300 mb-1 flex items-center">
                        <MapPin className="w-4 h-4 mr-2" />
                        {activeState.showtime.theaterName}
                      </p>
                      <p className="text-gray-300 flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        {new Date(
                          activeState.showtime.showDatetime,
                        ).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Selected Seats */}
                  <div className="mb-6">
                    <h4 className="font-semibold text-white mb-3">
                      Selected Seats ({activeState.selectedSeats.length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {activeState.selectedSeats.map((seatId) => (
                        <Badge
                          key={seatId}
                          className="bg-red-600 text-white hover:bg-red-700"
                        >
                          Seat {seatId}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Price Breakdown */}
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-300">Subtotal:</span>
                      <span className="text-white font-medium">
                        {activeState.totalPrice.toLocaleString("vi-VN")} VND
                      </span>
                    </div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-gray-300">Service Fee:</span>
                      <span className="text-white font-medium">10,000 VND</span>
                    </div>
                    <div className="flex justify-between items-center text-lg font-bold pt-3 border-t border-gray-600">
                      <span className="text-white">Total:</span>
                      <span className="text-yellow-400 flex items-center">
                        <DollarSign className="w-4 h-4 mr-1" />
                        {(activeState.totalPrice + 10000).toLocaleString(
                          "vi-VN",
                        )}{" "}
                        VND
                      </span>
                    </div>
                  </div>
                </motion.div>
              </CardContent>
            </Card>

            {/* Payment Methods */}
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-8">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                    <CreditCard className="w-5 h-5 mr-2" />
                    Payment Method
                  </h3>
                  <div className="space-y-4">
                    <label className="flex items-center space-x-3 p-4 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors">
                      <input
                        type="radio"
                        name="payment"
                        defaultChecked
                        className="text-red-600 focus:ring-red-500"
                      />
                      <CreditCard className="w-5 h-5 text-blue-400" />
                      <span className="text-white font-medium">
                        Credit/Debit Card
                      </span>
                    </label>
                    <label className="flex items-center space-x-3 p-4 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors">
                      <input
                        type="radio"
                        name="payment"
                        className="text-red-600 focus:ring-red-500"
                      />
                      <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center text-white text-xs font-bold">
                        🏦
                      </div>
                      <span className="text-white font-medium">
                        Bank Transfer
                      </span>
                    </label>
                    <label className="flex items-center space-x-3 p-4 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors">
                      <input
                        type="radio"
                        name="payment"
                        className="text-red-600 focus:ring-red-500"
                      />
                      <div className="w-5 h-5 bg-red-600 rounded flex items-center justify-center text-white text-xs font-bold">
                        📱
                      </div>
                      <span className="text-white font-medium">VNPay</span>
                    </label>
                  </div>
                </motion.div>
              </CardContent>
            </Card>

            {/* Payment Actions */}
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-8">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                >
                  {error && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-red-900/50 border border-red-600 text-red-300 p-4 rounded-lg mb-6 flex items-center"
                    >
                      <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                      {error}
                    </motion.div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                      onClick={handleCancel}
                      disabled={paymentLoading}
                      variant="outline"
                      size="lg"
                      className="!bg-gray-800 !border-gray-600 !text-white hover:!bg-gray-700 hover:!text-white"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>

                    <Button
                      onClick={handlePayment}
                      disabled={paymentLoading || timeRemaining <= 0}
                      size="lg"
                      className="text-white bg-red-600 hover:bg-red-700 min-w-[200px]"
                    >
                      {paymentLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-4 h-4 mr-2" />
                          Pay{" "}
                          {(activeState.totalPrice + 10000).toLocaleString(
                            "vi-VN",
                          )}{" "}
                          VND
                        </>
                      )}
                    </Button>
                  </div>
                </motion.div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PaymentPage;
