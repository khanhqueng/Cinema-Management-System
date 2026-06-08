import React, { useState, useEffect } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  Users,
  DollarSign,
  Film,
  Ticket,
  QrCode,
  ArrowLeft,
  Eye,
  X,
  Loader2,
  AlertCircle,
  Star,
  Info,
} from "lucide-react";

// OLD API services (keep 100% logic) - UNCHANGED
import { bookingService } from "../../services/bookingService";
import { paymentService } from "../../services/paymentService";
import { BookingDto, BookingWithSeatsResponse, Booking } from "../../types";
import { removePendingPaymentForShowtime } from "../../utils/pendingPaymentStorage";

// NEW UI components
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";

const BookingConfirmationPage: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const location = useLocation();

  const [booking, setBooking] = useState<BookingDto | Booking | null>(null);
  const [seatBookings, setSeatBookings] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);

  const bookingData = location.state?.bookingData as
    | BookingWithSeatsResponse
    | undefined;

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const paymentParam = searchParams.get("payment");
    if (paymentParam) {
      setPaymentStatus(paymentParam);
    }
  }, [location.search]);

  useEffect(() => {
    const fetchBookingData = async () => {
      const paymentParam = new URLSearchParams(location.search).get("payment");

      if (!bookingId) {
        setError("Booking ID not provided");
        setLoading(false);
        return;
      }

      // From navigation state (direct navigation)
      if (bookingData) {
        setBooking(bookingData.booking);
        setSeatBookings(bookingData.seatBookings);
        if (paymentParam) {
          removePendingPaymentForShowtime(bookingData.booking.showtime.id);
        }
        setLoading(false);
        return;
      }

      // Fetch from API (when redirect from SePay)
      try {
        setLoading(true);
        console.log("Fetching booking:", bookingId);
        const bookingResponse = await bookingService.getBookingById(
          parseInt(bookingId, 10),
        );
        console.log("Booking response:", bookingResponse);
        setBooking(bookingResponse);
        if (paymentParam) {
          removePendingPaymentForShowtime(bookingResponse.showtime.id);
        }
      } catch (err: any) {
        console.error("Error fetching booking:", err);
        console.error("Status:", err.response?.status);
        console.error("Data:", err.response?.data);
        
        if (err.response?.status === 401) {
          setError("Please login to view booking");
        } else if (err.response?.status === 404) {
          setError("Booking not found. It may have been deleted.");
        } else {
          setError("Failed to load booking: " + (err.message || "Unknown error"));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchBookingData();
  }, [bookingId, bookingData]);

  useEffect(() => {
    let pollInterval: NodeJS.Timeout | null = null;

    const checkPaymentStatus = async () => {
      if (!bookingId || !paymentStatus) return;

      if (paymentStatus === "success" || paymentStatus === "error") {
        console.log("Checking payment status for booking:", bookingId);
        
        try {
          const paymentInfo = await paymentService.getPaymentStatusByBooking(
            parseInt(bookingId, 10),
          );
          console.log("Payment info:", paymentInfo);

          const paymentState = String(
            paymentInfo?.status ?? paymentInfo?.paymentStatus ?? "",
          ).toUpperCase();

          if (paymentState === "SUCCESS") {
            const currentBooking = await bookingService.getBookingById(
              parseInt(bookingId, 10),
            );
            console.log("Updated booking:", currentBooking);
            setBooking(currentBooking);
            
            // Stop polling if we got a response
            if (pollInterval) {
              clearInterval(pollInterval);
              pollInterval = null;
            }
          } else if (["FAILED", "CANCELLED", "EXPIRED"].includes(paymentState)) {
            setError("Payment was not completed. Please try again.");
            if (pollInterval) {
              clearInterval(pollInterval);
              pollInterval = null;
            }
          }
        } catch (err: any) {
          console.error("Error checking payment status:", err);
          console.error("Status:", err.response?.status);
          console.error("Data:", err.response?.data);
        }
      }
    };

    // Check immediately
    checkPaymentStatus();

    // Poll every 3 seconds for up to 30 seconds (10 times)
    let pollCount = 0;
    pollInterval = setInterval(() => {
      if (pollCount >= 10) {
        if (pollInterval) {
          clearInterval(pollInterval);
          pollInterval = null;
        }
        return;
      }
      checkPaymentStatus();
      pollCount++;
    }, 3000);

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [bookingId, paymentStatus]);

  const formatDateTime = (dateValue: string | undefined | null): string => {
    if (!dateValue) return "N/A";
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) {
        return dateValue;
      }
      return date.toLocaleString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return dateValue;
    }
  };

  const formatBookingDateEnglish = (
    dateValue: string | undefined | null,
  ): string => {
    if (!dateValue) return "N/A";
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return "N/A";
      return date.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "N/A";
    }
  };

  const formatPriceEnglish = (price: number): string =>
    bookingService.formatPrice(price);

  const getBookingStatusDisplayEnglish = (status: string): string => {
    switch (status) {
      case "PENDING":
        return "Pending";
      case "CONFIRMED":
        return "Confirmed";
      case "CANCELLED":
        return "Cancelled";
      case "COMPLETED":
        return "Completed";
      default:
        return "Unknown";
    }
  };

  const getSeatDisplayStringEnglish = (seatData: any[]): string => {
    if (!seatData || seatData.length === 0) return "No seats selected";

    return seatData
      .map((seatBooking) => {
        if ("seatLabel" in seatBooking) return seatBooking.seatLabel;
        if ("seat" in seatBooking && seatBooking.seat) {
          return `${seatBooking.seat.rowLetter}${seatBooking.seat.seatNumber}`;
        }
        return "Unknown";
      })
      .sort()
      .join(", ");
  };

  // NEW loading UI (modern design)
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-green-500 mx-auto mb-4" />
              <p className="text-gray-300 text-lg">
                Loading booking confirmation...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // NEW error UI (modern design)
  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gray-950 pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center min-h-[400px]">
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-8 text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-4">
                  Booking Not Found
                </h2>
                <p className="text-gray-400 mb-6">
                  {error || "Unable to load booking details."}
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

  // Helper functions to safely access properties from both BookingDto and Booking types
  const getTotalPrice = (booking: BookingDto | Booking): number => {
    if ("totalAmount" in booking) {
      return booking.totalAmount; // BookingDto uses totalAmount
    }
    return booking.totalPrice; // Booking uses totalPrice
  };

  const getBookingStatus = (booking: BookingDto | Booking): string => {
    if ("totalAmount" in booking) {
      return booking.bookingStatus; // BookingDto has string status
    }
    return booking.bookingStatus.toString(); // Booking has enum status
  };

  const getSeatBookingsData = (
    booking: BookingDto | Booking,
    fallbackSeatBookings: any[] | null,
  ) => {
    if ("totalAmount" in booking) {
      return (booking as BookingDto & { seatBookings?: any[] }).seatBookings ||
        fallbackSeatBookings ||
        [];
    }
    return booking.seatBookings || []; // Booking has seatBookings
  };

  const getMovieId = (booking: BookingDto | Booking): number | undefined => {
    if ("totalAmount" in booking) {
      return booking.showtime.movieId; // BookingDto has movieId
    }
    return (booking.showtime as any)?.movie?.id; // Booking has nested movie object
  };

  // Create temporary Booking object for service functions
  const createLegacyBooking = (booking: BookingDto | Booking): Booking => {
    if ("totalPrice" in booking) {
      return booking; // Already a Booking
    }
    // Convert BookingDto to Booking for service functions
    return {
      ...booking,
      totalPrice: booking.totalAmount,
      user: {
        id: booking.user.id,
        email: booking.user.email,
        fullName: booking.user.fullName,
        phone: "",
        role: "USER",
        createdAt: "",
      },
      bookingStatus: booking.bookingStatus as any,
      seatBookings: [],
    } as Booking;
  };

  const isUpcoming = !bookingService.isShowtimePast(
    createLegacyBooking(booking),
  );
  const canCancel = bookingService.isBookingCancellable(
    createLegacyBooking(booking),
  );

  const getHeaderContent = () => {
    const bookingStatus = booking ? getBookingStatus(booking) : "";
    
    if (paymentStatus === "error" || bookingStatus === "CANCELLED") {
      return {
        bgClass: "from-red-900 to-red-800",
        iconBg: "bg-red-500",
        title: "Payment Failed",
        message: "Your payment was not successful. Please try again or contact support.",
        icon: AlertCircle,
      };
    }
    
    if (bookingStatus === "CONFIRMED" || bookingStatus === "COMPLETED") {
      return {
        bgClass: "from-green-900 to-green-800",
        iconBg: "bg-green-500",
        title: "Booking Confirmed!",
        message: "Your tickets have been successfully booked. Check your email for the confirmation.",
        icon: CheckCircle2,
      };
    }
    
    return {
      bgClass: "from-yellow-900 to-yellow-800",
      iconBg: "bg-yellow-500",
      title: "Booking Pending",
      message: "Your booking is awaiting payment confirmation.",
      icon: Clock,
    };
  };

  const headerContent = getHeaderContent();
  const HeaderIcon = headerContent.icon;
  const seatsDisplay = getSeatDisplayStringEnglish(
    getSeatBookingsData(booking, seatBookings),
  );
  const movieTitle =
    booking.showtime?.movieTitle ||
    (booking.showtime as any)?.movie?.title ||
    "Unknown Movie";
  const theaterName =
    booking.showtime?.theaterName ||
    (booking.showtime as any)?.theater?.name ||
    "Unknown Theater";

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Status Header */}
      <section className={`bg-gradient-to-r ${headerContent.bgClass} py-10 text-center border-b border-white/10`}>
        <div className="container mx-auto px-4 max-w-5xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
          >
            <div className={`inline-flex items-center justify-center w-16 h-16 ${headerContent.iconBg} rounded-full mb-5 shadow-lg shadow-black/20`}>
              <HeaderIcon className="w-9 h-9 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
              {headerContent.title}
            </h1>
            <p className="text-base md:text-lg text-white/85 max-w-2xl mx-auto">
              {headerContent.message}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Booking Details */}
      <main className="py-8 md:py-10 bg-gray-950">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-6 lg:gap-8 mb-10">
            {/* Left Side - Booking Details */}
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="space-y-6"
              >
                {/* Booking Details Header */}
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-5 md:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
                      <h2 className="text-xl md:text-2xl font-bold text-white flex items-center">
                        <Ticket className="w-6 h-6 mr-2 text-green-500" />
                        Booking Details
                      </h2>
                      <Badge
                        style={{
                          backgroundColor: bookingService.getBookingStatusColor(
                            getBookingStatus(booking) as any,
                          ),
                        }}
                        className="text-white font-medium"
                      >
                        {getBookingStatusDisplayEnglish(getBookingStatus(booking))}
                      </Badge>
                    </div>

                    <div className="divide-y divide-gray-700">
                      <div className="grid grid-cols-1 sm:grid-cols-[170px_1fr] gap-1 sm:gap-4 py-3">
                        <span className="text-gray-400 text-sm">
                          Booking Reference:
                        </span>
                        <span className="text-white font-semibold font-mono tracking-wide sm:text-right">
                          {bookingService.formatBookingReference(
                            booking.bookingReference,
                          )}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-[170px_1fr] gap-1 sm:gap-4 py-3">
                        <span className="text-gray-400 text-sm">Booking Date:</span>
                        <span className="text-white font-medium sm:text-right">
                          {formatBookingDateEnglish(booking.createdAt)}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-[170px_1fr] gap-1 sm:gap-4 py-3">
                        <span className="text-gray-400 text-sm">Total Amount:</span>
                        <span className="text-green-500 font-bold text-lg flex items-center sm:justify-end">
                          <DollarSign className="w-4 h-4 mr-1" />
                          {formatPriceEnglish(getTotalPrice(booking))}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Movie Information */}
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-5 md:p-6">
                    <h3 className="text-xl font-bold text-white mb-5 flex items-center">
                      <Film className="w-5 h-5 mr-2 text-red-500" />
                      Movie Information
                    </h3>
                    <div className="flex flex-col sm:flex-row items-start gap-4">
                      <img
                        src={
                          booking.showtime?.moviePosterUrl ||
                          (booking.showtime as any)?.movie?.posterUrl ||
                          `https://placehold.co/100x150/141414/E50914?text=${encodeURIComponent(movieTitle)}`
                        }
                        alt={movieTitle}
                        className="w-24 h-36 sm:w-20 sm:h-30 object-cover rounded-lg bg-gray-900"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            `https://placehold.co/100x150/141414/E50914?text=${encodeURIComponent(movieTitle)}`;
                        }}
                      />
                      <div className="flex-1">
                        <h4 className="text-lg font-bold text-white mb-2">
                          {movieTitle}
                        </h4>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            variant="secondary"
                            className="bg-blue-600 text-white"
                          >
                            {(booking.showtime as any)?.movie?.genre || "Genre"}
                          </Badge>
                          <p className="text-gray-400 flex items-center text-sm">
                            <Clock className="w-4 h-4 mr-1" />
                            {(booking.showtime as any)?.movie
                              ?.formattedDuration ||
                              `${booking.showtime?.movieDurationMinutes || 0}min`}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Showtime Information */}
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-5 md:p-6">
                    <h3 className="text-xl font-bold text-white mb-5 flex items-center">
                      <Calendar className="w-5 h-5 mr-2 text-yellow-500" />
                      Showtime Information
                    </h3>
                    <div className="divide-y divide-gray-700">
                      <div className="grid grid-cols-1 sm:grid-cols-[170px_1fr] gap-1 sm:gap-4 py-3">
                        <span className="text-gray-400 flex items-center text-sm">
                          <MapPin className="w-4 h-4 mr-2" />
                          Theater:
                        </span>
                        <span className="text-white font-medium sm:text-right">
                          {theaterName}{" "}
                          ({booking.showtime?.theaterCapacity || 0} seats)
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-[170px_1fr] gap-1 sm:gap-4 py-3">
                        <span className="text-gray-400 flex items-center text-sm">
                          <Calendar className="w-4 h-4 mr-2" />
                          Date & Time:
                        </span>
                        <span className="text-white font-medium sm:text-right">
                          {booking.showtime?.showDatetime
                            ? formatDateTime(booking.showtime.showDatetime)
                            : "Date not available"}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-[170px_1fr] gap-2 sm:gap-4 py-3">
                        <span className="text-gray-400 flex items-center text-sm">
                          <Users className="w-4 h-4 mr-2" />
                          Seats:
                        </span>
                        <span className="text-white font-medium sm:text-right">
                          {seatsDisplay}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-[170px_1fr] gap-1 sm:gap-4 py-3">
                        <span className="text-gray-400 text-sm">Number of Seats:</span>
                        <span className="text-white font-medium sm:text-right">
                          {booking.seatsBooked}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Right Side - Actions and Instructions */}
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="space-y-6 lg:sticky lg:top-24"
              >
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-6">
                    <div className="text-sm text-gray-400 mb-2">
                      Reference
                    </div>
                    <div className="text-2xl font-bold text-white font-mono tracking-wide break-all">
                      {bookingService.formatBookingReference(
                        booking.bookingReference,
                      )}
                    </div>
                    <div className="mt-5 rounded-lg border border-gray-700 bg-gray-900 p-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Seats</span>
                        <span className="text-white font-semibold">
                          {booking.seatsBooked}
                        </span>
                      </div>
                      <div className="mt-3 text-white text-sm leading-6">
                        {seatsDisplay}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                      <Star className="w-5 h-5 mr-2 text-yellow-500" />
                      Quick Actions
                    </h3>
                    <div className="space-y-3">
                      {booking.showtime?.id && (
                        <Button
                          asChild
                          variant="outline"
                          className="w-full !bg-gray-800 !border-gray-600 !text-white hover:!bg-gray-700 hover:!text-white"
                        >
                          <Link
                            to={`/movies/${getMovieId(booking) || booking.showtime.id}`}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Movie Details
                          </Link>
                        </Button>
                      )}

                      {isUpcoming && booking.showtime?.id && (
                        <Button
                          asChild
                          variant="outline"
                          className="w-full !bg-gray-800 !border-gray-600 !text-white hover:!bg-gray-700 hover:!text-white"
                        >
                          <Link
                            to={`/movies/${getMovieId(booking) || booking.showtime.id}/showtimes`}
                          >
                            <Calendar className="w-4 h-4 mr-2" />
                            View Other Showtimes
                          </Link>
                        </Button>
                      )}

                      {/* {canCancel && (
                        <Button
                          onClick={() => handleCancelBooking()}
                          variant="destructive"
                          className="w-full"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Cancel Booking
                        </Button>
                      )} */}
                    </div>
                  </CardContent>
                </Card>

                {/* Important Information */}
                <Card className="bg-blue-950 border-blue-800">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                      <Info className="w-5 h-5 mr-2" />
                      Important Information
                    </h3>
                    <div className="space-y-3 text-sm text-blue-100">
                      <div>
                        <strong className="text-white">Arrival Time:</strong>{" "}
                        Please arrive at least 15 minutes before showtime.
                      </div>
                      <div>
                        <strong className="text-white">
                          Ticket Collection:
                        </strong>{" "}
                        Show your booking reference at the theater or use our
                        mobile app.
                      </div>
                      <div>
                        <strong className="text-white">Cancellation:</strong>{" "}
                        Bookings can be cancelled up to 2 hours before showtime.
                      </div>
                      <div>
                        <strong className="text-white">Contact:</strong> For
                        assistance, please contact our customer support.
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* QR Code / Digital Ticket */}
                {/* <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-6 text-center">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center justify-center">
                      <QrCode className="w-5 h-5 mr-2" />
                      Digital Ticket
                    </h3>
                    <div className="flex flex-col items-center space-y-4">
                      <div className="w-24 h-24 bg-white rounded-lg flex items-center justify-center">
                        <QrCode className="w-14 h-14 text-gray-800" />
                      </div>
                      <div className="text-center">
                        <p className="text-gray-400 text-sm mb-2">
                          Show this reference at the theater:
                        </p>
                        <p className="text-white font-bold">
                          {bookingService.formatBookingReference(
                            booking.bookingReference,
                          )}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card> */}
              </motion.div>
            </div>
          </div>

          {/* Bottom Actions */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center pt-8 border-t border-gray-700"
          >
            <Button
              asChild
              variant="outline"
              size="lg"
              className="bg-gray-800! border-gray-600! text-white! hover:bg-gray-700! hover:text-white!"
            >
              <Link to="/bookings">
                <Ticket className="w-4 h-4 mr-2" />
                View My Bookings
              </Link>
            </Button>
            <Button asChild size="lg" className="bg-red-600 hover:bg-red-700 text-white">
              <Link to="/movies">
                <Film className="w-4 h-4 mr-2" />
                Book More Movies
              </Link>
            </Button>
          </motion.div>
        </div>
      </main>
    </div>
  );

  async function handleCancelBooking() {
    if (!booking) return;

    const confirmed = window.confirm(
      "Are you sure you want to cancel this booking? This action cannot be undone.",
    );

    if (confirmed) {
      try {
        await bookingService.cancelBooking(booking.id);
        toast.success("Booking cancelled successfully.");
        // Refresh booking data
        const updatedBooking = await bookingService.getBookingById(booking.id);
        setBooking(updatedBooking);
      } catch (err) {
        console.error("Error cancelling booking:", err);
        toast.error("Failed to cancel booking. Please try again.");
      }
    }
  }
};

export default BookingConfirmationPage;
