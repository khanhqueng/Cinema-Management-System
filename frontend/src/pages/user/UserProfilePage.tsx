import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '../../types';
import { UserGenrePreference } from '../../types/genres';
import GenreSelector from '../../components/GenreSelector';
import { authService } from '../../services/authService';

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

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-container">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading your profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <h1>My Profile</h1>
          <p>Manage your account settings and movie preferences</p>
        </div>

        {error && (
          <div className="alert alert-error">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
            {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            {success}
          </div>
        )}

        <div className="profile-sections">
          {/* Basic Profile Information */}
          <section className="profile-section">
            <div className="section-header">
              <h2>Account Information</h2>
              <p>Update your basic account details</p>
            </div>

            <form onSubmit={handleProfileUpdate} className="profile-form">
              <div className="form-group">
                <label htmlFor="fullName">Full Name</label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={profileData.fullName}
                  onChange={handleInputChange}
                  required
                  maxLength={100}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={profileData.email}
                  disabled
                  className="form-input disabled"
                />
                <small className="helper-text">Email cannot be changed</small>
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={profileData.phone}
                  onChange={handleInputChange}
                  maxLength={15}
                  placeholder="Optional"
                  className="form-input"
                />
              </div>

              <button
                type="submit"
                disabled={updating}
                className="btn btn-primary"
              >
                {updating ? (
                  <>
                    <span className="spinner-small"></span>
                    Updating...
                  </>
                ) : (
                  'Update Profile'
                )}
              </button>
            </form>
          </section>

          {/* Movie Preferences */}
          <section className="profile-section">
            <div className="section-header">
              <h2>Movie Preferences</h2>
              <p>Update your favorite movie genres to get better recommendations</p>
            </div>

            <div className="preferences-content">
              <GenreSelector
                selectedGenres={selectedGenres}
                onGenresChange={setSelectedGenres}
                title="What movies do you love?"
                subtitle="Select your favorite genres for personalized recommendations"
                minSelections={1}
                maxSelections={8}
                disabled={updating}
              />

              <div className="preferences-actions">
                <button
                  type="button"
                  onClick={handleGenrePreferencesUpdate}
                  disabled={updating || selectedGenres.length === 0}
                  className="btn btn-primary btn-large"
                >
                  {updating ? (
                    <>
                      <span className="spinner-small"></span>
                      Updating Preferences...
                    </>
                  ) : (
                    'Update Movie Preferences'
                  )}
                </button>
              </div>
            </div>
          </section>

          {/* Account Actions */}
          <section className="profile-section">
            <div className="section-header">
              <h2>Account Actions</h2>
              <p>Manage your account</p>
            </div>

            <div className="account-actions">
              <button
                type="button"
                onClick={handleLogout}
                className="btn btn-secondary"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{marginRight: '8px'}}>
                  <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.59L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
                </svg>
                Log Out
              </button>
            </div>
          </section>
        </div>
      </div>

    </div>
  );
};

export default UserProfilePage;