import React, { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { bookingService } from '../../services/bookingService';
import { BookingDto, BookingWithSeatsResponse, Booking } from '../../types';

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

  if (loading) {
    return (
      <div style={loadingContainerStyle}>
        <div style={spinnerStyle}></div>
        <p>Loading booking confirmation...</p>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div style={errorContainerStyle}>
        <h2>Booking Not Found</h2>
        <p>{error || 'Unable to load booking details.'}</p>
        <Link to="/movies" style={backButtonStyle}>
          Back to Movies
        </Link>
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
    <div style={containerStyle}>
      {/* Success Header */}
      <div style={successHeaderStyle}>
        <div style={successIconStyle}>✓</div>
        <h1 style={successTitleStyle}>Booking Confirmed!</h1>
        <p style={successSubtitleStyle}>
          Your tickets have been successfully booked. Check your email for the confirmation.
        </p>
      </div>

      {/* Booking Details */}
      <div style={contentSectionStyle}>
        <div style={contentContainerStyle}>
          <div style={confirmationLayoutStyle}>
            {/* Left Side - Booking Details */}
            <div style={detailsSectionStyle}>
              <div style={sectionHeaderStyle}>
                <h2 style={sectionTitleStyle}>Booking Details</h2>
                <div style={bookingStatusStyle}>
                  <span
                    style={{
                      ...statusBadgeStyle,
                      backgroundColor: bookingService.getBookingStatusColor(getBookingStatus(booking) as any)
                    }}
                  >
                    {bookingService.getBookingStatusDisplay(getBookingStatus(booking) as any)}
                  </span>
                </div>
              </div>

              <div style={detailsCardStyle}>
                <div style={detailRowStyle}>
                  <span style={labelStyle}>Booking Reference:</span>
                  <span style={valueStyle}>
                    {bookingService.formatBookingReference(booking.bookingReference)}
                  </span>
                </div>
                <div style={detailRowStyle}>
                  <span style={labelStyle}>Booking Date:</span>
                  <span style={valueStyle}>
                    {bookingService.formatBookingDate(booking.createdAt)}
                  </span>
                </div>
                <div style={detailRowStyle}>
                  <span style={labelStyle}>Total Amount:</span>
                  <span style={totalPriceStyle}>
                    {bookingService.formatPrice(getTotalPrice(booking))}
                  </span>
                </div>
              </div>

              {/* Movie Information */}
              <div style={movieSectionStyle}>
                <h3 style={subsectionTitleStyle}>Movie Information</h3>
                <div style={movieInfoStyle}>
                  <img
                    src={booking.showtime?.moviePosterUrl || (booking.showtime as any)?.movie?.posterUrl || `https://via.placeholder.com/100x150/141414/E50914?text=${encodeURIComponent(booking.showtime?.movieTitle || 'Movie')}`}
                    alt={booking.showtime?.movieTitle || 'Movie'}
                    style={moviePosterStyle}
                  />
                  <div style={movieDetailsStyle}>
                    <h4 style={movieTitleStyle}>{booking.showtime?.movieTitle || (booking.showtime as any)?.movie?.title || 'Unknown Movie'}</h4>
                    <div style={movieMetaStyle}>
                      <span style={genreStyle}>{(booking.showtime as any)?.movie?.genre || 'Genre'}</span>
                      <span style={durationStyle}>{(booking.showtime as any)?.movie?.formattedDuration || `${booking.showtime?.movieDurationMinutes || 0}min`}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Showtime Information */}
              <div style={showtimeSectionStyle}>
                <h3 style={subsectionTitleStyle}>Showtime Information</h3>
                <div style={showtimeInfoStyle}>
                  <div style={detailRowStyle}>
                    <span style={labelStyle}>Theater:</span>
                    <span style={valueStyle}>
                      {booking.showtime?.theaterName || (booking.showtime as any)?.theater?.name || 'Unknown Theater'}
                      ({booking.showtime?.theaterCapacity || 0} seats)
                    </span>
                  </div>
                  <div style={detailRowStyle}>
                    <span style={labelStyle}>Date & Time:</span>
                    <span style={valueStyle}>
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
                  <div style={detailRowStyle}>
                    <span style={labelStyle}>Seats:</span>
                    <span style={valueStyle}>
                      {bookingService.getSeatDisplayString(getSeatBookingsData(booking, seatBookings))}
                    </span>
                  </div>
                  <div style={detailRowStyle}>
                    <span style={labelStyle}>Number of Seats:</span>
                    <span style={valueStyle}>{booking.seatsBooked}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Actions and Instructions */}
            <div style={actionsSectionStyle}>
              <div style={actionsCardStyle}>
                <h3 style={actionsTitleStyle}>Quick Actions</h3>

                <div style={actionButtonsStyle}>
                  {booking.showtime?.id && (
                    <Link
                      to={`/movies/${getMovieId(booking) || booking.showtime.id}`}
                      style={actionButtonStyle}
                    >
                      View Movie Details
                    </Link>
                  )}

                  {isUpcoming && booking.showtime?.id && (
                    <Link
                      to={`/movies/${getMovieId(booking) || booking.showtime.id}/showtimes`}
                      style={actionButtonStyle}
                    >
                      View Other Showtimes
                    </Link>
                  )}

                  {canCancel && (
                    <button
                      onClick={() => handleCancelBooking()}
                      style={cancelButtonStyle}
                    >
                      Cancel Booking
                    </button>
                  )}
                </div>
              </div>

              {/* Important Information */}
              <div style={infoCardStyle}>
                <h3 style={infoTitleStyle}>Important Information</h3>
                <div style={infoListStyle}>
                  <div style={infoItemStyle}>
                    <strong>Arrival Time:</strong> Please arrive at least 15 minutes before showtime.
                  </div>
                  <div style={infoItemStyle}>
                    <strong>Ticket Collection:</strong> Show your booking reference at the theater or use our mobile app.
                  </div>
                  <div style={infoItemStyle}>
                    <strong>Cancellation:</strong> Bookings can be cancelled up to 2 hours before showtime.
                  </div>
                  <div style={infoItemStyle}>
                    <strong>Contact:</strong> For assistance, please contact our customer support.
                  </div>
                </div>
              </div>

              {/* QR Code Placeholder */}
              <div style={qrCodeSectionStyle}>
                <h3 style={qrCodeTitleStyle}>Digital Ticket</h3>
                <div style={qrCodePlaceholderStyle}>
                  <div style={qrCodeStyle}>QR</div>
                  <p style={qrCodeTextStyle}>
                    Show this reference at the theater:<br />
                    <strong>{bookingService.formatBookingReference(booking.bookingReference)}</strong>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Actions */}
          <div style={bottomActionsStyle}>
            <Link to="/bookings/my-bookings" style={secondaryButtonStyle}>
              View My Bookings
            </Link>
            <Link to="/movies" style={primaryButtonStyle}>
              Book More Movies
            </Link>
          </div>
        </div>
      </div>
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

// Styles
const containerStyle: React.CSSProperties = {
  minHeight: '100vh',
  backgroundColor: '#111',
  color: '#fff',
};

const loadingContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '60vh',
  gap: '1rem',
};

const spinnerStyle: React.CSSProperties = {
  border: '4px solid #333',
  borderTop: '4px solid #4caf50',
  borderRadius: '50%',
  width: '40px',
  height: '40px',
  animation: 'spin 1s linear infinite',
};

const errorContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '60vh',
  gap: '1rem',
  textAlign: 'center',
};

const successHeaderStyle: React.CSSProperties = {
  backgroundColor: '#1b5e20',
  padding: '3rem 0',
  textAlign: 'center',
};

const successIconStyle: React.CSSProperties = {
  fontSize: '4rem',
  color: '#4caf50',
  marginBottom: '1rem',
};

const successTitleStyle: React.CSSProperties = {
  fontSize: '2.5rem',
  fontWeight: 'bold',
  marginBottom: '1rem',
  color: '#fff',
};

const successSubtitleStyle: React.CSSProperties = {
  fontSize: '1.1rem',
  color: '#c8e6c9',
  maxWidth: '600px',
  margin: '0 auto',
};

const contentSectionStyle: React.CSSProperties = {
  padding: '3rem 0',
};

const contentContainerStyle: React.CSSProperties = {
  maxWidth: '1200px',
  margin: '0 auto',
  padding: '0 2rem',
};

const confirmationLayoutStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '2fr 1fr',
  gap: '3rem',
  marginBottom: '3rem',
};

const detailsSectionStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '2rem',
};

const sectionHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '1.8rem',
  fontWeight: 'bold',
  color: '#fff',
};

const bookingStatusStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
};

const statusBadgeStyle: React.CSSProperties = {
  padding: '0.5rem 1rem',
  borderRadius: '20px',
  color: '#fff',
  fontSize: '0.9rem',
  fontWeight: 'bold',
};

const detailsCardStyle: React.CSSProperties = {
  backgroundColor: '#222',
  borderRadius: '12px',
  padding: '2rem',
};

const detailRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '1rem',
  paddingBottom: '1rem',
  borderBottom: '1px solid #333',
};

const labelStyle: React.CSSProperties = {
  color: '#ccc',
  fontSize: '0.9rem',
};

const valueStyle: React.CSSProperties = {
  color: '#fff',
  fontSize: '1rem',
  fontWeight: '500',
};

const totalPriceStyle: React.CSSProperties = {
  color: '#4caf50',
  fontSize: '1.2rem',
  fontWeight: 'bold',
};

const movieSectionStyle: React.CSSProperties = {
  backgroundColor: '#222',
  borderRadius: '12px',
  padding: '2rem',
};

const subsectionTitleStyle: React.CSSProperties = {
  fontSize: '1.2rem',
  fontWeight: 'bold',
  marginBottom: '1rem',
  color: '#fff',
};

const movieInfoStyle: React.CSSProperties = {
  display: 'flex',
  gap: '1.5rem',
  alignItems: 'flex-start',
};

const moviePosterStyle: React.CSSProperties = {
  width: '80px',
  height: '120px',
  objectFit: 'cover',
  borderRadius: '8px',
};

const movieDetailsStyle: React.CSSProperties = {
  flex: 1,
};

const movieTitleStyle: React.CSSProperties = {
  fontSize: '1.3rem',
  fontWeight: 'bold',
  marginBottom: '0.5rem',
  color: '#fff',
};

const movieMetaStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.3rem',
};

const genreStyle: React.CSSProperties = {
  color: '#1976d2',
  fontSize: '0.9rem',
  fontWeight: 'bold',
};

const durationStyle: React.CSSProperties = {
  color: '#ccc',
  fontSize: '0.9rem',
};


const showtimeSectionStyle: React.CSSProperties = {
  backgroundColor: '#222',
  borderRadius: '12px',
  padding: '2rem',
};

const showtimeInfoStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
};

const actionsSectionStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '2rem',
};

const actionsCardStyle: React.CSSProperties = {
  backgroundColor: '#222',
  borderRadius: '12px',
  padding: '2rem',
};

const actionsTitleStyle: React.CSSProperties = {
  fontSize: '1.2rem',
  fontWeight: 'bold',
  marginBottom: '1.5rem',
  color: '#fff',
};

const actionButtonsStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
};

const actionButtonStyle: React.CSSProperties = {
  backgroundColor: '#333',
  color: '#fff',
  textDecoration: 'none',
  padding: '1rem',
  borderRadius: '8px',
  textAlign: 'center',
  fontWeight: '500',
  transition: 'background-color 0.2s',
  border: 'none',
  cursor: 'pointer',
  fontSize: '0.9rem',
};

const cancelButtonStyle: React.CSSProperties = {
  ...actionButtonStyle,
  backgroundColor: '#d32f2f',
};

const infoCardStyle: React.CSSProperties = {
  backgroundColor: '#1a237e',
  borderRadius: '12px',
  padding: '2rem',
};

const infoTitleStyle: React.CSSProperties = {
  fontSize: '1.1rem',
  fontWeight: 'bold',
  marginBottom: '1rem',
  color: '#fff',
};

const infoListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.8rem',
};

const infoItemStyle: React.CSSProperties = {
  fontSize: '0.85rem',
  lineHeight: '1.4',
  color: '#e3f2fd',
};

const qrCodeSectionStyle: React.CSSProperties = {
  backgroundColor: '#222',
  borderRadius: '12px',
  padding: '2rem',
  textAlign: 'center',
};

const qrCodeTitleStyle: React.CSSProperties = {
  fontSize: '1.1rem',
  fontWeight: 'bold',
  marginBottom: '1rem',
  color: '#fff',
};

const qrCodePlaceholderStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '1rem',
};

const qrCodeStyle: React.CSSProperties = {
  width: '80px',
  height: '80px',
  backgroundColor: '#fff',
  color: '#333',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '8px',
  fontSize: '1.5rem',
  fontWeight: 'bold',
};

const qrCodeTextStyle: React.CSSProperties = {
  fontSize: '0.8rem',
  color: '#ccc',
  lineHeight: '1.4',
};

const bottomActionsStyle: React.CSSProperties = {
  display: 'flex',
  gap: '1rem',
  justifyContent: 'center',
  paddingTop: '2rem',
  borderTop: '1px solid #333',
};

const secondaryButtonStyle: React.CSSProperties = {
  backgroundColor: '#333',
  color: '#fff',
  textDecoration: 'none',
  padding: '1rem 2rem',
  borderRadius: '8px',
  fontWeight: 'bold',
  textAlign: 'center',
  transition: 'background-color 0.2s',
};

const primaryButtonStyle: React.CSSProperties = {
  backgroundColor: '#e50914',
  color: '#fff',
  textDecoration: 'none',
  padding: '1rem 2rem',
  borderRadius: '8px',
  fontWeight: 'bold',
  textAlign: 'center',
  transition: 'background-color 0.2s',
};

const backButtonStyle: React.CSSProperties = {
  backgroundColor: '#e50914',
  color: '#fff',
  padding: '0.8rem 1.5rem',
  textDecoration: 'none',
  borderRadius: '8px',
  fontWeight: 'bold',
  display: 'inline-block',
};

export default BookingConfirmationPage;