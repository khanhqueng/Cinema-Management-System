import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { showtimeService } from '../services/showtimeService';
import { bookingService } from '../services/bookingService';
import {
  Showtime,
  SeatMapResponse,
  SeatInfo,
  SeatAvailabilityResponse,
  BookingWithSeatsResponse
} from '../types';

const BookingPage: React.FC = () => {
  const { showtimeId } = useParams<{ showtimeId: string }>();
  const navigate = useNavigate();

  const [showtime, setShowtime] = useState<Showtime | null>(null);
  const [seatMap, setSeatMap] = useState<SeatMapResponse | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [priceCheck, setPriceCheck] = useState<SeatAvailabilityResponse | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!showtimeId) {
        setError('Showtime ID not provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Fetch showtime and seat map in parallel
        const [showtimeData, seatMapData] = await Promise.all([
          showtimeService.getShowtimeById(parseInt(showtimeId, 10)),
          bookingService.getSeatMapForShowtime(parseInt(showtimeId, 10))
        ]);

        setShowtime(showtimeData);
        setSeatMap(seatMapData);
      } catch (err) {
        setError('Failed to load showtime or seat information');
        console.error('Error fetching booking data:', err);
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
            selectedSeats
          );
          setPriceCheck(priceData);
          setTotalPrice(priceData.totalPrice);
        } catch (err) {
          console.error('Error calculating price:', err);
        }
      } else {
        setPriceCheck(null);
        setTotalPrice(0);
      }
    };

    updatePrice();
  }, [selectedSeats, showtimeId]);

  const handleSeatToggle = (seatId: number) => {
    setSelectedSeats(prev => {
      if (prev.includes(seatId)) {
        return prev.filter(id => id !== seatId);
      } else {
        if (prev.length >= 8) { // Maximum 8 seats per booking
          alert('You can select maximum 8 seats per booking');
          return prev;
        }
        return [...prev, seatId];
      }
    });
  };

  const handleBooking = async () => {
    if (!showtimeId || selectedSeats.length === 0) {
      alert('Please select at least one seat');
      return;
    }

    try {
      setBookingLoading(true);

      // Check availability one more time before booking
      const availabilityCheck = await bookingService.checkSeatAvailability(
        parseInt(showtimeId, 10),
        { seatIds: selectedSeats }
      );

      if (!availabilityCheck.available) {
        alert('Some selected seats are no longer available. Please select different seats.');
        // Refresh seat map
        const updatedSeatMap = await bookingService.getSeatMapForShowtime(parseInt(showtimeId, 10));
        setSeatMap(updatedSeatMap);
        setSelectedSeats([]);
        return;
      }

      // Create booking
      const bookingResponse = await bookingService.createBookingWithSeats({
        showtimeId: parseInt(showtimeId, 10),
        seatIds: selectedSeats
      });

      // Navigate to confirmation page
      navigate(`/booking-confirmation/${bookingResponse.booking.id}`, {
        state: { bookingData: bookingResponse }
      });
    } catch (err) {
      console.error('Error creating booking:', err);
      alert('Failed to create booking. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={loadingContainerStyle}>
        <div style={spinnerStyle}></div>
        <p>Loading seat map...</p>
      </div>
    );
  }

  if (error || !showtime || !seatMap) {
    return (
      <div style={errorContainerStyle}>
        <h2>Booking Not Available</h2>
        <p>{error || 'Unable to load booking information.'}</p>
        <Link to="/movies" style={backButtonStyle}>
          Back to Movies
        </Link>
      </div>
    );
  }

  const seatMapByRow = bookingService.generateSeatMap(seatMap.seats);
  const rows = Object.keys(seatMapByRow).sort();

  return (
    <div style={containerStyle}>
      {/* Header Section */}
      <div style={headerSectionStyle}>
        <div style={breadcrumbStyle}>
          <Link to="/movies" style={breadcrumbLinkStyle}>Movies</Link>
          <span style={breadcrumbSeparatorStyle}>/</span>
          <Link to={`/movies/${showtime.movieId}`} style={breadcrumbLinkStyle}>
            {showtime.movieTitle}
          </Link>
          <span style={breadcrumbSeparatorStyle}>/</span>
          <Link to={`/movies/${showtime.movieId}/showtimes`} style={breadcrumbLinkStyle}>
            Showtimes
          </Link>
          <span style={breadcrumbSeparatorStyle}>/</span>
          <span style={currentPageStyle}>Book Tickets</span>
        </div>

        <div style={movieInfoStyle}>
          <img
            src={showtime.moviePosterUrl || `https://via.placeholder.com/100x150/141414/E50914?text=${encodeURIComponent(showtime.movieTitle)}`}
            alt={showtime.movieTitle}
            style={posterStyle}
          />
          <div style={movieDetailsStyle}>
            <h1 style={titleStyle}>{showtime.movieTitle}</h1>
            <div style={showtimeInfoStyle}>
              <div style={theaterInfoStyle}>
                <span style={theaterNameStyle}>{showtime.theaterName}</span>
                <span style={theaterTypeStyle}>Capacity: {showtime.theaterCapacity} seats</span>
              </div>
              <div style={timeInfoStyle}>
                <span style={dateTimeStyle}>
                  {showtimeService.formatShowtime(showtime)}
                </span>
                <span style={priceStyle}>
                  {showtimeService.formatPrice(showtime.price)} per seat
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div style={contentSectionStyle}>
        <div style={contentContainerStyle}>
          <div style={bookingLayoutStyle}>
            {/* Seat Map Section */}
            <div style={seatMapSectionStyle}>
              <h2 style={sectionTitleStyle}>Select Your Seats</h2>

              {/* Screen Indicator */}
              <div style={screenContainerStyle}>
                <div style={screenStyle}>SCREEN</div>
              </div>

              {/* Legend */}
              <div style={legendStyle}>
                <div style={legendItemStyle}>
                  <div style={{...seatButtonStyle, backgroundColor: '#4caf50'}}></div>
                  <span>Thường (1.0x)</span>
                </div>
                <div style={legendItemStyle}>
                  <div style={{...seatButtonStyle, backgroundColor: '#e50914'}}></div>
                  <span>Đã chọn</span>
                </div>
                <div style={legendItemStyle}>
                  <div style={{...seatButtonStyle, backgroundColor: '#666'}}></div>
                  <span>Đã đặt</span>
                </div>
                <div style={legendItemStyle}>
                  <div style={{...seatButtonStyle, backgroundColor: '#ffc107'}}></div>
                  <span>VIP (1.5x)</span>
                </div>
                <div style={legendItemStyle}>
                  <div style={{...seatButtonStyle, backgroundColor: '#e91e63', width: '45px'}}></div>
                  <span>Đôi (1.3x)</span>
                </div>
                <div style={legendItemStyle}>
                  <div style={{...seatButtonStyle, backgroundColor: '#2196f3'}}></div>
                  <span>Người khuyết tật (1.0x)</span>
                </div>
              </div>

              {/* Seat Map */}
              <div style={seatMapContainerStyle}>
                {rows.map(row => (
                  <div key={row} style={seatRowStyle}>
                    <div style={rowLabelStyle}>{row}</div>
                    <div style={seatsInRowStyle}>
                      {seatMapByRow[row].map((seat, index) => {
                        // Add aisle spacing - typical CGV layout has aisles every 4-6 seats
                        const shouldAddAisle = index > 0 && (index + 1) % 4 === 0 && index < seatMapByRow[row].length - 1;
                        const isSelected = selectedSeats.includes(seat.id);
                        const isBooked = !seat.isAvailable;
                        const isVIP = seat.seatType === 'VIP';
                        const isCouple = seat.seatType === 'COUPLE';
                        const isWheelchair = seat.seatType === 'WHEELCHAIR';

                        let seatStyleColor = '#4caf50'; // Available
                        let seatSize = { width: '35px', height: '35px' };

                        if (isBooked) {
                          seatStyleColor = '#666'; // Occupied
                        } else if (isSelected) {
                          seatStyleColor = '#e50914'; // Selected
                        } else if (isVIP) {
                          seatStyleColor = '#ffc107'; // VIP
                        } else if (isCouple) {
                          seatStyleColor = '#e91e63'; // Couple (Pink)
                          seatSize = { width: '45px', height: '35px' }; // Wider for couple seats
                        } else if (isWheelchair) {
                          seatStyleColor = '#2196f3'; // Wheelchair (Blue)
                        }

                        return (
                          <React.Fragment key={seat.id}>
                            <button
                              onClick={() => seat.isAvailable && handleSeatToggle(seat.id)}
                              disabled={!seat.isAvailable}
                              style={{
                                ...seatButtonStyle,
                                backgroundColor: seatStyleColor,
                                cursor: !seat.isAvailable ? 'not-allowed' : 'pointer',
                                ...seatSize
                              }}
                              title={`${row}${seat.seatNumber} - ${bookingService.getSeatTypeDisplay(seat.seatType)} (${seat.priceMultiplier}x)`}
                            >
                              {seat.seatNumber}
                            </button>
                            {shouldAddAisle && <div style={aisleSpacingStyle}></div>}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Booking Summary Section */}
            <div style={summarySectionStyle}>
              <div style={summaryCardStyle}>
                <h3 style={summaryTitleStyle}>Booking Summary</h3>

                <div style={selectedSeatsInfoStyle}>
                  <h4>Selected Seats ({selectedSeats.length})</h4>
                  {selectedSeats.length > 0 ? (
                    <div style={selectedSeatsListStyle}>
                      {selectedSeats.map(seatId => {
                        const seat = seatMap.seats.find(s => s.id === seatId);
                        return seat ? (
                          <div key={seatId} style={selectedSeatItemStyle}>
                            <span>{seat.rowLetter}{seat.seatNumber}</span>
                            <span style={seatTypeStyle}>
                              {bookingService.getSeatTypeDisplay(seat.seatType)}
                            </span>
                          </div>
                        ) : null;
                      })}
                    </div>
                  ) : (
                    <p style={noSeatsSelectedStyle}>No seats selected</p>
                  )}
                </div>

                {priceCheck && (
                  <div style={priceBreakdownStyle}>
                    <div style={priceLineStyle}>
                      <span>Seats ({priceCheck.seatCount})</span>
                      <span>{bookingService.formatPrice(priceCheck.totalPrice)}</span>
                    </div>
                    <div style={totalLineStyle}>
                      <span>Total</span>
                      <span>{bookingService.formatPrice(priceCheck.totalPrice)}</span>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleBooking}
                  disabled={selectedSeats.length === 0 || bookingLoading}
                  style={selectedSeats.length > 0 && !bookingLoading ? bookButtonStyle : disabledBookButtonStyle}
                >
                  {bookingLoading ? 'Processing...' : 'Book Now'}
                </button>

                <div style={bookingNotesStyle}>
                  <h4>Important Notes:</h4>
                  <ul>
                    <li>Maximum 8 seats per booking</li>
                    <li>Bookings can be cancelled up to 2 hours before showtime</li>
                    <li>Please arrive at least 15 minutes before showtime</li>
                    <li>VIP seats include premium amenities</li>
                  </ul>
                </div>
              </div>
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
  borderTop: '4px solid #e50914',
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

const headerSectionStyle: React.CSSProperties = {
  backgroundColor: '#222',
  padding: '1rem 0',
};

const breadcrumbStyle: React.CSSProperties = {
  padding: '0 2rem',
  marginBottom: '1rem',
  fontSize: '0.9rem',
};

const breadcrumbLinkStyle: React.CSSProperties = {
  color: '#ccc',
  textDecoration: 'none',
};

const breadcrumbSeparatorStyle: React.CSSProperties = {
  margin: '0 0.5rem',
  color: '#666',
};

const currentPageStyle: React.CSSProperties = {
  color: '#fff',
};

const movieInfoStyle: React.CSSProperties = {
  display: 'flex',
  gap: '1.5rem',
  padding: '0 2rem',
  alignItems: 'flex-start',
};

const posterStyle: React.CSSProperties = {
  width: '80px',
  height: '120px',
  objectFit: 'cover',
  borderRadius: '8px',
};

const movieDetailsStyle: React.CSSProperties = {
  flex: 1,
};

const titleStyle: React.CSSProperties = {
  fontSize: '1.5rem',
  fontWeight: 'bold',
  margin: '0 0 0.5rem 0',
};

const showtimeInfoStyle: React.CSSProperties = {
  display: 'flex',
  gap: '2rem',
  flexWrap: 'wrap',
};

const theaterInfoStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.3rem',
};

const theaterNameStyle: React.CSSProperties = {
  fontSize: '1rem',
  fontWeight: '500',
};

const theaterTypeStyle: React.CSSProperties = {
  color: '#ffc107',
  fontSize: '0.9rem',
  fontWeight: 'bold',
};

const timeInfoStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.3rem',
};

const dateTimeStyle: React.CSSProperties = {
  fontSize: '0.9rem',
  color: '#ccc',
};

const priceStyle: React.CSSProperties = {
  color: '#4caf50',
  fontSize: '0.9rem',
  fontWeight: 'bold',
};

const contentSectionStyle: React.CSSProperties = {
  padding: '2rem 0',
};

const contentContainerStyle: React.CSSProperties = {
  maxWidth: '1400px',
  margin: '0 auto',
  padding: '0 2rem',
};

const bookingLayoutStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 350px',
  gap: '3rem',
  alignItems: 'start',
};

const seatMapSectionStyle: React.CSSProperties = {
  backgroundColor: '#222',
  borderRadius: '12px',
  padding: '2rem',
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '1.5rem',
  fontWeight: 'bold',
  marginBottom: '1.5rem',
};

const screenContainerStyle: React.CSSProperties = {
  textAlign: 'center',
  marginBottom: '2rem',
};

const screenStyle: React.CSSProperties = {
  backgroundColor: '#333',
  color: '#ccc',
  padding: '0.5rem 2rem',
  borderRadius: '20px',
  fontSize: '0.8rem',
  fontWeight: 'bold',
  letterSpacing: '2px',
  display: 'inline-block',
};

const legendStyle: React.CSSProperties = {
  display: 'flex',
  gap: '1.5rem',
  justifyContent: 'center',
  marginBottom: '2rem',
  flexWrap: 'wrap',
};

const legendItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  fontSize: '0.9rem',
};

const seatMapContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.8rem',
  alignItems: 'center',
};

const seatRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
};

const rowLabelStyle: React.CSSProperties = {
  width: '30px',
  textAlign: 'center',
  fontWeight: 'bold',
  color: '#ccc',
};

const seatsInRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: '0.5rem',
};

const seatButtonStyle: React.CSSProperties = {
  width: '35px',
  height: '35px',
  border: 'none',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '0.8rem',
  fontWeight: 'bold',
  transition: 'all 0.2s',
};

const summarySectionStyle: React.CSSProperties = {
  position: 'sticky',
  top: '2rem',
};

const summaryCardStyle: React.CSSProperties = {
  backgroundColor: '#222',
  borderRadius: '12px',
  padding: '2rem',
};

const summaryTitleStyle: React.CSSProperties = {
  fontSize: '1.3rem',
  fontWeight: 'bold',
  marginBottom: '1.5rem',
};

const selectedSeatsInfoStyle: React.CSSProperties = {
  marginBottom: '1.5rem',
};

const selectedSeatsListStyle: React.CSSProperties = {
  marginTop: '0.5rem',
};

const selectedSeatItemStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  padding: '0.5rem 0',
  borderBottom: '1px solid #333',
};

const seatTypeStyle: React.CSSProperties = {
  color: '#ffc107',
  fontSize: '0.8rem',
};

const noSeatsSelectedStyle: React.CSSProperties = {
  color: '#666',
  fontStyle: 'italic',
};

const priceBreakdownStyle: React.CSSProperties = {
  backgroundColor: '#333',
  borderRadius: '8px',
  padding: '1rem',
  marginBottom: '1.5rem',
};

const priceLineStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: '0.5rem',
  fontSize: '0.9rem',
};

const totalLineStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: '1.1rem',
  fontWeight: 'bold',
  paddingTop: '0.5rem',
  borderTop: '1px solid #555',
};

const bookButtonStyle: React.CSSProperties = {
  backgroundColor: '#e50914',
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  padding: '1rem',
  width: '100%',
  fontSize: '1rem',
  fontWeight: 'bold',
  cursor: 'pointer',
  marginBottom: '1.5rem',
  transition: 'background-color 0.2s',
};

const disabledBookButtonStyle: React.CSSProperties = {
  ...bookButtonStyle,
  backgroundColor: '#666',
  cursor: 'not-allowed',
};

const bookingNotesStyle: React.CSSProperties = {
  fontSize: '0.8rem',
  color: '#ccc',
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

// CGV-style aisle spacing
const aisleSpacingStyle: React.CSSProperties = {
  width: '20px',
  minWidth: '20px',
  borderLeft: '2px solid #444',
  marginLeft: '10px',
  marginRight: '10px',
  height: '35px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#666',
  fontSize: '0.7rem',
  fontWeight: 'bold',
};

export default BookingPage;