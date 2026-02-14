import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { bookingService } from '../../services/bookingService';
import { Showtime } from '../../types';

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

  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate time remaining
  useEffect(() => {
    if (!state?.reservedUntil) {
      setError('No seat reservation found');
      return;
    }

    const updateTimer = () => {
      const remaining = Math.max(0, state.reservedUntil - Date.now());
      setTimeRemaining(remaining);

      // If time expired, release seats and redirect
      if (remaining <= 0) {
        handleTimeout();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [state?.reservedUntil]);

  // Handle timeout - release seats and redirect
  const handleTimeout = async () => {
    if (!showtimeId || !state?.selectedSeats) return;

    try {
      // Release reserved seats
      await bookingService.releaseSeatsReservation({
        showtimeId: parseInt(showtimeId, 10),
        seatIds: state.selectedSeats
      });
    } catch (err) {
      console.error('Error releasing seats on timeout:', err);
    }

    // Redirect back to booking page with timeout message
    navigate(`/booking/${showtimeId}`, {
      state: {
        message: 'Your seat reservation has expired. Please select your seats again.'
      }
    });
  };

  // Handle payment completion
  const handlePayment = async () => {
    if (!showtimeId || !state?.selectedSeats) return;

    setPaymentLoading(true);

    try {
      // Create the actual booking (seats are already reserved)
      const bookingResponse = await bookingService.createBookingWithSeats({
        showtimeId: parseInt(showtimeId, 10),
        seatIds: state.selectedSeats
      });

      // Navigate to confirmation page
      navigate(`/booking-confirmation/${bookingResponse.booking.id}`, {
        state: { bookingData: bookingResponse }
      });

    } catch (err: any) {
      console.error('Error creating booking:', err);

      if (err.response?.status === 409) {
        setError('Seats are no longer available. Redirecting to seat selection...');
        setTimeout(() => {
          navigate(`/booking/${showtimeId}`);
        }, 2000);
      } else {
        setError('Payment failed. Please try again.');
      }
    } finally {
      setPaymentLoading(false);
    }
  };

  // Handle cancel - release seats and go back
  const handleCancel = async () => {
    if (!showtimeId || !state?.selectedSeats) return;

    try {
      await bookingService.releaseSeatsReservation({
        showtimeId: parseInt(showtimeId, 10),
        seatIds: state.selectedSeats
      });
    } catch (err) {
      console.error('Error releasing seats on cancel:', err);
    }

    navigate(`/booking/${showtimeId}`);
  };

  // Format time remaining
  const formatTimeRemaining = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Check if we have valid state
  if (!state || !state.selectedSeats || !state.showtime) {
    return (
      <div style={containerStyle}>
        <div style={errorContainerStyle}>
          <h2>Payment Not Available</h2>
          <p>No valid seat reservation found.</p>
          <Link to="/movies" style={backButtonStyle}>
            Back to Movies
          </Link>
        </div>
      </div>
    );
  }

  const isExpiringSoon = timeRemaining < 60000; // Less than 1 minute

  return (
    <div style={containerStyle}>
      {/* Header with timer */}
      <div style={headerStyle}>
        <div style={timerContainerStyle}>
          <div style={{
            ...timerStyle,
            color: isExpiringSoon ? '#ff4444' : '#ffc107'
          }}>
            ⏰ Time remaining: {formatTimeRemaining(timeRemaining)}
          </div>
          {isExpiringSoon && (
            <div style={warningStyle}>
              ⚠️ Your reservation will expire soon!
            </div>
          )}
        </div>
      </div>

      {/* Payment content */}
      <div style={contentStyle}>
        <div style={paymentContainerStyle}>

          {/* Booking Summary */}
          <div style={summaryCardStyle}>
            <h2 style={titleStyle}>Complete Your Booking</h2>

            <div style={movieInfoStyle}>
              <img
                src={state.showtime.moviePosterUrl || `https://via.placeholder.com/80x120/141414/E50914?text=${encodeURIComponent(state.showtime.movieTitle)}`}
                alt={state.showtime.movieTitle}
                style={posterStyle}
              />
              <div>
                <h3>{state.showtime.movieTitle}</h3>
                <p>{state.showtime.theaterName}</p>
                <p>{new Date(state.showtime.showDatetime).toLocaleString()}</p>
              </div>
            </div>

            <div style={seatsInfoStyle}>
              <h4>Selected Seats ({state.selectedSeats.length})</h4>
              <div style={seatListStyle}>
                {state.selectedSeats.map(seatId => (
                  <span key={seatId} style={seatChipStyle}>
                    Seat {seatId}
                  </span>
                ))}
              </div>
            </div>

            <div style={priceInfoStyle}>
              <div style={priceLineStyle}>
                <span>Subtotal:</span>
                <span>{(state.totalPrice).toLocaleString('vi-VN')} VND</span>
              </div>
              <div style={priceLineStyle}>
                <span>Service Fee:</span>
                <span>10,000 VND</span>
              </div>
              <div style={totalLineStyle}>
                <span>Total:</span>
                <span>{(state.totalPrice + 10000).toLocaleString('vi-VN')} VND</span>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div style={paymentMethodsStyle}>
            <h3>Payment Method</h3>
            <div style={paymentOptionsStyle}>
              <label style={paymentOptionStyle}>
                <input type="radio" name="payment" defaultChecked />
                <span>💳 Credit/Debit Card</span>
              </label>
              <label style={paymentOptionStyle}>
                <input type="radio" name="payment" />
                <span>🏦 Bank Transfer</span>
              </label>
              <label style={paymentOptionStyle}>
                <input type="radio" name="payment" />
                <span>📱 VNPay</span>
              </label>
            </div>
          </div>

          {/* Payment Actions */}
          <div style={actionsStyle}>
            {error && (
              <div style={errorMessageStyle}>{error}</div>
            )}

            <div style={buttonContainerStyle}>
              <button
                onClick={handleCancel}
                style={cancelButtonStyle}
                disabled={paymentLoading}
              >
                Cancel
              </button>

              <button
                onClick={handlePayment}
                style={payButtonStyle}
                disabled={paymentLoading || timeRemaining <= 0}
              >
                {paymentLoading ? 'Processing...' : `Pay ${(state.totalPrice + 10000).toLocaleString('vi-VN')} VND`}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

// Styles
const containerStyle: React.CSSProperties = {
  minHeight: '100vh',
  backgroundColor: '#111',
  color: '#fff',
};

const headerStyle: React.CSSProperties = {
  backgroundColor: '#222',
  padding: '1rem',
  borderBottom: '3px solid #ffc107',
};

const timerContainerStyle: React.CSSProperties = {
  textAlign: 'center',
};

const timerStyle: React.CSSProperties = {
  fontSize: '1.2rem',
  fontWeight: 'bold',
  marginBottom: '0.5rem',
};

const warningStyle: React.CSSProperties = {
  color: '#ff4444',
  fontSize: '0.9rem',
  animation: 'blink 1s infinite',
};

const contentStyle: React.CSSProperties = {
  padding: '2rem',
  maxWidth: '800px',
  margin: '0 auto',
};

const paymentContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '2rem',
};

const summaryCardStyle: React.CSSProperties = {
  backgroundColor: '#222',
  borderRadius: '12px',
  padding: '2rem',
};

const titleStyle: React.CSSProperties = {
  marginBottom: '1.5rem',
  color: '#ffc107',
};

const movieInfoStyle: React.CSSProperties = {
  display: 'flex',
  gap: '1rem',
  alignItems: 'center',
  marginBottom: '1.5rem',
  padding: '1rem',
  backgroundColor: '#333',
  borderRadius: '8px',
};

const posterStyle: React.CSSProperties = {
  width: '60px',
  height: '90px',
  objectFit: 'cover',
  borderRadius: '4px',
};

const seatsInfoStyle: React.CSSProperties = {
  marginBottom: '1.5rem',
};

const seatListStyle: React.CSSProperties = {
  display: 'flex',
  gap: '0.5rem',
  flexWrap: 'wrap',
  marginTop: '0.5rem',
};

const seatChipStyle: React.CSSProperties = {
  backgroundColor: '#e50914',
  color: '#fff',
  padding: '0.3rem 0.8rem',
  borderRadius: '20px',
  fontSize: '0.8rem',
};

const priceInfoStyle: React.CSSProperties = {
  backgroundColor: '#333',
  padding: '1rem',
  borderRadius: '8px',
};

const priceLineStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: '0.5rem',
};

const totalLineStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: '1.2rem',
  fontWeight: 'bold',
  paddingTop: '0.5rem',
  borderTop: '1px solid #555',
  color: '#ffc107',
};

const paymentMethodsStyle: React.CSSProperties = {
  backgroundColor: '#222',
  borderRadius: '12px',
  padding: '2rem',
};

const paymentOptionsStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
  marginTop: '1rem',
};

const paymentOptionStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
  padding: '1rem',
  backgroundColor: '#333',
  borderRadius: '8px',
  cursor: 'pointer',
};

const actionsStyle: React.CSSProperties = {
  backgroundColor: '#222',
  borderRadius: '12px',
  padding: '2rem',
};

const errorMessageStyle: React.CSSProperties = {
  color: '#ff4444',
  backgroundColor: '#331111',
  padding: '1rem',
  borderRadius: '8px',
  marginBottom: '1rem',
  textAlign: 'center',
};

const buttonContainerStyle: React.CSSProperties = {
  display: 'flex',
  gap: '1rem',
  justifyContent: 'center',
};

const cancelButtonStyle: React.CSSProperties = {
  backgroundColor: '#666',
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  padding: '1rem 2rem',
  fontSize: '1rem',
  cursor: 'pointer',
  transition: 'background-color 0.2s',
};

const payButtonStyle: React.CSSProperties = {
  backgroundColor: '#e50914',
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  padding: '1rem 2rem',
  fontSize: '1rem',
  fontWeight: 'bold',
  cursor: 'pointer',
  transition: 'background-color 0.2s',
  minWidth: '200px',
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

const backButtonStyle: React.CSSProperties = {
  backgroundColor: '#e50914',
  color: '#fff',
  padding: '0.8rem 1.5rem',
  textDecoration: 'none',
  borderRadius: '8px',
  fontWeight: 'bold',
  display: 'inline-block',
};

export default PaymentPage;