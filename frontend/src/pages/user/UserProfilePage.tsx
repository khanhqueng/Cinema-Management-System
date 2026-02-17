import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  User as UserIcon,
  Mail,
  Phone,
  Settings,
  Heart,
  LogOut,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Film
} from 'lucide-react';

// OLD API services (keep 100% logic) - UNCHANGED
import { User } from '../../types';
import { UserGenrePreference } from '../../types/genres';
import GenreSelector from '../../components/GenreSelector';
import { authService } from '../../services/authService';

// NEW UI components
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';

const UserProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [userPreferences, setUserPreferences] = useState<UserGenrePreference[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Profile form data
  const [profileData, setProfileData] = useState({
    fullName: '',
    phone: '',
    email: ''
  });

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load user basic info
      const userData = await authService.getCurrentUser();

      if (userData) {
        setUser(userData);
        setProfileData({
          fullName: userData.fullName || '',
          phone: userData.phone || '',
          email: userData.email || ''
        });
      }

      // Load user genre preferences (this would need to be implemented)
      // const preferences = await userService.getUserGenrePreferences();
      // setUserPreferences(preferences);
      // setSelectedGenres(preferences.map(p => p.genre));

    } catch (err: any) {
      setError('Failed to load user profile');
      console.error('Error loading user profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setUpdating(true);
      setError(null);

      // Update basic profile info
      // await userService.updateProfile(profileData);

      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  const handleGenrePreferencesUpdate = async () => {
    try {
      setUpdating(true);
      setError(null);

      // Update genre preferences
      // await userService.updateGenrePreferences(selectedGenres);

      setSuccess('Movie preferences updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update preferences');
    } finally {
      setUpdating(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value
    });
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  // NEW loading UI (modern design)
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-red-500 mx-auto mb-4" />
              <p className="text-gray-300 text-lg">Loading your profile...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header Section - NEW UI */}
      <section className="bg-gradient-to-r from-blue-900 to-blue-800 py-16 text-center">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 rounded-full mb-6">
              <UserIcon className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">My Profile</h1>
            <p className="text-lg text-blue-100 max-w-2xl mx-auto">
              Manage your account settings and movie preferences
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content Section */}
      <main className="py-12 bg-gray-950">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            {/* Error Alert - NEW UI with OLD logic */}
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-900/50 border border-red-600 text-red-300 p-4 rounded-lg flex items-center"
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
                className="bg-green-900/50 border border-green-600 text-green-300 p-4 rounded-lg flex items-center"
              >
                <CheckCircle2 className="w-5 h-5 mr-2 flex-shrink-0" />
                {success}
              </motion.div>
            )}

            {/* Account Information Section */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-8">
                  <div className="flex items-center mb-6">
                    <Settings className="w-6 h-6 text-blue-500 mr-3" />
                    <div>
                      <h2 className="text-2xl font-bold text-white">Account Information</h2>
                      <p className="text-gray-400">Update your basic account details</p>
                    </div>
                  </div>

                  <form onSubmit={handleProfileUpdate} className="space-y-6">
                    {/* Full Name Input */}
                    <div className="space-y-2">
                      <label htmlFor="fullName" className="text-sm font-medium text-gray-300 flex items-center">
                        <UserIcon className="w-4 h-4 mr-2" />
                        Full Name
                      </label>
                      <input
                        type="text"
                        id="fullName"
                        name="fullName"
                        value={profileData.fullName}
                        onChange={handleInputChange}
                        required
                        maxLength={100}
                        className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>

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
                        value={profileData.email}
                        disabled
                        className="w-full px-4 py-3 bg-gray-600/30 border border-gray-600 rounded-lg text-gray-400 cursor-not-allowed"
                      />
                      <p className="text-gray-500 text-xs">Email cannot be changed</p>
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
                        value={profileData.phone}
                        onChange={handleInputChange}
                        maxLength={15}
                        placeholder="Optional"
                        className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      disabled={updating}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      size="lg"
                    >
                      {updating ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5 mr-2" />
                          Update Profile
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>

            {/* Movie Preferences Section */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-8">
                  <div className="flex items-center mb-6">
                    <Heart className="w-6 h-6 text-red-500 mr-3" />
                    <div>
                      <h2 className="text-2xl font-bold text-white">Movie Preferences</h2>
                      <p className="text-gray-400">Update your favorite movie genres to get better recommendations</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <GenreSelector
                      selectedGenres={selectedGenres}
                      onGenresChange={setSelectedGenres}
                      title="What movies do you love?"
                      subtitle="Select your favorite genres for personalized recommendations"
                      minSelections={1}
                      maxSelections={8}
                      disabled={updating}
                    />

                    <Button
                      onClick={handleGenrePreferencesUpdate}
                      disabled={updating || selectedGenres.length === 0}
                      className="bg-red-600 hover:bg-red-700 text-white"
                      size="lg"
                    >
                      {updating ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Updating Preferences...
                        </>
                      ) : (
                        <>
                          <Film className="w-5 h-5 mr-2" />
                          Update Movie Preferences
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Account Actions Section */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-8">
                  <div className="flex items-center mb-6">
                    <Settings className="w-6 h-6 text-yellow-500 mr-3" />
                    <div>
                      <h2 className="text-2xl font-bold text-white">Account Actions</h2>
                      <p className="text-gray-400">Manage your account</p>
                    </div>
                  </div>

                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    className="!bg-gray-800 !border-red-600 !text-red-400 hover:!bg-red-600 hover:!text-white"
                    size="lg"
                  >
                    <LogOut className="w-5 h-5 mr-2" />
                    Log Out
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default UserProfilePage;