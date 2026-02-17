import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Search,
  Bot,
  Target,
  Sparkles,
  Star,
  Play,
  Calendar,
  Brain,
  Film,
  Loader2,
  AlertCircle,
  TrendingUp,
  Heart,
  Zap,
  Eye
} from 'lucide-react';

// OLD API services (keep 100% logic) - UNCHANGED
import { recommendationService, MixedRecommendationResponse, RecommendationResponse } from '../../services/recommendationService';
import { authService } from '../../services/authService';
import RecommendationCard from '../../components/RecommendationCard';
import { Movie } from '../../types';

// NEW UI components
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';

const RecommendationPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mixedRecommendations, setMixedRecommendations] = useState<MixedRecommendationResponse | null>(null);
  const [aiRecommendations, setAiRecommendations] = useState<RecommendationResponse | null>(null);
  const [semanticSearchQuery, setSemanticSearchQuery] = useState('');
  const [semanticResults, setSemanticResults] = useState<RecommendationResponse | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if user is authenticated
      const authenticated = authService.isAuthenticated();
      setIsAuthenticated(authenticated);

      if (authenticated) {
        // Load personalized recommendations
        const [mixed, aiPersonalized] = await Promise.all([
          recommendationService.getMixedRecommendations(15),
          recommendationService.getAIPersonalizedRecommendations(12)
        ]);

        setMixedRecommendations(mixed);
        setAiRecommendations(aiPersonalized);
      } else {
        // Load new user recommendations
        const newUserRecs = await recommendationService.getNewUserRecommendations(20);
        setMixedRecommendations({
          sections: [{
            title: 'Discover Great Movies',
            movies: newUserRecs.movies,
            description: 'Popular movies to get you started'
          }]
        });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load recommendations');
      console.error('Error loading recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSemanticSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!semanticSearchQuery.trim()) return;

    try {
      setSearchLoading(true);
      const results = await recommendationService.semanticMovieSearch(semanticSearchQuery, 12);
      setSemanticResults(results);
    } catch (err: any) {
      console.error('Semantic search failed:', err);
      setSemanticResults({
        title: 'Search Results',
        movies: [],
        reasons: ['Search failed - please try again'],
        type: 'SEMANTIC_SEARCH'
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
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-red-500 mx-auto mb-4" />
              <p className="text-gray-300 text-lg">Loading your personalized recommendations...</p>
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
          <div className="flex items-center justify-center min-h-[400px]">
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-8 text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-4">Failed to Load Recommendations</h2>
                <p className="text-gray-400 mb-6">{error}</p>
                <Button onClick={loadRecommendations} className="bg-red-600 hover:bg-red-700">
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
      {/* Header Section - NEW UI */}
      <section className="bg-gradient-to-r from-purple-900 to-indigo-800 py-16 text-center">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 rounded-full mb-6">
              {isAuthenticated ? (
                <Target className="w-10 h-10 text-white" />
              ) : (
                <Sparkles className="w-10 h-10 text-white" />
              )}
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {isAuthenticated ? 'Your Recommendations' : 'Discover Movies'}
            </h1>
            <p className="text-lg text-purple-100 max-w-2xl mx-auto">
              {isAuthenticated
                ? 'Personalized movie recommendations based on your preferences'
                : 'Popular movies and trending content to get you started'
              }
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content Section */}
      <main className="py-12 bg-gray-950">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="space-y-12">

            {/* AI Semantic Search Section - NEW UI with OLD logic */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Card className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 border-blue-700">
                <CardContent className="p-8">
                  <div className="text-center mb-8">
                    <div className="flex items-center justify-center mb-4">
                      <Bot className="w-8 h-8 text-blue-400 mr-3" />
                      <h2 className="text-3xl font-bold text-white">AI Movie Search</h2>
                    </div>
                    <p className="text-blue-100">
                      Describe what you're in the mood for - our AI will find the perfect movie
                    </p>
                  </div>

                  <form onSubmit={handleSemanticSearch} className="max-w-4xl mx-auto">
                    <div className="flex space-x-4">
                      <input
                        type="text"
                        value={semanticSearchQuery}
                        onChange={(e) => setSemanticSearchQuery(e.target.value)}
                        placeholder="e.g., 'funny romantic comedy with great chemistry' or 'dark thriller with plot twists'"
                        disabled={searchLoading}
                        className="flex-1 px-6 py-4 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                      />
                      <Button
                        type="submit"
                        disabled={searchLoading || !semanticSearchQuery.trim()}
                        className="bg-blue-600 hover:bg-blue-700 px-8"
                        size="lg"
                      >
                        {searchLoading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <>
                            <Search className="w-5 h-5 mr-2" />
                            Search
                          </>
                        )}
                      </Button>
                    </div>
                  </form>

                  {/* Semantic Search Results */}
                  {semanticResults && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                      className="mt-8"
                    >
                      <div className="text-center mb-6">
                        <h3 className="text-2xl font-bold text-white mb-2">{semanticResults.title}</h3>
                        <p className="text-blue-200">
                          {semanticResults.reasons.join(' • ')}
                        </p>
                      </div>

                      {semanticResults.movies.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
                        <Card className="bg-gray-800/50 border-gray-700">
                          <CardContent className="p-8 text-center">
                            <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-300">
                              No movies found matching your description. Try a different search!
                            </p>
                          </CardContent>
                        </Card>
                      )}
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* AI Personalized Recommendations */}
            {isAuthenticated && aiRecommendations && aiRecommendations.movies.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <div className="flex items-center mb-8">
                  <Target className="w-8 h-8 text-green-500 mr-3" />
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-2">AI-Powered Picks for You</h2>
                    <p className="text-gray-400">{aiRecommendations.reasons.join(' • ')}</p>
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
            {mixedRecommendations?.sections.map((section, sectionIndex) => (
              section.movies.length > 0 && (
                <motion.div
                  key={sectionIndex}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: (sectionIndex + 1) * 0.2 }}
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
                      <h2 className="text-3xl font-bold text-white mb-2">{section.title}</h2>
                      <p className="text-gray-400">{section.description}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {section.movies.map((movie, movieIndex) => (
                      <motion.div
                        key={movie.id}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: movieIndex * 0.1 }}
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
              )
            ))}

            {/* Empty State */}
            {(!mixedRecommendations?.sections || mixedRecommendations.sections.every(s => s.movies.length === 0)) && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <Card className="bg-gray-900 border-gray-800">
                  <CardContent className="p-12 text-center">
                    <Film className="w-16 h-16 text-gray-400 mx-auto mb-6" />
                    <h2 className="text-2xl font-bold text-white mb-4">No Recommendations Available</h2>
                    <p className="text-gray-400 mb-8 max-w-md mx-auto">
                      We're still learning your preferences. Try browsing movies and rating them to get better recommendations!
                    </p>
                    <Button
                      onClick={() => navigate('/movies')}
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