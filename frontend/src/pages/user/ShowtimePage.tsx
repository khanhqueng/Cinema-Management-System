import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { movieService } from '../../services/movieService';
import { showtimeService } from '../../services/showtimeService';
import { theaterService } from '../../services/theaterService';
import { Movie, Showtime, Theater } from '../../types';

const ShowtimePage: React.FC = () => {
  const { id, theaterId } = useParams<{ id?: string; theaterId?: string }>();
  const location = useLocation();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [theater, setTheater] = useState<Theater | null>(null);
  const [, setShowtimes] = useState<Showtime[]>([]);
  const [groupedShowtimes, setGroupedShowtimes] = useState<{ [date: string]: Showtime[] }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');

  // Determine if we're on theater route or movie route
  const isTheaterRoute = location.pathname.includes('/theaters/');
  const currentId = isTheaterRoute ? theaterId : id;

  useEffect(() => {
    const fetchData = async () => {
      if (!currentId) {
        setError(isTheaterRoute ? 'Theater ID not provided' : 'Movie ID not provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        let showtimesData;
        if (isTheaterRoute) {
          // Fetch theater details and showtimes for theater
          const [theaterData, showtimesResponse] = await Promise.all([
            theaterService.getTheaterById(parseInt(currentId, 10)),
            showtimeService.getShowtimesByTheater(parseInt(currentId, 10), { size: 100 })
          ]);

          setTheater(theaterData);
          showtimesData = showtimesResponse;
        } else {
          // Fetch movie details and showtimes for movie
          const [movieData, showtimesResponse] = await Promise.all([
            movieService.getMovieByIdEnhanced(parseInt(currentId, 10)),
            showtimeService.getShowtimesByMovie(parseInt(currentId, 10), { size: 100 })
          ]);

          setMovie(movieData);
          showtimesData = showtimesResponse;
        }

        setShowtimes(showtimesData.content);

        // Group showtimes by date
        const grouped = showtimeService.getShowtimesByDay(showtimesData.content);
        setGroupedShowtimes(grouped);

        // Set the first available date as default
        const dates = Object.keys(grouped).sort();
        if (dates.length > 0) {
          setSelectedDate(dates[0]);
        }
      } catch (err) {
        setError(isTheaterRoute ? 'Failed to load theater showtimes' : 'Failed to load movie showtimes');
        console.error('Error fetching showtimes:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentId, isTheaterRoute]);

  if (loading) {
    return (
      <div style={loadingContainerStyle}>
        <div style={spinnerStyle}></div>
        <p>Loading showtimes...</p>
      </div>
    );
  }

  if (error || (!movie && !theater)) {
    return (
      <div style={errorContainerStyle}>
        <h2>Showtimes Not Available</h2>
        <p>{error || `Unable to load showtimes for this ${isTheaterRoute ? 'theater' : 'movie'}.`}</p>
        <Link to={isTheaterRoute ? "/theaters" : "/movies"} style={backButtonStyle}>
          Back to {isTheaterRoute ? "Theaters" : "Movies"}
        </Link>
      </div>
    );
  }

  const availableDates = Object.keys(groupedShowtimes).sort();
  const selectedShowtimes = selectedDate ? groupedShowtimes[selectedDate] || [] : [];

  return (
    <div style={containerStyle}>
      {/* Header Section */}
      <div style={headerSectionStyle}>
        <div style={breadcrumbStyle}>
          {isTheaterRoute ? (
            <>
              <Link to="/theaters" style={breadcrumbLinkStyle}>Theaters</Link>
              <span style={breadcrumbSeparatorStyle}>/</span>
              <span style={currentPageStyle}>Showtimes</span>
            </>
          ) : (
            <>
              <Link to="/movies" style={breadcrumbLinkStyle}>Movies</Link>
              <span style={breadcrumbSeparatorStyle}>/</span>
              <Link to={`/movies/${movie?.id}`} style={breadcrumbLinkStyle}>{movie?.title}</Link>
              <span style={breadcrumbSeparatorStyle}>/</span>
              <span style={currentPageStyle}>Showtimes</span>
            </>
          )}
        </div>

        {isTheaterRoute && theater ? (
          <div style={movieInfoStyle}>
            <div style={theaterIconContainerStyle}>
              <span style={theaterIconStyle}>🎬</span>
            </div>
            <div style={movieDetailsStyle}>
              <h1 style={titleStyle}>{theater.name}</h1>
              <div style={movieMetaStyle}>
                <span style={genreStyle}>{theater.theaterType}</span>
                <span style={durationStyle}>{theater.capacity} seats</span>
              </div>
            </div>
          </div>
        ) : movie && (
          <div style={movieInfoStyle}>
            <img
              src={movie.posterUrl || `https://via.placeholder.com/150x225/141414/E50914?text=${encodeURIComponent(movie.title)}`}
              alt={movie.title}
              style={posterStyle}
            />
            <div style={movieDetailsStyle}>
              <h1 style={titleStyle}>{movie.title}</h1>
              <div style={movieMetaStyle}>
                <span style={genreStyle}>{movie.genre}</span>
                <span style={durationStyle}>{movie.formattedDuration}</span>
                <span style={directorStyle}>Directed by {movie.director}</span>
                {movie.averageRating > 0 && (
                  <span style={ratingStyle}>
                    ★ {movieService.formatRating(movie.averageRating)} ({movie.reviewCount} reviews)
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div style={contentSectionStyle}>
        <div style={contentContainerStyle}>
          <h2 style={sectionTitleStyle}>Select Showtime</h2>

          {availableDates.length === 0 ? (
            <div style={noShowtimesStyle}>
              <h3>No Showtimes Available</h3>
              <p>
                There are currently no showtimes scheduled for this {isTheaterRoute ? 'theater' : 'movie'}.
              </p>
              {isTheaterRoute ? (
                <Link to="/theaters" style={backButtonStyle}>
                  Back to Theaters
                </Link>
              ) : (
                <Link to={`/movies/${movie?.id}`} style={backButtonStyle}>
                  Back to Movie Details
                </Link>
              )}
            </div>
          ) : (
            <>
              {/* Date Selector */}
              <div style={dateSelectorStyle}>
                <h3 style={dateHeaderStyle}>Select Date:</h3>
                <div style={dateListStyle}>
                  {availableDates.map(date => (
                    <button
                      key={date}
                      onClick={() => setSelectedDate(date)}
                      style={selectedDate === date ? selectedDateButtonStyle : dateButtonStyle}
                    >
                      <div style={dateDisplayStyle}>
                        <div style={dayNameStyle}>
                          {new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}
                        </div>
                        <div style={dayNumberStyle}>
                          {new Date(date).getDate()}
                        </div>
                        <div style={monthStyle}>
                          {new Date(date).toLocaleDateString('en-US', { month: 'short' })}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Showtimes for Selected Date */}
              <div style={showtimesContainerStyle}>
                <h3 style={showtimesHeaderStyle}>
                  Showtimes for {new Date(selectedDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </h3>

                <div style={showtimesGridStyle}>
                  {selectedShowtimes.map(showtime => {
                    const availabilityInfo = showtimeService.getAvailabilityStatus(showtime);
                    const isUpcoming = showtimeService.isShowtimeUpcoming(showtime);

                    return (
                      <div key={showtime.id} style={showtimeCardStyle}>
                        <div style={showtimeHeaderStyle}>
                          <div style={timeStyle}>
                            {showtimeService.formatShowTime(showtime)}
                          </div>
                          <div style={theaterNameStyle}>
                            {isTheaterRoute ? showtime.movieTitle : showtime.theaterName}
                          </div>
                        </div>

                        <div style={showtimeInfoStyle}>
                          <div style={theaterTypeStyle}>
                            Theater ({showtime.theaterCapacity} seats)
                          </div>
                          <div style={priceStyle}>
                            {showtimeService.formatPrice(showtime.price)}
                          </div>
                        </div>

                        <div style={availabilityInfoStyle}>
                          <span
                            style={{
                              ...availabilityStyle,
                              backgroundColor: availabilityInfo.color
                            }}
                          >
                            {availabilityInfo.label}
                          </span>
                          <span style={seatsInfoStyle}>
                            {showtime.availableSeats}/{showtime.theaterCapacity} seats
                          </span>
                        </div>

                        <div style={showtimeActionsStyle}>
                          {isUpcoming && (showtime.bookable ?? true) && showtime.availableSeats > 0 ? (
                            <Link
                              to={`/booking/${showtime.id}`}
                              style={bookButtonStyle}
                            >
                              Book Tickets
                            </Link>
                          ) : (
                            <button style={disabledButtonStyle} disabled>
                              {!isUpcoming ? 'Past Showtime' : 'Not Available'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
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
  padding: '2rem 0',
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
  gap: '2rem',
  padding: '0 2rem',
  alignItems: 'flex-start',
};

const posterStyle: React.CSSProperties = {
  width: '120px',
  height: '180px',
  objectFit: 'cover',
  borderRadius: '8px',
};

const movieDetailsStyle: React.CSSProperties = {
  flex: 1,
};

const titleStyle: React.CSSProperties = {
  fontSize: '2rem',
  fontWeight: 'bold',
  margin: '0 0 1rem 0',
};

const movieMetaStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '1rem',
  alignItems: 'center',
};

const genreStyle: React.CSSProperties = {
  backgroundColor: '#1976d2',
  color: '#fff',
  padding: '0.3rem 0.8rem',
  borderRadius: '12px',
  fontSize: '0.8rem',
};

const durationStyle: React.CSSProperties = {
  color: '#ccc',
  fontSize: '0.9rem',
};

const directorStyle: React.CSSProperties = {
  color: '#ccc',
  fontSize: '0.9rem',
  fontStyle: 'italic',
};

const ratingStyle: React.CSSProperties = {
  color: '#ffc107',
  fontSize: '0.9rem',
  fontWeight: 'bold',
};

const contentSectionStyle: React.CSSProperties = {
  padding: '2rem 0',
};

const contentContainerStyle: React.CSSProperties = {
  maxWidth: '1200px',
  margin: '0 auto',
  padding: '0 2rem',
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '1.8rem',
  fontWeight: 'bold',
  marginBottom: '2rem',
  color: '#fff',
};

const noShowtimesStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '3rem 0',
};

const dateSelectorStyle: React.CSSProperties = {
  marginBottom: '3rem',
};

const dateHeaderStyle: React.CSSProperties = {
  fontSize: '1.2rem',
  marginBottom: '1rem',
  color: '#fff',
};

const dateListStyle: React.CSSProperties = {
  display: 'flex',
  gap: '1rem',
  overflowX: 'auto',
  padding: '0.5rem 0',
};

const dateButtonStyle: React.CSSProperties = {
  background: 'transparent',
  border: '2px solid #666',
  borderRadius: '12px',
  padding: '1rem',
  color: '#ccc',
  cursor: 'pointer',
  minWidth: '80px',
  transition: 'all 0.3s',
};

const selectedDateButtonStyle: React.CSSProperties = {
  ...dateButtonStyle,
  borderColor: '#e50914',
  backgroundColor: '#e50914',
  color: '#fff',
};

const dateDisplayStyle: React.CSSProperties = {
  textAlign: 'center',
};

const dayNameStyle: React.CSSProperties = {
  fontSize: '0.8rem',
  fontWeight: 'bold',
};

const dayNumberStyle: React.CSSProperties = {
  fontSize: '1.5rem',
  fontWeight: 'bold',
  margin: '0.2rem 0',
};

const monthStyle: React.CSSProperties = {
  fontSize: '0.8rem',
};

const showtimesContainerStyle: React.CSSProperties = {
  marginBottom: '2rem',
};

const showtimesHeaderStyle: React.CSSProperties = {
  fontSize: '1.3rem',
  marginBottom: '1.5rem',
  color: '#fff',
};

const showtimesGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
  gap: '1.5rem',
};

const showtimeCardStyle: React.CSSProperties = {
  backgroundColor: '#333',
  borderRadius: '12px',
  padding: '1.5rem',
  border: '1px solid #555',
  transition: 'transform 0.2s, box-shadow 0.2s',
};

const showtimeHeaderStyle: React.CSSProperties = {
  marginBottom: '1rem',
};

const timeStyle: React.CSSProperties = {
  fontSize: '1.5rem',
  fontWeight: 'bold',
  color: '#fff',
  marginBottom: '0.5rem',
};

const theaterNameStyle: React.CSSProperties = {
  fontSize: '1rem',
  color: '#ccc',
  fontWeight: '500',
};

const showtimeInfoStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: '1rem',
};

const theaterTypeStyle: React.CSSProperties = {
  color: '#ffc107',
  fontSize: '0.9rem',
  fontWeight: 'bold',
};

const priceStyle: React.CSSProperties = {
  color: '#4caf50',
  fontSize: '1rem',
  fontWeight: 'bold',
};

const availabilityInfoStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '1rem',
};

const availabilityStyle: React.CSSProperties = {
  padding: '0.3rem 0.8rem',
  borderRadius: '12px',
  color: '#fff',
  fontSize: '0.8rem',
  fontWeight: 'bold',
};

const seatsInfoStyle: React.CSSProperties = {
  color: '#ccc',
  fontSize: '0.9rem',
};

const showtimeActionsStyle: React.CSSProperties = {
  marginTop: '1rem',
};

const bookButtonStyle: React.CSSProperties = {
  backgroundColor: '#e50914',
  color: '#fff',
  padding: '0.8rem 1.5rem',
  textDecoration: 'none',
  borderRadius: '8px',
  fontWeight: 'bold',
  display: 'inline-block',
  textAlign: 'center',
  width: '100%',
  transition: 'background-color 0.2s',
};

const disabledButtonStyle: React.CSSProperties = {
  backgroundColor: '#666',
  color: '#999',
  padding: '0.8rem 1.5rem',
  border: 'none',
  borderRadius: '8px',
  fontWeight: 'bold',
  width: '100%',
  cursor: 'not-allowed',
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

const theaterIconContainerStyle: React.CSSProperties = {
  width: '120px',
  height: '180px',
  backgroundColor: '#333',
  borderRadius: '8px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const theaterIconStyle: React.CSSProperties = {
  fontSize: '3rem',
};

export default ShowtimePage;