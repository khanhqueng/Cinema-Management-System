import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import {
  Search,
  Bot,
  Target,
  Brain,
  Film,
  Loader2,
  AlertCircle,
  TrendingUp,
  Heart,
  Zap,
  Eye,
} from "lucide-react";

import {
  recommendationService,
  MixedRecommendationResponse,
  RecommendationResponse,
} from "../../services/recommendationService";
import RecommendationCard from "../../components/RecommendationCard";
import { Movie } from "../../types";

// NEW UI components
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";

const RecommendationPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mixedRecommendations, setMixedRecommendations] =
    useState<MixedRecommendationResponse | null>(null);
  const [aiRecommendations, setAiRecommendations] =
    useState<RecommendationResponse | null>(null);
  const [semanticSearchQuery, setSemanticSearchQuery] = useState("");
  const [semanticResults, setSemanticResults] =
    useState<RecommendationResponse | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);

      const [mixed, aiPersonalized] = await Promise.all([
        recommendationService.getMixedRecommendations(15),
        recommendationService.getAIPersonalizedRecommendations(12),
      ]);

      setMixedRecommendations(mixed);
      setAiRecommendations(aiPersonalized);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load recommendations");
      console.error("Error loading recommendations:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSemanticSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!semanticSearchQuery.trim()) return;

    try {
      setSearchLoading(true);
      const results = await recommendationService.semanticMovieSearch(
        semanticSearchQuery,
        12,
      );
      setSemanticResults(results);
    } catch (err: any) {
      console.error("Semantic search failed:", err);
      setSemanticResults({
        title: "Search Results",
        movies: [],
        reasons: ["Search failed - please try again"],
        type: "SEMANTIC_SEARCH",
      });
    } finally {
      setSearchLoading(false);
    }
  };

  const handleViewDetails = (movie: Movie) => {
    navigate(`/movies/${movie.id}`);
  };

  const handleViewShowtimes = (movie: Movie) => {
    navigate(`/movies/${movie.id}/showtimes`);
  };

  // NEW loading UI (modern design)
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center min-h-100">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-red-500 mx-auto mb-4" />
              <p className="text-gray-300 text-lg">
                Loading your personalized recommendations...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // NEW error UI (modern design)
  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center min-h-100">
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-8 text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-4">
                  Failed to Load Recommendations
                </h2>
                <p className="text-gray-400 mb-6">{error}</p>
                <Button
                  onClick={loadRecommendations}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Try Again
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header Section */}
      <section className="relative overflow-hidden bg-gray-950 border-b border-gray-800/60 py-14">
        {/* Subtle background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-purple-700/20 rounded-full blur-3xl" />
        </div>
        <div className="relative container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold uppercase tracking-widest px-4 py-1.5 rounded-full mb-5">
              <Target className="w-3.5 h-3.5" />
              Personalized for you
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
              Your Recommendations
            </h1>
            <p className="text-gray-400 max-w-xl mx-auto text-base">
              AI‑powered movie picks tailored to your taste and viewing history.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content Section */}
      <main className="py-12 bg-gray-950">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="space-y-12">
            {/* AI Semantic Search Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="rounded-2xl border border-gray-800 bg-gray-900 overflow-hidden">
                {/* Card header bar */}
                <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-800 bg-gray-800/40">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <Bot className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-white">
                      AI Semantic Search
                    </h2>
                    <p className="text-xs text-gray-500">
                      Describe what you're in the mood for
                    </p>
                  </div>
                </div>

                <div className="p-6">
                  <form onSubmit={handleSemanticSearch}>
                    <div className="flex gap-3">
                      <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                        <input
                          type="text"
                          value={semanticSearchQuery}
                          onChange={(e) =>
                            setSemanticSearchQuery(e.target.value)
                          }
                          placeholder="e.g. 'dark psychological thriller with a twist ending'"
                          disabled={searchLoading}
                          className="w-full pl-11 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 disabled:opacity-50 transition"
                        />
                      </div>
                      <Button
                        type="submit"
                        disabled={searchLoading || !semanticSearchQuery.trim()}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 rounded-xl shrink-0 h-auto py-3"
                      >
                        {searchLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Search className="w-4 h-4 mr-2" />
                            Search
                          </>
                        )}
                      </Button>
                    </div>
                  </form>

                  {/* Semantic Search Results */}
                  {semanticResults && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                      className="mt-6"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base font-semibold text-white">
                          {semanticResults.title}
                        </h3>
                        <span className="text-xs text-gray-500">
                          {semanticResults.reasons.join(" · ")}
                        </span>
                      </div>

                      {semanticResults.movies.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                          {semanticResults.movies.map((movie) => (
                            <RecommendationCard
                              key={movie.id}
                              movie={movie}
                              onViewDetails={handleViewDetails}
                              onViewShowtimes={handleViewShowtimes}
                              compact
                              showReason="AI Match"
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                          <Brain className="w-10 h-10 text-gray-600 mb-3" />
                          <p className="text-sm text-gray-500">
                            No results found. Try a different description.
                          </p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* AI Personalized Recommendations */}
            {aiRecommendations && aiRecommendations.movies.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <div className="flex items-center mb-8">
                  <Target className="w-8 h-8 text-green-500 mr-3" />
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-2">
                      AI-Powered Picks for You
                    </h2>
                    <p className="text-gray-400">
                      {aiRecommendations.reasons.join(" • ")}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {aiRecommendations.movies.map((movie, index) => (
                    <motion.div
                      key={movie.id}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                    >
                      <RecommendationCard
                        movie={movie}
                        onViewDetails={handleViewDetails}
                        onViewShowtimes={handleViewShowtimes}
                        showReason="AI Personalized"
                      />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Mixed Recommendations Sections */}
            {mixedRecommendations?.sections.map(
              (section, sectionIndex) =>
                section.movies.length > 0 && (
                  <motion.div
                    key={sectionIndex}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.6,
                      delay: (sectionIndex + 1) * 0.2,
                    }}
                  >
                    <div className="flex items-center mb-8">
                      <div className="flex items-center justify-center w-10 h-10 bg-red-600 rounded-lg mr-3">
                        {sectionIndex === 0 ? (
                          <TrendingUp className="w-6 h-6 text-white" />
                        ) : sectionIndex === 1 ? (
                          <Heart className="w-6 h-6 text-white" />
                        ) : (
                          <Zap className="w-6 h-6 text-white" />
                        )}
                      </div>
                      <div>
                        <h2 className="text-3xl font-bold text-white mb-2">
                          {section.title}
                        </h2>
                        <p className="text-gray-400">{section.description}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {section.movies.map((movie, movieIndex) => (
                        <motion.div
                          key={movie.id}
                          initial={{ opacity: 0, y: 30 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            duration: 0.4,
                            delay: movieIndex * 0.1,
                          }}
                        >
                          <RecommendationCard
                            movie={movie}
                            onViewDetails={handleViewDetails}
                            onViewShowtimes={handleViewShowtimes}
                          />
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                ),
            )}

            {/* Empty State */}
            {(!mixedRecommendations?.sections ||
              mixedRecommendations.sections.every(
                (s) => s.movies.length === 0,
              )) && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <Card className="bg-gray-900 border-gray-800">
                  <CardContent className="p-12 text-center">
                    <Film className="w-16 h-16 text-gray-400 mx-auto mb-6" />
                    <h2 className="text-2xl font-bold text-white mb-4">
                      No Recommendations Available
                    </h2>
                    <p className="text-gray-400 mb-8 max-w-md mx-auto">
                      We're still learning your preferences. Try browsing movies
                      and rating them to get better recommendations!
                    </p>
                    <Button
                      onClick={() => navigate("/movies")}
                      className="bg-red-600 hover:bg-red-700"
                      size="lg"
                    >
                      <Eye className="w-5 h-5 mr-2" />
                      Browse Movies
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default RecommendationPage;
