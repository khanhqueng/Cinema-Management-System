import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
  ArrowLeft,
  MapPin,
  Clock,
  Users,
  DollarSign,
  Loader2,
  Calendar,
  Film,
  Armchair,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

// OLD API services (keep 100% logic) - UNCHANGED
import { showtimeService } from "../../services/showtimeService";
import { bookingService } from "../../services/bookingService";
import {
  Showtime,
  SeatMapResponse,
  SeatInfo,
  SeatAvailabilityResponse,
  BookingWithSeatsResponse,
} from "../../types";

// NEW UI components
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";

const BookingPage: React.FC = () => {
  const { showtimeId } = useParams<{ showtimeId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [showtime, setShowtime] = useState<Showtime | null>(null);
  const [seatMap, setSeatMap] = useState<SeatMapResponse | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [priceCheck, setPriceCheck] = useState<SeatAvailabilityResponse | null>(
    null,
  );
  const [pendingPayment, setPendingPayment] = useState<{
    selectedSeats: number[];
    totalPrice: number;
    showtime: Showtime;
    reservedUntil: number;
  } | null>(null);
  const [bannerTimeLeft, setBannerTimeLeft] = useState<number>(0);

  useEffect(() => {
    const fetchData = async () => {
      if (!showtimeId) {
        setError("Showtime ID not provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Fetch showtime and seat map in parallel
        const [showtimeData, seatMapData] = await Promise.all([
          showtimeService.getShowtimeById(parseInt(showtimeId, 10)),
          bookingService.getSeatMapForShowtime(parseInt(showtimeId, 10)),
        ]);

        setShowtime(showtimeData);
        setSeatMap(seatMapData);

        // Restore previous seat selection (e.g. user came back from payment via Cancel)
        const prevSeats = (location.state as any)?.prevSelectedSeats;
        if (Array.isArray(prevSeats) && prevSeats.length > 0) {
          setSelectedSeats(prevSeats);
        }
      } catch (err) {
        setError("Failed to load showtime or seat information");
        console.error("Error fetching booking data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [showtimeId]);

  // Update price when selected seats change
  useEffect(() => {
    const updatePrice = async () => {
      if (selectedSeats.length > 0 && showtimeId) {
        try {
          const priceData = await bookingService.calculateSeatPrice(
            parseInt(showtimeId, 10),
            selectedSeats,
          );
          setPriceCheck(priceData);
          setTotalPrice(priceData.totalPrice);
        } catch (err) {
          console.error("Error calculating price:", err);
        }
      } else {
        setPriceCheck(null);
        setTotalPrice(0);
      }
    };

    updatePrice();
  }, [selectedSeats, showtimeId]);

  // No cleanup needed since we're not locking seats until "Book Now" is clicked

  // Check localStorage for an active pending payment on this showtime
  useEffect(() => {
    if (!showtimeId) return;
    const raw = localStorage.getItem("pendingPayment");
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as {
        selectedSeats: number[];
        showtimeId: number;
        showtime: Showtime;
        totalPrice: number;
      };
      if (String(parsed.showtimeId) !== showtimeId) return;
      bookingService
        .getSeatLockStatus(parsed.showtimeId, parsed.selectedSeats)
        .then((status) => {
          if (status.locked && status.remainingMs > 0) {
            const until = Date.now() + status.remainingMs;
            // Use actual locked seatIds from API for accurate count
            const actualSeats =
              status.seatIds && status.seatIds.length > 0
                ? status.seatIds
                : parsed.selectedSeats;
            setPendingPayment({
              selectedSeats: actualSeats,
              totalPrice: parsed.totalPrice,
              showtime: parsed.showtime,
              reservedUntil: until,
            });
            setBannerTimeLeft(status.remainingMs);
          } else {
            localStorage.removeItem("pendingPayment");
          }
        })
        .catch(() => localStorage.removeItem("pendingPayment"));
    } catch {
      localStorage.removeItem("pendingPayment");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showtimeId]);

  // Countdown for Resume Payment banner
  useEffect(() => {
    if (!pendingPayment) return;
    setBannerTimeLeft(Math.max(0, pendingPayment.reservedUntil - Date.now()));
    const interval = setInterval(() => {
      const remaining = Math.max(0, pendingPayment.reservedUntil - Date.now());
      setBannerTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        localStorage.removeItem("pendingPayment");
        setPendingPayment(null);
        // Refresh seat map so previously locked seats become selectable again
        if (showtimeId) {
          bookingService
            .getSeatMapForShowtime(parseInt(showtimeId, 10))
            .then(setSeatMap)
            .catch(console.error);
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [pendingPayment, showtimeId]);

  const handleSeatToggle = (seatId: number) => {
    if (pendingPayment && bannerTimeLeft > 0) {
      toast.warning(
        "You have seats on hold — please complete your current payment before selecting new seats.",
      );
      return;
    }
    setSelectedSeats((prev) => {
      if (prev.includes(seatId)) {
        return prev.filter((id) => id !== seatId);
      } else {
        return [...prev, seatId];
      }
    });
  };

  const handleBooking = async () => {
    if (pendingPayment && bannerTimeLeft > 0) {
      toast.warning(
        "You have seats on hold. Please complete your current payment first.",
      );
      return;
    }

    if (!showtimeId || selectedSeats.length === 0) {
      toast.warning("Please select at least one seat");
      return;
    }

    try {
      setBookingLoading(true);

      // Step 1: Reserve seats first (this is where race condition prevention happens)
      try {
        const reserveResponse = await bookingService.reserveSeatsForSelection({
          showtimeId: parseInt(showtimeId, 10),
          seatIds: selectedSeats,
        });

        // Seats successfully reserved, proceed to payment page
      } catch (reserveErr: any) {
        // Handle seat reservation conflicts
        if (reserveErr.response?.status === 409) {
          toast.error(
            "Some selected seats are already taken by another user. Please select different seats.",
          );
        } else {
          toast.error("Unable to reserve selected seats. Please try again.");
        }

        // Refresh seat map and reset selection
        const updatedSeatMap = await bookingService.getSeatMapForShowtime(
          parseInt(showtimeId, 10),
        );
        setSeatMap(updatedSeatMap);
        setSelectedSeats([]);
        return;
      }

      // Step 2: Save pending payment state so PaymentPage can recover after reload
      localStorage.setItem(
        "pendingPayment",
        JSON.stringify({
          selectedSeats,
          showtimeId: parseInt(showtimeId, 10),
          showtime,
          totalPrice,
        }),
      );

      // Step 3: Navigate to payment page with reserved seats
      // Instead of creating booking immediately, go to payment page
      navigate(`/payment/${showtimeId}`, {
        state: {
          selectedSeats,
          totalPrice,
          showtime,
          reservedUntil: Date.now() + 5 * 60 * 1000, // 5 minutes from now
        },
      });
    } catch (err) {
      console.error("Error in booking process:", err);
      toast.error("Failed to proceed with booking. Please try again.");
    } finally {
      setBookingLoading(false);
    }
  };

  // NEW loading UI (modern design)
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-red-500 mx-auto mb-4" />
              <p className="text-gray-300 text-lg">Loading seat map...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // NEW error UI (modern design)
  if (error || !showtime || !seatMap) {
    return (
      <div className="min-h-screen bg-gray-950 pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center min-h-[400px]">
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-8 text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-4">
                  Booking Not Available
                </h2>
                <p className="text-gray-400 mb-6">
                  {error || "Unable to load booking information."}
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

  const seatMapByRow = bookingService.generateSeatMap(seatMap.seats);
  const rows = Object.keys(seatMapByRow).sort();

  const prevSelectedSeats = (location.state as any)?.prevSelectedSeats as
    | number[]
    | undefined;

  const pendingMinutes = Math.floor(bannerTimeLeft / 60000);
  const pendingSeconds = Math.floor((bannerTimeLeft % 60000) / 1000);

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Resume Payment banner — active lock detected */}
      {pendingPayment && bannerTimeLeft > 0 && (
        <div className="bg-yellow-600/20 border-b border-yellow-500 py-3 px-4">
          <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-yellow-300 text-sm font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              You are holding
              <span className="font-bold">
                {pendingPayment.selectedSeats.length} seat
                {pendingPayment.selectedSeats.length !== 1 ? "s" : ""}
              </span>
              {" — "}remaining 
              <span className="font-bold text-yellow-200">
                {pendingMinutes}:{String(pendingSeconds).padStart(2, "0")}
              </span>
               to complete the payment.
            </div>
            <Button
              size="sm"
              className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold shrink-0"
              onClick={() =>
                navigate(`/payment/${showtimeId}`, {
                  state: {
                    selectedSeats: pendingPayment.selectedSeats,
                    totalPrice: pendingPayment.totalPrice,
                    showtime: pendingPayment.showtime,
                    reservedUntil: pendingPayment.reservedUntil,
                  },
                })
              }
            >
              Continue to Payment →
            </Button>
          </div>
        </div>
      )}

      {/* Restore notice banner */}
      {prevSelectedSeats && prevSelectedSeats.length > 0 && (
        <div className="bg-yellow-900/40 border-b border-yellow-700 py-2 px-4 text-center text-yellow-300 text-sm flex items-center justify-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          Your previous seat selection has been restored. Modify or confirm to
          proceed.
        </div>
      )}

      {/* Header Section - NEW UI with OLD data */}
      <section className="bg-gray-900 py-6 border-b border-gray-800">
        <div className="container mx-auto px-4">
          {/* Breadcrumb */}
          <nav className="mb-6">
            <div className="flex items-center space-x-2 text-gray-400">
              <Link to="/movies" className="hover:text-white transition-colors">
                Movies
              </Link>
              <span className="text-gray-600">/</span>
              <Link
                to={`/movies/${showtime.movieId}`}
                className="hover:text-white transition-colors"
              >
                {showtime.movieTitle}
              </Link>
              <span className="text-gray-600">/</span>
              <Link
                to={`/movies/${showtime.movieId}/showtimes`}
                className="hover:text-white transition-colors"
              >
                Showtimes
              </Link>
              <span className="text-gray-600">/</span>
              <span className="text-white">Book Tickets</span>
            </div>
          </nav>

          {/* Movie & Showtime Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-start space-x-4"
          >
            <img
              src={
                showtime.moviePosterUrl ||
                `https://placehold.co/100x150/141414/E50914?text=${encodeURIComponent(showtime.movieTitle)}`
              }
              alt={showtime.movieTitle}
              className="w-20 h-30 object-cover rounded-lg"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  `https://placehold.co/100x150/141414/E50914?text=${encodeURIComponent(showtime.movieTitle)}`;
              }}
            />
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white mb-4">
                {showtime.movieTitle}
              </h1>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-gray-300">
                    <MapPin className="w-4 h-4" />
                    <span className="font-medium">{showtime.theaterName}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-300">
                    <Users className="w-4 h-4" />
                    <span>Capacity: {showtime.theaterCapacity} seats</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-gray-300">
                    <Calendar className="w-4 h-4" />
                    <span>{showtimeService.formatShowtime(showtime)}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-green-600 font-bold">
                    <DollarSign className="w-4 h-4" />
                    <span>
                      {showtimeService.formatPrice(showtime.price)} per seat
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Content Section */}
      <main className="py-8 bg-gray-950">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Seat Map Section */}
            <div className="lg:col-span-2">
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-8">
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                  >
                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                      <Armchair className="w-6 h-6 mr-2 text-red-500" />
                      Select Your Seats
                    </h2>

                    {/* Screen Indicator */}
                    <div className="text-center mb-7">
                      <div className="max-w-xl mx-auto">
                        <div className="h-1 rounded-full bg-gray-300/90 mb-2" />
                        <div className="text-xs font-bold tracking-widest text-gray-300 uppercase">
                          Screen
                        </div>
                      </div>
                    </div>


                    {/* Seat Map */}
                    <div className="flex flex-col items-center space-y-3 mb-8">
                      {rows.map((row) => {
                        const rowSeats = seatMapByRow[row];
                        const coupleCount = rowSeats.filter(
                          (s) => s.seatType === "COUPLE",
                        ).length;
                        // Treat a row as a Sweetbox row if more than half its seats are COUPLE
                        const isCoupleRow =
                          rowSeats.length > 0 &&
                          coupleCount / rowSeats.length >= 0.5;

                        // ── Sweetbox row: group every 2 COUPLE seats into one paired button ──
                        if (isCoupleRow) {
                          const coupleSeats = rowSeats.filter(
                            (s) => s.seatType === "COUPLE",
                          );
                          const pairs: SeatInfo[][] = [];
                          for (let i = 0; i < coupleSeats.length; i += 2) {
                            pairs.push(coupleSeats.slice(i, i + 2));
                          }
                          return (
                            <div
                              key={row}
                              className="flex items-center space-x-4"
                            >
                              <div className="w-8 text-center font-bold text-amber-400 text-xs">
                                {row}
                              </div>
                              <div className="flex space-x-2">
                                {pairs.map((pair, pairIdx) => {
                                  const ids = pair.map((s) => s.id);
                                  const isSelected = ids.some((id) =>
                                    selectedSeats.includes(id),
                                  );
                                  const isBooked = pair.some(
                                    (s) => !s.isAvailable && !s.lockedByOther,
                                  );
                                  const isLockedByOther = pair.some(
                                    (s) => s.lockedByOther === true,
                                  );
                                  const isDisabled = isBooked || isLockedByOther;

                                  const label =
                                    pair.length === 2
                                      ? `${pair[0].rowLetter ?? row}${pair[0].seatNumber}·${pair[1].seatNumber}`
                                      : `${pair[0].rowLetter ?? row}${pair[0].seatNumber}`;

                                  // w-20 ≈ 2×w-9 + gap, matching the width of two regular seats
                                  let cls =
                                    "w-20 h-9 border rounded-lg text-white text-[10px] font-bold transition-all duration-200 hover:scale-105 flex items-center justify-center";

                                  if (isBooked) {
                                    cls +=
                                      " bg-gray-600 border-gray-600 cursor-not-allowed opacity-50";
                                  } else if (isLockedByOther) {
                                    cls +=
                                      " bg-orange-500 border-orange-400 cursor-not-allowed opacity-70";
                                  } else if (isSelected) {
                                    cls +=
                                      " bg-green-600 border-emerald-400 hover:bg-emerald-600 shadow-lg shadow-green-600/30 cursor-pointer";
                                  } else {
                                    cls +=
                                      " bg-pink-500 border-pink-400 hover:bg-pink-400 cursor-pointer shadow-sm shadow-pink-500/20";
                                  }

                                  const tooltip = isLockedByOther
                                    ? `${label} - Temporarily held`
                                    : `${label} - Sweetbox (2 seats)`;

                                  const shouldAddAisle =
                                    pairIdx > 0 &&
                                    pairIdx % 2 === 0 &&
                                    pairIdx < pairs.length;

                                  return (
                                    <React.Fragment key={pairIdx}>
                                      {shouldAddAisle && (
                                        <div className="w-5 min-w-[20px] border-l-2 border-gray-600 mx-2 h-9" />
                                      )}
                                      <button
                                        className={cls}
                                        disabled={isDisabled}
                                        title={tooltip}
                                        onClick={() => {
                                          if (isDisabled) return;
                                          setSelectedSeats((prev) => {
                                            const anySelected = ids.some(
                                              (id) => prev.includes(id),
                                            );
                                            if (anySelected) {
                                              return prev.filter(
                                                (id) => !ids.includes(id),
                                              );
                                            }
                                            return [...prev, ...ids];
                                          });
                                        }}
                                      >
                                        {label}
                                      </button>
                                    </React.Fragment>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        }

                        // ── Normal row rendering ──
                        return (
                          <div
                            key={row}
                            className="flex items-center space-x-4"
                          >
                            <div className="w-8 text-center font-bold text-gray-400">
                              {row}
                            </div>
                            <div className="flex space-x-2">
                              {rowSeats.map((seat, index) => {
                                const shouldAddAisle =
                                  index > 0 &&
                                  (index + 1) % 4 === 0 &&
                                  index < rowSeats.length - 1;
                                const isSelected = selectedSeats.includes(
                                  seat.id,
                                );
                                const isBooked =
                                  !seat.isAvailable && !seat.lockedByOther;
                                const isLockedByOther =
                                  seat.lockedByOther === true;
                                const isVIP = seat.seatType === "VIP";
                                const isCouple = seat.seatType === "COUPLE";
                                const isWheelchair =
                                  seat.seatType === "WHEELCHAIR";

                                const centerStart = Math.floor(
                                  rowSeats.length * 0.35,
                                );
                                const centerEnd = Math.ceil(
                                  rowSeats.length * 0.65,
                                );
                                const isCenterZone =
                                  index >= centerStart &&
                                  index < centerEnd &&
                                  !isCouple;

                                let seatClasses =
                                  "w-9 h-9 border border-gray-700 rounded-md text-white text-[10px] font-bold transition-all duration-200 hover:scale-105";

                                if (isBooked) {
                                  seatClasses +=
                                    " bg-gray-600 cursor-not-allowed opacity-50";
                                } else if (isLockedByOther) {
                                  seatClasses +=
                                    " bg-orange-500 cursor-not-allowed opacity-70";
                                } else if (isSelected) {
                                  seatClasses +=
                                    " bg-green-600 hover:bg-emerald-600 shadow-lg shadow-green-600/30";
                                } else if (isVIP) {
                                  seatClasses +=
                                    " bg-red-500 hover:bg-red-600 cursor-pointer";
                                } else if (isCouple) {
                                  seatClasses +=
                                    " bg-pink-500 hover:bg-pink-400 cursor-pointer";
                                } else if (isWheelchair) {
                                  seatClasses +=
                                    " bg-blue-500 hover:bg-blue-600 cursor-pointer";
                                } else {
                                  seatClasses +=
                                    " bg-violet-600 hover:bg-violet-700 cursor-pointer";
                                }

                                if (
                                  isCenterZone &&
                                  !isBooked &&
                                  !isLockedByOther &&
                                  !isSelected
                                ) {
                                  seatClasses +=
                                    " ring-1 ring-green-600/80 ring-offset-0";
                                }

                                const isDisabled = isBooked || isLockedByOther;
                                const tooltip = isLockedByOther
                                  ? `${row}${seat.seatNumber} - Temporarily held by another user`
                                  : `${row}${seat.seatNumber} - ${bookingService.getSeatTypeDisplay(seat.seatType)} (${seat.priceMultiplier}x)`;

                                return (
                                  <React.Fragment key={seat.id}>
                                    <button
                                      onClick={() =>
                                        !isDisabled &&
                                        handleSeatToggle(seat.id)
                                      }
                                      disabled={isDisabled}
                                      className={seatClasses}
                                      title={tooltip}
                                    >
                                      {`${seat.rowLetter ?? row}${seat.seatNumber}`}
                                    </button>
                                    {shouldAddAisle && (
                                      <div className="w-5 min-w-[20px] border-l-2 border-gray-600 mx-2 h-9 flex items-center justify-center text-gray-600 text-xs font-bold"></div>
                                    )}
                                  </React.Fragment>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>


                    {/* Legend */}
                    <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs">
                      <div className="flex items-center space-x-1.5">
                        <div className="w-5 h-5 bg-gray-600 rounded border border-gray-600"></div>
                        <span className="text-gray-300">Booked</span>
                      </div>
                        <div className="flex items-center space-x-1.5">
                        <div className="w-5 h-5 bg-green-600 rounded border border-gray-600"></div>
                        <span className="text-gray-300">Your selected seats</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <div className="w-5 h-5 bg-violet-600 rounded border border-gray-600"></div>
                        <span className="text-gray-300">Regular seats</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <div className="w-5 h-5 bg-red-500 rounded border border-gray-600"></div>
                        <span className="text-gray-300">VIP seats</span>
                      </div>
                        <div className="flex items-center space-x-1.5">
                        <div className="w-5 h-5 bg-pink-500 rounded border border-gray-600"></div>
                        <span className="text-gray-300">Couple seats</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <div className="w-5 h-5 bg-blue-500 rounded border border-gray-600"></div>
                        <span className="text-gray-300">Wheelchair</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <div className="w-5 h-5 rounded border border-green-600/80 bg-transparent"></div>
                        <span className="text-gray-300">Center zone</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <div className="w-5 h-5 bg-orange-500 rounded border border-gray-600"></div>
                        <span className="text-gray-300">Temporarily held</span>
                      </div>
                    </div>
                  </motion.div>
                </CardContent>
              </Card>
            </div>

            {/* Booking Summary Section */}
            <div className="lg:col-span-1">
              <Card className="bg-gray-800 border-gray-700 sticky top-8">
                <CardContent className="p-6">
                  <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                  >
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                      <CheckCircle2 className="w-5 h-5 mr-2 text-green-600" />
                      Booking Summary
                    </h3>

                    <div className="mb-6">
                      <h4 className="font-semibold text-white mb-3">
                        Selected Seats ({selectedSeats.length})
                      </h4>
                      {selectedSeats.length > 0 ? (
                        <div className="space-y-2">
                          {selectedSeats.map((seatId) => {
                            const seat = seatMap.seats.find(
                              (s) => s.id === seatId,
                            );
                            return seat ? (
                              <div
                                key={seatId}
                                className="flex justify-between items-center py-2 border-b border-gray-700"
                              >
                                <span className="text-white font-medium">
                                  {seat.rowLetter}
                                  {seat.seatNumber}
                                </span>
                                <Badge variant="secondary" className="text-xs">
                                  {bookingService.getSeatTypeDisplay(
                                    seat.seatType,
                                  )}
                                </Badge>
                              </div>
                            ) : null;
                          })}
                        </div>
                      ) : (
                        <p className="text-gray-400 italic">
                          No seats selected
                        </p>
                      )}
                    </div>

                    {priceCheck && (
                      <div className="bg-gray-700 rounded-lg p-4 mb-6">
                        <div className="flex justify-between items-center mb-2 text-sm">
                          <span className="text-gray-300">
                            Seats ({priceCheck.seatCount})
                          </span>
                          <span className="text-white">
                            {bookingService.formatPrice(priceCheck.totalPrice)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-lg font-bold pt-2 border-t border-gray-600">
                          <span className="text-white">Total</span>
                          <span className="text-green-600">
                            {bookingService.formatPrice(priceCheck.totalPrice)}
                          </span>
                        </div>
                      </div>
                    )}

                    {pendingPayment && bannerTimeLeft > 0 ? (
                      <>
                        <Button
                          onClick={() =>
                            navigate(`/payment/${showtimeId}`, {
                              state: {
                                selectedSeats: pendingPayment.selectedSeats,
                                totalPrice: pendingPayment.totalPrice,
                                showtime: pendingPayment.showtime,
                                reservedUntil: pendingPayment.reservedUntil,
                              },
                            })
                          }
                          className="w-full mb-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold"
                        >
                          Resume Payment →
                        </Button>
                        <p className="text-xs text-yellow-400 text-center mb-3">
                          You have {pendingPayment.selectedSeats.length} seat
                          {pendingPayment.selectedSeats.length !== 1
                            ? "s"
                            : ""}{" "}
                          on hold. Complete payment before booking new seats.
                        </p>
                      </>
                    ) : (
                      <Button
                        onClick={handleBooking}
                        disabled={selectedSeats.length === 0 || bookingLoading}
                        className={`w-full mb-6 text-white ${
                          selectedSeats.length > 0 && !bookingLoading
                            ? "text-white bg-red-600 hover:bg-red-700"
                            : "bg-gray-600 cursor-not-allowed"
                        }`}
                      >
                        {bookingLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          "Book Now"
                        )}
                      </Button>
                    )}

                    <div className="text-xs text-gray-400">
                      <h4 className="font-semibold text-white mb-2 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        Important Notes:
                      </h4>
                      <ul className="space-y-1">

                        <li>
                          • Bookings can be cancelled up to 2 hours before
                          showtime
                        </li>
                        <li>
                          • Please arrive at least 15 minutes before showtime
                        </li>
                        <li>• VIP seats include premium amenities</li>
                      </ul>
                    </div>
                  </motion.div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default BookingPage;
