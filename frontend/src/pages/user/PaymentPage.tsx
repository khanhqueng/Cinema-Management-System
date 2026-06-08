import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate, Link } from "react-router-dom";
import { motion } from "motion/react";
import {
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
  Wallet,
} from "lucide-react";

import { SePayPgClient } from "sepay-pg-node";
import { bookingService } from "../../services/bookingService";
import { paymentService } from "../../services/paymentService";
import { Showtime } from "../../types";
import {
  getPendingPaymentForShowtime,
  syncPendingPaymentForShowtime,
  removePendingPaymentForShowtime,
  savePendingPayment,
} from "../../utils/pendingPaymentStorage";

// NEW UI components
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";

interface PaymentPageState {
  selectedSeats: number[];
  totalPrice: number;
  showtime: Showtime;
  selectionLockUntil?: number; // 5-minute lock from the booking page
  reservedUntil?: number; // 15-minute payment lock after SePay starts
}

type PaymentMethodId = "sepay" | "momo" | "card" | "counter";

interface PaymentMethod {
  id: PaymentMethodId;
  title: string;
  description: string;
  detail: string;
  status: "available" | "coming_soon";
  icon: React.ElementType;
}

const paymentMethods: PaymentMethod[] = [
  {
    id: "sepay",
    title: "SePay",
    description: "VietQR, bank transfer, ATM/Napas",
    detail: "Redirect to SePay secure checkout",
    status: "available",
    icon: Wallet,
  },
  {
    id: "momo",
    title: "MoMo Wallet",
    description: "Pay from your MoMo account",
    detail: "Coming soon",
    status: "coming_soon",
    icon: Wallet,
  },
  {
    id: "card",
    title: "Credit/Debit Card",
    description: "Visa, Mastercard, JCB",
    detail: "Coming soon",
    status: "coming_soon",
    icon: CreditCard,
  },
  {
    id: "counter",
    title: "Pay at Counter",
    description: "Reserve now, pay at cinema",
    detail: "Coming soon",
    status: "coming_soon",
    icon: DollarSign,
  },
];

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
  const [selectionLockUntil] = useState<number>(state?.selectionLockUntil ?? 0);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seatLabelsById, setSeatLabelsById] = useState<Record<number, string>>(
    {},
  );
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<PaymentMethodId>("sepay");

  // Active state is either from navigation or from recovery
  const activeState = state ?? recoveredState;

  const PAYMENT_LOCK_SECONDS = 15 * 60;
  const waitForNextFrame = () =>
    new Promise<void>((resolve) => {
      window.requestAnimationFrame(() => resolve());
    });

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const paymentStatus = searchParams.get("payment");

    if (paymentStatus === "cancelled") {
      setError("Payment was cancelled. You can resume the reservation here.");
      navigate(location.pathname, { replace: true, state: location.state });
    }
  }, [location, navigate]);

  // Recovery: When page is reloaded (no location.state), read sessionStorage + query Redis TTL
  useEffect(() => {
    if (state) return; // normal navigation — nothing to recover

    if (!showtimeId) {
      setRecovering(false);
      return;
    }

    const localEntry = getPendingPaymentForShowtime(parseInt(showtimeId, 10));

    syncPendingPaymentForShowtime(parseInt(showtimeId, 10))
      .then((pendingEntry) => {
        const fallbackEntry = pendingEntry ?? localEntry;

        if (!fallbackEntry) {
          setRecovering(false);
          return;
        }

        if (!pendingEntry && fallbackEntry.reservedUntil > Date.now()) {
          savePendingPayment(fallbackEntry);
        }

        setReservedUntil(fallbackEntry.reservedUntil);
        setRecoveredState({
          selectedSeats: fallbackEntry.selectedSeats,
          totalPrice: fallbackEntry.totalPrice,
          showtime: fallbackEntry.showtime,
          reservedUntil: fallbackEntry.reservedUntil,
        });
      })
      .catch(() => {
        navigate(`/booking/${showtimeId}`);
      })
      .finally(() => setRecovering(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync local reservedUntil when navigation state provides an active lock timestamp
  useEffect(() => {
    if (state?.reservedUntil) {
      setReservedUntil(state.reservedUntil);
    }
  }, [state?.reservedUntil]);

  useEffect(() => {
    if (!showtimeId || !activeState?.selectedSeats?.length) return;

    bookingService
      .getSeatMapForShowtime(parseInt(showtimeId, 10))
      .then((seatMap) => {
        const labels = seatMap.seats.reduce<Record<number, string>>(
          (acc, seat) => {
            acc[seat.id] = seat.seatLabel;
            return acc;
          },
          {},
        );
        setSeatLabelsById(labels);
      })
      .catch((err) => {
        console.error("Error loading seat labels:", err);
      });
  }, [showtimeId, activeState?.selectedSeats]);

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

  // The initial 5-minute selection hold is intentionally not shown in the UI.
  // If the user does not start SePay in time, release the hold and return to booking.
  useEffect(() => {
    if (!selectionLockUntil || reservedUntil || !showtimeId || !activeState?.selectedSeats) {
      return;
    }

    const remaining = selectionLockUntil - Date.now();
    if (remaining <= 0) {
      handleTimeout();
      return;
    }

    const timeoutId = window.setTimeout(() => {
      handleTimeout();
    }, remaining);

    return () => window.clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectionLockUntil, reservedUntil, showtimeId, activeState?.selectedSeats]);

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

    removePendingPaymentForShowtime(parseInt(showtimeId, 10));
    navigate(`/booking/${showtimeId}`, {
      state: { prevSelectedSeats: activeState.selectedSeats },
    });
  };

  const handlePayment = async () => {
    if (!showtimeId || !activeState?.selectedSeats) return;

    if (selectedPaymentMethod !== "sepay") {
      setError("This payment method is coming soon. Please use SePay for now.");
      return;
    }

    setPaymentLoading(true);
    setError(null);

    try {
      if (selectionLockUntil && selectionLockUntil <= Date.now() && !reservedUntil) {
        await handleTimeout();
        return;
      }

      if (!reservedUntil || reservedUntil <= Date.now()) {
        console.log(
          "Step 1: Extending seat lock for SePay checkout...",
          activeState.selectedSeats,
        );
        const lockResponse = await bookingService.reserveSeatsForSelection({
          showtimeId: parseInt(showtimeId, 10),
          seatIds: activeState.selectedSeats,
          leaseSeconds: PAYMENT_LOCK_SECONDS,
        });

        const until = Date.now() + PAYMENT_LOCK_SECONDS * 1000;
        setReservedUntil(until);
        setTimeRemaining(until - Date.now());
        savePendingPayment({
          selectedSeats:
            lockResponse.lockedSeatIds?.length > 0
              ? lockResponse.lockedSeatIds
              : activeState.selectedSeats,
          showtimeId: parseInt(showtimeId, 10),
          showtime: activeState.showtime,
          totalPrice: activeState.totalPrice,
          reservedUntil: until,
        });

        await waitForNextFrame();
      }

      console.log("Step 2: Creating booking with seats...", activeState.selectedSeats);
      const bookingResponse = await bookingService.createBookingWithSeats({
        showtimeId: parseInt(showtimeId, 10),
        seatIds: activeState.selectedSeats,
      });
      console.log("Booking created:", bookingResponse);

      const bookingId = bookingResponse.booking.id;
      const totalAmount =
        bookingResponse.booking.totalAmount ?? activeState.totalPrice;

      const baseUrl = window.location.origin;
      const successUrl = `${baseUrl}/booking-confirmation/${bookingId}?payment=success`;
      const errorUrl = `${baseUrl}/booking-confirmation/${bookingId}?payment=error`;
      const cancelUrl = `${baseUrl}/booking/${showtimeId}?payment=cancelled`;

      console.log("Step 3: Registering pending payment...");
      const pendingPayment = await paymentService.getSePayCheckout(
        bookingId,
        successUrl,
        errorUrl,
        cancelUrl,
      );
      console.log("Pending payment registered:", pendingPayment.paymentId);

      console.log("Step 4: Initializing SePay SDK...");

      const sepayClient = new SePayPgClient({
        env: import.meta.env.VITE_SEPAY_ENV || "sandbox",
        merchant_id: import.meta.env.VITE_SEPAY_MERCHANT_ID || "",
        secret_key: import.meta.env.VITE_SEPAY_SECRET_KEY || "",
      });

      const checkoutUrl = sepayClient.checkout.initCheckoutUrl();
      console.log("Checkout URL:", checkoutUrl);

      const formFields = sepayClient.checkout.initOneTimePaymentFields({
        operation: "PURCHASE",
        payment_method: "BANK_TRANSFER",
        order_invoice_number: pendingPayment.formFields?.order_invoice_number || bookingId.toString(),
        order_amount: totalAmount,
        currency: "VND",
        order_description: `Cinema Booking #${bookingId} - ${activeState.showtime.movieTitle}`,
        success_url: successUrl,
        error_url: errorUrl,
        cancel_url: cancelUrl,
      });

      console.log("Form fields:", JSON.stringify(formFields, null, 2));
      console.log("Step 5: Submitting to SePay...");

      const form = document.createElement("form");
      form.method = "POST";
      form.action = checkoutUrl;
      form.target = "_self";

      Object.entries(formFields).forEach(([key, value]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = value as string;
        form.appendChild(input);
      });

      document.body.appendChild(form);
      window.history.replaceState(
        { prevSelectedSeats: activeState.selectedSeats },
        "",
        `/booking/${showtimeId}`,
      );
      form.submit();
      document.body.removeChild(form);
    } catch (err: any) {
      console.error("Error in payment flow:", err);
      console.error("Response data:", err.response?.data);

      removePendingPaymentForShowtime(parseInt(showtimeId, 10));
      setReservedUntil(0);
      setTimeRemaining(0);

      try {
        await bookingService.releaseSeatsReservation({
          showtimeId: parseInt(showtimeId, 10),
          seatIds: activeState.selectedSeats,
        });
      } catch (releaseErr) {
        console.error("Error releasing seats after payment failure:", releaseErr);
      }

      if (err.response?.status === 409) {
        setError(
          "Seats are no longer available. Redirecting to seat selection...",
        );
        setTimeout(() => {
          navigate(`/booking/${showtimeId}`);
        }, 2000);
      } else if (err.response?.status === 400) {
        setError(`Payment error: ${err.response?.data?.message || "Bad request"}`);
      } else {
        setError("Payment failed. Please try again. " + (err.message || ""));
      }
    } finally {
      setPaymentLoading(false);
    }
  };

  // Handle cancel - release seats and go back
  const handleCancel = async () => {
    if (!showtimeId || !activeState?.selectedSeats) return;

    if (reservedUntil > Date.now() || selectionLockUntil > Date.now()) {
      try {
        await bookingService.releaseSeatsReservation({
          showtimeId: parseInt(showtimeId, 10),
          seatIds: activeState.selectedSeats,
        });
      } catch (err) {
        console.error("Error releasing seats on cancel:", err);
      }
    }

    removePendingPaymentForShowtime(parseInt(showtimeId, 10));
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

  const displayedTimeRemaining =
    reservedUntil > Date.now()
      ? Math.max(timeRemaining, reservedUntil - Date.now())
      : 0;
  const hasActiveReservation = displayedTimeRemaining > 0;
  const isExpiringSoon = hasActiveReservation && displayedTimeRemaining < 60000; // Less than 1 minute

  return (
    <div className="min-h-screen bg-gray-950">
      {hasActiveReservation && (
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
                Time remaining: {formatTimeRemaining(displayedTimeRemaining)}
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
      )}

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
                          {seatLabelsById[seatId] ?? `Seat ${seatId}`}
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
                    <Wallet className="w-5 h-5 mr-2" />
                    Payment Method
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {paymentMethods.map((method) => {
                      const Icon = method.icon;
                      const isSelected = selectedPaymentMethod === method.id;
                      const isAvailable = method.status === "available";

                      return (
                        <button
                          key={method.id}
                          type="button"
                          onClick={() => {
                            if (!isAvailable) return;
                            setError(null);
                            setSelectedPaymentMethod(method.id);
                          }}
                          disabled={!isAvailable || paymentLoading}
                          aria-pressed={isSelected}
                          className={`min-h-[120px] rounded-lg border p-4 text-left transition-all ${
                            isSelected
                              ? "border-green-500 bg-green-950/40 shadow-[0_0_0_1px_rgba(34,197,94,0.35)]"
                              : "border-gray-700 bg-gray-900/70 hover:border-gray-500"
                          } ${!isAvailable ? "cursor-not-allowed opacity-60" : ""}`}
                        >
                          <div className="flex h-full gap-3">
                            <div
                              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${
                                isSelected
                                  ? "bg-green-500 text-white"
                                  : "bg-gray-800 text-gray-300"
                              }`}
                            >
                              <Icon className="h-5 w-5" />
                            </div>

                            <div className="flex min-w-0 flex-1 flex-col">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="font-semibold text-white">
                                    {method.title}
                                  </p>
                                  <p className="mt-1 text-sm leading-5 text-gray-300">
                                    {method.description}
                                  </p>
                                </div>

                                {isSelected ? (
                                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-400" />
                                ) : (
                                  <span className="mt-1 h-5 w-5 shrink-0 rounded-full border border-gray-600" />
                                )}
                              </div>

                              <div className="mt-auto pt-3">
                                <span
                                  className={`inline-flex rounded-md px-2 py-1 text-xs font-medium ${
                                    isAvailable
                                      ? "bg-green-500/15 text-green-300"
                                      : "bg-yellow-500/15 text-yellow-300"
                                  }`}
                                >
                                  {method.detail}
                                </span>
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* <div className="mt-5 rounded-lg border border-green-700/50 bg-green-950/30 p-4">
                    <p className="text-sm leading-6 text-green-100">
                      SePay is available now and supports VietQR, bank transfer,
                      and ATM/Napas flow through its checkout page. Other
                      methods are shown as placeholders for incoming support.
                    </p>
                  </div> */}
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
                      disabled={paymentLoading}
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
                          <Wallet className="w-4 h-4 mr-2" />
                          Pay with{" "}
                          {
                            paymentMethods.find(
                              (method) => method.id === selectedPaymentMethod,
                            )?.title
                          }{" "}
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
