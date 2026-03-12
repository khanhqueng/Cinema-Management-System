import React, { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { motion } from "motion/react";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Star,
  ArrowLeft,
  Loader2,
  Film,
  Ticket,
} from "lucide-react";

// OLD API services (keep 100% logic) - UNCHANGED
import { movieService } from "../../services/movieService";
import { showtimeService } from "../../services/showtimeService";
import { theaterService } from "../../services/theaterService";
import { Movie, Showtime, Theater } from "../../types";

// NEW UI components
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";

const ShowtimePage: React.FC = () => {
  const { id, theaterId } = useParams<{ id?: string; theaterId?: string }>();
  const location = useLocation();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [theater, setTheater] = useState<Theater | null>(null);
  const [, setShowtimes] = useState<Showtime[]>([]);
  const [groupedShowtimes, setGroupedShowtimes] = useState<{
    [date: string]: Showtime[];
  }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");

  // Determine if we're on theater route or movie route
  const isTheaterRoute = location.pathname.includes("/theaters/");
  const currentId = isTheaterRoute ? theaterId : id;

  useEffect(() => {
    const fetchData = async () => {
      if (!currentId) {
        setError(
          isTheaterRoute ? "Theater ID not provided" : "Movie ID not provided",
        );
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
            showtimeService.getShowtimesByTheater(parseInt(currentId, 10), {
              size: 100,
            }),
          ]);

          setTheater(theaterData);
          showtimesData = showtimesResponse;
        } else {
          // Fetch movie details and showtimes for movie
          const [movieData, showtimesResponse] = await Promise.all([
            movieService.getMovieByIdEnhanced(parseInt(currentId, 10)),
            showtimeService.getShowtimesByMovie(parseInt(currentId, 10), {
              size: 100,
            }),
          ]);

          setMovie(movieData);
          showtimesData = showtimesResponse;
        }

        setShowtimes(showtimesData.content);

        // Group showtimes by date
        const grouped = showtimeService.getShowtimesByDay(
          showtimesData.content,
        );
        setGroupedShowtimes(grouped);

        // Set the first available date as default
        const dates = Object.keys(grouped).sort();
        if (dates.length > 0) {
          setSelectedDate(dates[0]);
        }
      } catch (err) {
        setError(
          isTheaterRoute
            ? "Failed to load theater showtimes"
            : "Failed to load movie showtimes",
        );
        console.error("Error fetching showtimes:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentId, isTheaterRoute]);

  // NEW loading UI (modern design)
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center min-h-100">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-red-500 mx-auto mb-4" />
              <p className="text-gray-300 text-lg">Loading showtimes...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // NEW error UI (modern design)
  if (error || (!movie && !theater)) {
    return (
      <div className="min-h-screen bg-gray-950 pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center min-h-100">
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-8 text-center">
                <h2 className="text-2xl font-bold text-white mb-4">
                  Showtimes Not Available
                </h2>
                <p className="text-gray-400 mb-6">
                  {error ||
                    `Unable to load showtimes for this ${isTheaterRoute ? "theater" : "movie"}.`}
                </p>
                <Button asChild className="bg-red-600 hover:bg-red-700">
                  <Link to={isTheaterRoute ? "/theaters" : "/movies"}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to {isTheaterRoute ? "Theaters" : "Movies"}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const availableDates = Object.keys(groupedShowtimes).sort();
  const selectedShowtimes = selectedDate
    ? groupedShowtimes[selectedDate] || []
    : [];

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header Section - NEW UI with OLD data */}
      <section className="bg-gray-900 py-8 border-b border-gray-800">
        <div className="container mx-auto px-4">
          {/* Breadcrumb */}
          <nav className="mb-6">
            {isTheaterRoute ? (
              <div className="flex items-center space-x-2 text-gray-400">
                <Link
                  to="/theaters"
                  className="hover:text-white transition-colors"
                >
                  Theaters
                </Link>
                <span className="text-gray-600">/</span>
                <span className="text-white">Showtimes</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-gray-400">
                <Link
                  to="/movies"
                  className="hover:text-white transition-colors"
                >
                  Movies
                </Link>
                <span className="text-gray-600">/</span>
                <Link
                  to={`/movies/${movie?.id}`}
                  className="hover:text-white transition-colors"
                >
                  {movie?.title}
                </Link>
                <span className="text-gray-600">/</span>
                <span className="text-white">Showtimes</span>
              </div>
            )}
          </nav>

          {/* Theater Info */}
          {isTheaterRoute && theater ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex items-start space-x-6"
            >
              <div className="w-32 h-48 bg-gray-800 rounded-lg flex items-center justify-center">
                <Film className="w-12 h-12 text-red-500" />
              </div>
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-white mb-4">
                  {theater.name}
                </h1>
                <div className="flex items-center space-x-4 mb-4">
                  <Badge
                    variant="secondary"
                    className="bg-red-600 text-white hover:bg-red-700"
                  >
                    {theater.theaterType}
                  </Badge>
                  <div className="flex items-center space-x-2 text-gray-300">
                    <Users className="w-4 h-4" />
                    <span>{theater.capacity} seats</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            movie && (
              /* Movie Info */
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="flex items-start space-x-6"
              >
                <img
                  src={
                    movie.posterUrl ||
                    `https://via.placeholder.com/150x225/141414/E50914?text=${encodeURIComponent(movie.title)}`
                  }
                  alt={movie.title}
                  className="w-32 h-48 object-cover rounded-lg"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      `https://via.placeholder.com/150x225/141414/E50914?text=${encodeURIComponent(movie.title)}`;
                  }}
                />
                <div className="flex-1">
                  <h1 className="text-4xl font-bold text-white mb-4">
                    {movie.title}
                  </h1>
                  <div className="flex items-center space-x-4 mb-4">
                    <Badge
                      variant="secondary"
                      className="bg-red-600 text-white hover:bg-red-700"
                    >
                      {movie.genre}
                    </Badge>
                    <div className="flex items-center space-x-2 text-gray-300">
                      <Clock className="w-4 h-4" />
                      <span>{movie.formattedDuration}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-300">
                      <Film className="w-4 h-4" />
                      <span>Directed by {movie.director}</span>
                    </div>
                    {movie.averageRating > 0 && (
                      <div className="flex items-center space-x-2 text-gray-300">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="font-semibold">
                          {movieService.formatRating(movie.averageRating)}
                        </span>
                        <span className="text-gray-400 text-sm">
                          ({movie.reviewCount} review
                          {movie.reviewCount !== 1 ? "s" : ""})
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          )}
        </div>
      </section>

      {/* Content Section */}
      <main className="py-12 bg-gray-950">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold text-white mb-8">
              Select Showtime
            </h2>

            {availableDates.length === 0 ? (
              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-12 text-center">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-4">
                    No Showtimes Available
                  </h3>
                  <p className="text-gray-400 mb-6">
                    There are currently no showtimes scheduled for this{" "}
                    {isTheaterRoute ? "theater" : "movie"}.
                  </p>
                  <Button asChild className="bg-red-600 hover:bg-red-700">
                    {isTheaterRoute ? (
                      <Link to="/theaters">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Theaters
                      </Link>
                    ) : (
                      <Link to={`/movies/${movie?.id}`}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Movie Details
                      </Link>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Date Selector */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="mb-8"
                >
                  <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                    <Calendar className="w-5 h-5 mr-2 text-red-500" />
                    Select Date:
                  </h3>
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {availableDates.map((date) => (
                      <Button
                        key={date}
                        onClick={() => setSelectedDate(date)}
                        variant={selectedDate === date ? "default" : "outline"}
                        className={`min-w-18 h-auto flex-col gap-0.5 py-3 px-4 ${
                          selectedDate === date
                            ? "bg-red-600 hover:bg-red-700 text-white border-red-600"
                            : "bg-transparent border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
                        }`}
                      >
                        <div className="text-xs font-medium">
                          {new Date(date).toLocaleDateString("en-US", {
                            weekday: "short",
                          })}
                        </div>
                        <div className="text-lg font-bold">
                          {new Date(date).getDate()}
                        </div>
                        <div className="text-xs">
                          {new Date(date).toLocaleDateString("en-US", {
                            month: "short",
                          })}
                        </div>
                      </Button>
                    ))}
                  </div>
                </motion.div>

                {/* Showtimes for Selected Date */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="mb-8"
                >
                  <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-red-500" />
                    Showtimes for{" "}
                    {new Date(selectedDate).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {selectedShowtimes.map((showtime, index) => {
                      const availabilityInfo =
                        showtimeService.getAvailabilityStatus(showtime);
                      const isUpcoming =
                        showtime.upcoming ??
                        showtimeService.isShowtimeUpcoming(showtime);

                      return (
                        <motion.div
                          key={showtime.id}
                          initial={{ opacity: 0, y: 30 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: index * 0.1 }}
                        >
                          <Card className="bg-gray-800 border-gray-700 hover:border-red-500 transition-colors duration-300">
                            <CardContent className="p-6">
                              {/* Showtime Header */}
                              <div className="mb-4">
                                <div className="text-2xl font-bold text-white mb-1">
                                  {showtimeService.formatShowTime(showtime)}
                                  {showtime.endDatetime && (
                                    <span className="text-base text-gray-400 font-normal ml-2">
                                      →{" "}
                                      {new Date(
                                        showtime.endDatetime,
                                      ).toLocaleTimeString("vi-VN", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                        hour12: false,
                                      })}
                                    </span>
                                  )}
                                </div>
                                <div className="text-gray-300 font-medium flex items-center">
                                  <MapPin className="w-4 h-4 mr-2" />
                                  {isTheaterRoute
                                    ? showtime.movieTitle
                                    : showtime.theaterName}
                                </div>
                              </div>

                              {/* Showtime Info */}
                              <div className="flex justify-between items-center mb-4">
                                <div className="flex items-center text-yellow-500 font-semibold">
                                  <Clock className="w-4 h-4 mr-1" />
                                  {Math.floor(
                                    showtime.movieDurationMinutes / 60,
                                  )}
                                  h {showtime.movieDurationMinutes % 60}m
                                </div>
                                <div className="text-green-500 font-bold text-lg">
                                  {showtimeService.formatPrice(showtime.price)}
                                </div>
                              </div>

                              {/* Availability Info */}
                              <div className="flex justify-between items-center mb-6">
                                <Badge
                                  className="text-white font-medium"
                                  style={{
                                    backgroundColor: availabilityInfo.color,
                                  }}
                                >
                                  {availabilityInfo.label}
                                </Badge>
                                <div className="text-gray-400 text-sm flex items-center">
                                  <Users className="w-4 h-4 mr-1" />
                                  {showtime.availableSeats} trống /{" "}
                                  {showtime.bookedSeats ??
                                    showtime.theaterCapacity -
                                      showtime.availableSeats}{" "}
                                  đã đặt
                                </div>
                              </div>

                              {/* Action Button */}
                              <div>
                                {showtime.ongoing ? (
                                  <Button
                                    disabled
                                    className="w-full bg-blue-900/50 text-blue-300 cursor-not-allowed"
                                  >
                                    <Ticket className="w-4 h-4 mr-2" />
                                    Đang chiếu
                                  </Button>
                                ) : showtime.finished ? (
                                  <Button
                                    disabled
                                    className="w-full bg-gray-700 text-gray-500 cursor-not-allowed"
                                  >
                                    Đã kết thúc
                                  </Button>
                                ) : isUpcoming &&
                                  (showtime.bookable ?? true) &&
                                  showtime.availableSeats > 0 ? (
                                  <Button
                                    asChild
                                    className="w-full bg-red-600 hover:bg-red-700"
                                  >
                                    <Link to={`/booking/${showtime.id}`}>
                                      <Ticket className="w-4 h-4 mr-2" />
                                      Đặt vé
                                    </Link>
                                  </Button>
                                ) : (
                                  <Button
                                    disabled
                                    className="w-full bg-gray-600 text-gray-300 cursor-not-allowed"
                                  >
                                    Không còn chỗ
                                  </Button>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              </>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default ShowtimePage;
