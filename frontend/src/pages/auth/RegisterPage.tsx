import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Phone,
  ArrowLeft,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Film,
  Heart
} from 'lucide-react';

// OLD API services (keep 100% logic) - UNCHANGED
import { authService } from '../../services/authService';
import { RegisterRequest } from '../../types';
import GenreSelector from '../../components/GenreSelector';

// NEW UI components
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'info' | 'preferences'>('info');
  const [formData, setFormData] = useState<RegisterRequest>({
    email: '',
    password: '',
    fullName: '',
    phone: '',
    genrePreferences: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('preferences');
    setError(null);
  };

  const handleBackStep = () => {
    setStep('info');
    setError(null);
  };

  const handleGenresChange = (genres: string[]) => {
    setFormData({
      ...formData,
      genrePreferences: genres,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await authService.register(formData);
      setSuccess(response.message);

      // Redirect to login page after successful registration
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    return formData.email && formData.password && formData.fullName &&
           (formData.genrePreferences?.length || 0) >= 3;
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center relative overflow-hidden py-8">
      {/* Background Elements - NEW UI */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-red-900/20 to-gray-950" />
        <div className="absolute top-0 left-0 w-72 h-72 bg-red-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-2xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          {/* Brand */}
          <div className="flex items-center justify-center mb-6">
            <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center mr-3">
              <Film className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Cinema</h1>
          </div>

          {/* Back to Home */}
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="text-gray-400 hover:text-white mb-4"
          >
            <Link to="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
          </Button>
        </motion.div>

        {/* Step Progress - NEW UI */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex items-center justify-center space-x-4">
            {/* Step 1 */}
            <div className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                step === 'info' ? 'bg-red-600 text-white' : step === 'preferences' ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'
              }`}>
                {step === 'preferences' ? <CheckCircle2 className="w-5 h-5" /> : '1'}
              </div>
              <span className="ml-3 text-gray-300 font-medium hidden sm:block">Account Info</span>
            </div>

            {/* Divider */}
            <div className="w-12 h-px bg-gray-600"></div>

            {/* Step 2 */}
            <div className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                step === 'preferences' ? 'bg-red-600 text-white' : 'bg-gray-600 text-gray-300'
              }`}>
                2
              </div>
              <span className="ml-3 text-gray-300 font-medium hidden sm:block">Movie Preferences</span>
            </div>
          </div>
        </motion.div>

        {/* Auth Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
            <CardContent className="p-8">
              {/* Header */}
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white mb-2">
                  {step === 'info' ? 'Create Account' : 'Choose Your Favorites'}
                </h2>
                <p className="text-gray-400">
                  {step === 'info' ? 'Enter your basic information' : 'Help us personalize your movie experience'}
                </p>
              </div>

              {/* Error Alert - NEW UI with OLD logic */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-red-900/50 border border-red-600 text-red-300 p-4 rounded-lg flex items-center mb-6"
                >
                  <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                  {error}
                </motion.div>
              )}

              {/* Success Alert - NEW UI with OLD logic */}
              {success && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-green-900/50 border border-green-600 text-green-300 p-4 rounded-lg flex items-center mb-6"
                >
                  <CheckCircle2 className="w-5 h-5 mr-2 flex-shrink-0" />
                  {success}
                </motion.div>
              )}

              {/* Step 1: Account Information */}
              {step === 'info' && (
                <form onSubmit={handleNextStep} className="space-y-6">
                  {/* Email Input */}
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium text-gray-300 flex items-center">
                      <Mail className="w-4 h-4 mr-2" />
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="name@example.com"
                      autoComplete="email"
                      className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>

                  {/* Full Name Input */}
                  <div className="space-y-2">
                    <label htmlFor="fullName" className="text-sm font-medium text-gray-300 flex items-center">
                      <User className="w-4 h-4 mr-2" />
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      required
                      maxLength={100}
                      placeholder="John Doe"
                      autoComplete="name"
                      className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>

                  {/* Phone Input */}
                  <div className="space-y-2">
                    <label htmlFor="phone" className="text-sm font-medium text-gray-300 flex items-center">
                      <Phone className="w-4 h-4 mr-2" />
                      Phone Number <span className="text-gray-500 ml-1">(optional)</span>
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      maxLength={15}
                      pattern="[\d\+\-\s\(\)]*"
                      placeholder="+1 (555) 123-4567"
                      autoComplete="tel"
                      className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>

                  {/* Password Input */}
                  <div className="space-y-2">
                    <label htmlFor="password" className="text-sm font-medium text-gray-300 flex items-center">
                      <Lock className="w-4 h-4 mr-2" />
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        minLength={6}
                        placeholder="At least 6 characters"
                        autoComplete="new-password"
                        className="w-full px-4 py-3 pr-12 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    <p className="text-gray-500 text-xs">Minimum 6 characters</p>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full bg-red-600 hover:bg-red-700 text-white py-3 text-base font-medium"
                    size="lg"
                  >
                    Next: Choose Movie Preferences
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </form>
              )}

              {/* Step 2: Genre Preferences */}
              {step === 'preferences' && (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Genre Selector - Preserve OLD component with NEW styling context */}
                  <div className="space-y-4">
                    <div className="flex items-center text-gray-300 mb-4">
                      <Heart className="w-5 h-5 mr-2 text-red-500" />
                      <h3 className="text-lg font-semibold">What movies do you love?</h3>
                    </div>
                    <GenreSelector
                      selectedGenres={formData.genrePreferences || []}
                      onGenresChange={handleGenresChange}
                      title="What movies do you love?"
                      subtitle="Select at least 3 genres to get personalized recommendations"
                      minSelections={3}
                      maxSelections={6}
                      disabled={loading}
                    />
                  </div>

                  {/* Form Actions */}
                  <div className="space-y-3">
                    <Button
                      type="button"
                      onClick={handleBackStep}
                      disabled={loading}
                      variant="outline"
                      className="w-full !bg-gray-800 !border-gray-600 !text-white hover:!bg-gray-700 hover:!text-white"
                      size="lg"
                    >
                      <ArrowLeft className="w-5 h-5 mr-2" />
                      Back to Account Info
                    </Button>

                    <Button
                      type="submit"
                      disabled={loading || (formData.genrePreferences?.length || 0) < 3}
                      className="w-full bg-red-600 hover:bg-red-700 text-white py-3 text-base font-medium"
                      size="lg"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Creating Account...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-5 h-5 mr-2" />
                          Create My Account
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              )}

              {/* Footer */}
              <div className="text-center mt-8 pt-6 border-t border-gray-700">
                <p className="text-gray-400">
                  Already have an account?{' '}
                  <Link
                    to="/login"
                    className="text-red-400 hover:text-red-300 font-medium transition-colors"
                  >
                    Sign in now
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default RegisterPage;
