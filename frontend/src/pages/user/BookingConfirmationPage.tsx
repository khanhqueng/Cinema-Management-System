import React, { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { motion } from 'motion/react';
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
  Info
} from 'lucide-react';

// OLD API services (keep 100% logic) - UNCHANGED
import { bookingService } from '../../services/bookingService';
import { BookingDto, BookingWithSeatsResponse, Booking } from '../../types';

// NEW UI components
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';

const BookingConfirmationPage: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const location = useLocation();

  // Support both BookingDto (from navigation state) and Booking (from API)
  const [booking, setBooking] = useState<BookingDto | Booking | null>(null);
  const [seatBookings, setSeatBookings] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get booking data from navigation state if available
  const bookingData = location.state?.bookingData as BookingWithSeatsResponse | undefined;

  useEffect(() => {
    const fetchBookingData = async () => {
      if (!bookingId) {
        setError('Booking ID not provided');
        setLoading(false);
        return;
      }

      // If we have booking data from navigation state, use it
      if (bookingData) {
        setBooking(bookingData.booking);
        setSeatBookings(bookingData.seatBookings);
        setLoading(false);
        return;
      }

      // Otherwise, fetch from API
      try {
        setLoading(true);
        const bookingResponse = await bookingService.getBookingById(parseInt(bookingId, 10));
        setBooking(bookingResponse);
      } catch (err) {
        setError('Failed to load booking details');
        console.error('Error fetching booking:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBookingData();
  }, [bookingId, bookingData]);

  // NEW loading UI (modern design)
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-green-500 mx-auto mb-4" />
              <p className="text-gray-300 text-lg">Loading booking confirmation...</p>
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
                <h2 className="text-2xl font-bold text-white mb-4">Booking Not Found</h2>
                <p className="text-gray-400 mb-6">{error || 'Unable to load booking details.'}</p>
                <Button asChild className="bg-red-600 hover:bg-red-700">
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
    if ('totalAmount' in booking) {
      return booking.totalAmount; // BookingDto uses totalAmount
    }
    return booking.totalPrice; // Booking uses totalPrice
  };

  const getBookingStatus = (booking: BookingDto | Booking): string => {
    if ('totalAmount' in booking) {
      return booking.bookingStatus; // BookingDto has string status
    }
    return booking.bookingStatus.toString(); // Booking has enum status
  };

  const getSeatBookingsData = (booking: BookingDto | Booking, fallbackSeatBookings: any[] | null) => {
    if ('totalAmount' in booking) {
      // BookingDto doesn't have seatBookings directly - use the separate seatBookings state
      return fallbackSeatBookings || [];
    }
    return booking.seatBookings || []; // Booking has seatBookings
  };

  const getMovieId = (booking: BookingDto | Booking): number | undefined => {
    if ('totalAmount' in booking) {
      return booking.showtime.movieId; // BookingDto has movieId
    }
    return (booking.showtime as any)?.movie?.id; // Booking has nested movie object
  };

  // Create temporary Booking object for service functions
  const createLegacyBooking = (booking: BookingDto | Booking): Booking => {
    if ('totalPrice' in booking) {
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
        phone: '',
        role: 'USER',
        createdAt: ''
      },
      bookingStatus: booking.bookingStatus as any,
      seatBookings: []
    } as Booking;
  };

  const isUpcoming = !bookingService.isShowtimePast(createLegacyBooking(booking));
  const canCancel = bookingService.isBookingCancellable(createLegacyBooking(booking));

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Success Header - NEW UI */}
      <section className="bg-gradient-to-r from-green-900 to-green-800 py-16 text-center">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500 rounded-full mb-6">
              <CheckCircle2 className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Booking Confirmed!</h1>
            <p className="text-lg text-green-100 max-w-2xl mx-auto">
              Your tickets have been successfully booked. Check your email for the confirmation.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Booking Details */}
      <main className="py-12 bg-gray-950">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            {/* Left Side - Booking Details */}
            <div className="lg:col-span-2 space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                {/* Booking Details Header */}
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-8">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold text-white flex items-center">
                        <Ticket className="w-6 h-6 mr-2 text-green-500" />
                        Booking Details
                      </h2>
                      <Badge
                        style={{ backgroundColor: bookingService.getBookingStatusColor(getBookingStatus(booking) as any) }}
                        className="text-white font-medium"
                      >
                        {bookingService.getBookingStatusDisplay(getBookingStatus(booking) as any)}
                      </Badge>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-3 border-b border-gray-700">
                        <span className="text-gray-400">Booking Reference:</span>
                        <span className="text-white font-medium">
                          {bookingService.formatBookingReference(booking.bookingReference)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-3 border-b border-gray-700">
                        <span className="text-gray-400">Booking Date:</span>
                        <span className="text-white font-medium">
                          {bookingService.formatBookingDate(booking.createdAt)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-3">
                        <span className="text-gray-400">Total Amount:</span>
                        <span className="text-green-500 font-bold text-lg flex items-center">
                          <DollarSign className="w-4 h-4 mr-1" />
                          {bookingService.formatPrice(getTotalPrice(booking))}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Movie Information */}
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-8">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                      <Film className="w-5 h-5 mr-2 text-red-500" />
                      Movie Information
                    </h3>
                    <div className="flex items-start space-x-4">
                      <img
                        src={booking.showtime?.moviePosterUrl || (booking.showtime as any)?.movie?.posterUrl || `https://via.placeholder.com/100x150/141414/E50914?text=${encodeURIComponent(booking.showtime?.movieTitle || 'Movie')}`}
                        alt={booking.showtime?.movieTitle || 'Movie'}
                        className="w-20 h-30 object-cover rounded-lg"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://via.placeholder.com/100x150/141414/E50914?text=${encodeURIComponent(booking.showtime?.movieTitle || 'Movie')}`;
                        }}
                      />
                      <div className="flex-1">
                        <h4 className="text-lg font-bold text-white mb-2">
                          {booking.showtime?.movieTitle || (booking.showtime as any)?.movie?.title || 'Unknown Movie'}
                        </h4>
                        <div className="space-y-2">
                          <Badge variant="secondary" className="bg-blue-600 text-white">
                            {(booking.showtime as any)?.movie?.genre || 'Genre'}
                          </Badge>
                          <p className="text-gray-400 flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {(booking.showtime as any)?.movie?.formattedDuration || `${booking.showtime?.movieDurationMinutes || 0}min`}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Showtime Information */}
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-8">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                      <Calendar className="w-5 h-5 mr-2 text-yellow-500" />
                      Showtime Information
                    </h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-3 border-b border-gray-700">
                        <span className="text-gray-400 flex items-center">
                          <MapPin className="w-4 h-4 mr-2" />
                          Theater:
                        </span>
                        <span className="text-white font-medium">
                          {booking.showtime?.theaterName || (booking.showtime as any)?.theater?.name || 'Unknown Theater'}
                          ({booking.showtime?.theaterCapacity || 0} seats)
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-3 border-b border-gray-700">
                        <span className="text-gray-400 flex items-center">
                          <Calendar className="w-4 h-4 mr-2" />
                          Date & Time:
                        </span>
                        <span className="text-white font-medium">
                          {booking.showtime?.showDatetime ?
                            new Date(booking.showtime.showDatetime).toLocaleString('vi-VN', {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : 'Date not available'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-3 border-b border-gray-700">
                        <span className="text-gray-400 flex items-center">
                          <Users className="w-4 h-4 mr-2" />
                          Seats:
                        </span>
                        <span className="text-white font-medium">
                          {bookingService.getSeatDisplayString(getSeatBookingsData(booking, seatBookings))}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-3">
                        <span className="text-gray-400">Number of Seats:</span>
                        <span className="text-white font-medium">{booking.seatsBooked}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Right Side - Actions and Instructions */}
            <div className="lg:col-span-1 space-y-6">
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="space-y-6"
              >
                {/* Quick Actions */}
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                      <Star className="w-5 h-5 mr-2 text-yellow-500" />
                      Quick Actions
                    </h3>
                    <div className="space-y-3">
                      {booking.showtime?.id && (
                        <Button asChild variant="outline" className="w-full !bg-gray-800 !border-gray-600 !text-white hover:!bg-gray-700 hover:!text-white">
                          <Link to={`/movies/${getMovieId(booking) || booking.showtime.id}`}>
                            <Eye className="w-4 h-4 mr-2" />
                            View Movie Details
                          </Link>
                        </Button>
                      )}

                      {isUpcoming && booking.showtime?.id && (
                        <Button asChild variant="outline" className="w-full !bg-gray-800 !border-gray-600 !text-white hover:!bg-gray-700 hover:!text-white">
                          <Link to={`/movies/${getMovieId(booking) || booking.showtime.id}/showtimes`}>
                            <Calendar className="w-4 h-4 mr-2" />
                            View Other Showtimes
                          </Link>
                        </Button>
                      )}

                      {canCancel && (
                        <Button
                          onClick={() => handleCancelBooking()}
                          variant="destructive"
                          className="w-full"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Cancel Booking
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Important Information */}
                <Card className="bg-blue-900 border-blue-700">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                      <Info className="w-5 h-5 mr-2" />
                      Important Information
                    </h3>
                    <div className="space-y-3 text-sm text-blue-100">
                      <div>
                        <strong className="text-white">Arrival Time:</strong> Please arrive at least 15 minutes before showtime.
                      </div>
                      <div>
                        <strong className="text-white">Ticket Collection:</strong> Show your booking reference at the theater or use our mobile app.
                      </div>
                      <div>
                        <strong className="text-white">Cancellation:</strong> Bookings can be cancelled up to 2 hours before showtime.
                      </div>
                      <div>
                        <strong className="text-white">Contact:</strong> For assistance, please contact our customer support.
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* QR Code / Digital Ticket */}
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-6 text-center">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center justify-center">
                      <QrCode className="w-5 h-5 mr-2" />
                      Digital Ticket
                    </h3>
                    <div className="flex flex-col items-center space-y-4">
                      <div className="w-20 h-20 bg-white rounded-lg flex items-center justify-center">
                        <QrCode className="w-12 h-12 text-gray-800" />
                      </div>
                      <div className="text-center">
                        <p className="text-gray-400 text-sm mb-2">
                          Show this reference at the theater:
                        </p>
                        <p className="text-white font-bold">
                          {bookingService.formatBookingReference(booking.bookingReference)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
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
            <Button asChild variant="outline" size="lg" className="!bg-gray-800 !border-gray-600 !text-white hover:!bg-gray-700 hover:!text-white">
              <Link to="/bookings/my-bookings">
                <Ticket className="w-4 h-4 mr-2" />
                View My Bookings
              </Link>
            </Button>
            <Button asChild size="lg" className="bg-red-600 hover:bg-red-700">
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
      'Are you sure you want to cancel this booking? This action cannot be undone.'
    );

    if (confirmed) {
      try {
        await bookingService.cancelBooking(booking.id);
        alert('Booking cancelled successfully.');
        // Refresh booking data
        const updatedBooking = await bookingService.getBookingById(booking.id);
        setBooking(updatedBooking);
      } catch (err) {
        console.error('Error cancelling booking:', err);
        alert('Failed to cancel booking. Please try again.');
      }
    }
  }
};


export default BookingConfirmationPage;