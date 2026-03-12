import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Play, TrendingUp, Calendar, Star, Loader2, Film } from "lucide-react";

// OLD API services (keep 100% logic) - UNCHANGED
import { movieService } from "../../services/movieService";
import {
  aiService,
  MixedRecommendationResponse,
} from "../../services/aiService";
import { authService } from "../../services/authService";
import { Movie } from "../../types";

// NEW UI components
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  // OLD state management (100% unchanged)
  const [featuredMovie, setFeaturedMovie] = useState<Movie | null>(null);
  const [recommendations, setRecommendations] =
    useState<MixedRecommendationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // OLD API logic (100% preserved from original HomePage)
  useEffect(() => {
    // Redirect admin users to admin dashboard
    if (authService.isAdmin()) {
      navigate("/admin");
      return;
    }

    const fetchHomepageData = async () => {
      try {
        const isAuthenticated = authService.getToken() !== null;

        if (isAuthenticated) {
          // Get AI-powered mixed recommendations for logged-in users
          try {
            const homepageRecommendations =
              await aiService.getHomepageRecommendations();
            setRecommendations(homepageRecommendations);

            if (
              homepageRecommendations.sections.length > 0 &&
              homepageRecommendations.sections[0].movies.length > 0
            ) {
              setFeaturedMovie(homepageRecommendations.sections[0].movies[0]);
              return; // success, no need for fallback
            }
          } catch {
            // AI failed, fall through to basic fetch below
          }
        }

        // Fallback for non-authenticated users OR when AI fails
        const currentlyShowingResponse =
          await movieService.getCurrentlyShowingMoviesEnhanced({
            page: 0,
            size: 8,
          });

        if (currentlyShowingResponse.content.length > 0) {
          setFeaturedMovie(currentlyShowingResponse.content[0]);
          setRecommendations({
            sections: [
              {
                title: "Currently Showing",
                movies: currentlyShowingResponse.content.slice(1, 6),
                description: "Movies currently playing in theaters",
              },
            ],
          });
        }
      } catch (err) {
        console.error("Error fetching homepage data:", err);
        setError("Failed to load movies");
      } finally {
        setLoading(false);
      }
    };

    fetchHomepageData();
  }, [navigate]);

  // NEW loading UI (modern design)
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-red-500 mx-auto mb-4" />
          <p className="text-gray-300 text-lg">Loading amazing content...</p>
        </div>
      </div>
    );
  }

  // NEW error UI (modern design)
  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">
              Something went wrong
            </h2>
            <p className="text-gray-400 mb-6">{error}</p>
            <Button
              onClick={() => window.location.reload()}
              className="bg-red-600 hover:bg-red-700"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!featuredMovie) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md px-4"
        >
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12">
            <div className="w-20 h-20 bg-red-600/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Film className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">
              No Movies Available
            </h2>
            <p className="text-gray-400 mb-8">
              There are no movies to display right now. Check back later or
              browse the full catalog.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild className="bg-red-600 hover:bg-red-700">
                <Link to="/movies">
                  <Play className="w-4 h-4 mr-2" />
                  Browse Movies
                </Link>
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                className="bg-gray-800! border-gray-700! text-white! hover:bg-gray-700!"
              >
                Refresh
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Hero Section with Featured Movie - NEW UI */}
      <section className="relative h-[80vh] overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src={featuredMovie.poster}
            alt={featuredMovie.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                "https://via.placeholder.com/1920x1080?text=Movie+Poster";
            }}
          />
          <div className="absolute inset-0 bg-linear-to-r from-gray-950 via-gray-950/80 to-transparent" />
          <div className="absolute inset-0 bg-linear-to-t from-gray-950 via-transparent to-transparent" />
        </div>

        {/* Hero Content */}
        <div className="relative container mx-auto px-4 h-full flex items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl"
          >
            <div className="inline-flex items-center space-x-2 bg-red-600/20 backdrop-blur-sm border border-red-500/30 px-4 py-2 rounded-full mb-4">
              <TrendingUp className="w-4 h-4 text-red-500" />
              <span className="text-sm text-red-400 font-semibold">
                Featured Movie
              </span>
            </div>

            <h1 className="text-6xl md:text-7xl font-bold text-white mb-4 leading-tight">
              {featuredMovie.title}
            </h1>

            <div className="flex items-center space-x-6 mb-6 text-gray-300">
              <div className="flex items-center space-x-2">
                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                <span className="font-semibold">
                  {featuredMovie.rating || "N/A"}/10
                </span>
              </div>
              <span>•</span>
              <span>{featuredMovie.duration} min</span>
              <span>•</span>
              <span>{featuredMovie.genre}</span>
            </div>

            <p className="text-xl text-gray-300 mb-8 leading-relaxed line-clamp-3">
              {featuredMovie.description}
            </p>

            <div className="flex items-center space-x-4">
              <Button asChild size="lg" className="bg-red-600 hover:bg-red-700">
                <Link to={`/movies/${featuredMovie.id}`}>
                  <Play className="w-5 h-5 mr-2" />
                  Watch Now
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="bg-gray-800! border-gray-600! text-white! hover:bg-white! hover:text-black!"
              >
                <Link to={`/movies/${featuredMovie.id}/showtimes`}>
                  <Calendar className="w-5 h-5 mr-2" />
                  View Showtimes
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Recommendations Sections - NEW UI with OLD data */}
      <main className="py-20">
        <div className="container mx-auto px-4">
          {recommendations?.sections.map(
            (section, sectionIndex) =>
              section.movies.length > 0 && (
                <motion.section
                  key={sectionIndex}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 * sectionIndex }}
                  className="mb-16"
                >
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="text-3xl font-bold text-white mb-2">
                        {section.title}
                      </h2>
                      {section.description && (
                        <p className="text-gray-400">{section.description}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      className="text-red-500 hover:text-red-400"
                    >
                      View All
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {section.movies.map((movie, index) => (
                      <motion.div
                        key={movie.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                          duration: 0.4,
                          delay: 0.1 * index,
                        }}
                        whileHover={{ scale: 1.05 }}
                        className="group cursor-pointer"
                      >
                        <Link to={`/movies/${movie.id}`} className="block">
                          <Card className="bg-gray-900 border-gray-800 overflow-hidden hover:bg-gray-800 transition-colors">
                            <div className="aspect-2/3 relative overflow-hidden">
                              <img
                                src={movie.poster}
                                alt={movie.title}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src =
                                    "https://via.placeholder.com/300x450?text=" +
                                    encodeURIComponent(movie.title);
                                }}
                              />
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Play className="w-12 h-12 text-white" />
                              </div>
                            </div>
                            <CardContent className="p-4">
                              <h3 className="text-white font-semibold mb-2 line-clamp-1">
                                {movie.title}
                              </h3>
                              <div className="flex items-center justify-between text-sm text-gray-400">
                                <span>{movie.genre}</span>
                                <div className="flex items-center space-x-1">
                                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                  <span>{movie.rating || "N/A"}</span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </motion.section>
              )
          )}

          {/* CTA Section */}
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="text-center py-20"
          >
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready for the Ultimate Cinema Experience?
            </h2>
            <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
              Discover amazing movies, book your seats, and enjoy premium
              entertainment at our state-of-the-art theaters.
            </p>
            <div className="flex items-center justify-center space-x-4">
              <Button asChild size="lg" className="bg-red-600 hover:bg-red-700">
                <Link to="/movies">Browse Movies</Link>
              </Button>
              {!authService.getToken() && (
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="bg-gray-800! border-gray-600! text-white! hover:bg-white! hover:text-black!"
                >
                  <Link to="/login">Sign In</Link>
                </Button>
              )}
            </div>
          </motion.section>
        </div>
      </main>
    </div>
  );
};

export default HomePage;
