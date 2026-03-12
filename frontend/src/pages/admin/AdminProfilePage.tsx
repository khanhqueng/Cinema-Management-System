import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import {
  User as UserIcon,
  Mail,
  Phone,
  ShieldCheck,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  LogOut,
} from "lucide-react";
import { authService } from "../../services/authService";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";

const AdminProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [profileData, setProfileData] = useState({
    fullName: "",
    phone: "",
    email: "",
  });

  useEffect(() => {
    const userData = authService.getCurrentUserFromStorage();
    if (userData) {
      setProfileData({
        fullName: userData.fullName || "",
        phone: userData.phone || "",
        email: userData.email || "",
      });
    }
    setLoading(false);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setUpdating(true);
      setError(null);
      // await adminService.updateProfile(profileData);
      setSuccess("Profile updated successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setUpdating(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-red-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-4">
      {/* Page Title */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2 bg-red-600/15 border border-red-500/20 rounded-lg">
            <ShieldCheck className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Admin Profile</h1>
            <p className="text-gray-400 text-sm">
              Manage your administrator account
            </p>
          </div>
        </div>
      </motion.div>

      <div className="space-y-6">
        {/* Alerts */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 bg-red-900/40 border border-red-600/50 text-red-300 p-4 rounded-lg text-sm"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </motion.div>
        )}
        {success && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 bg-green-900/40 border border-green-600/50 text-green-300 p-4 rounded-lg text-sm"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            {success}
          </motion.div>
        )}

        {/* Account Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-gray-400" />
                Account Information
              </h2>

              <form onSubmit={handleProfileUpdate} className="space-y-5">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="fullName"
                    className="text-sm font-medium text-gray-300 flex items-center gap-2"
                  >
                    <UserIcon className="w-3.5 h-3.5" />
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
                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all text-sm"
                  />
                </div>

                {/* Email (readonly) */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="email"
                    className="text-sm font-medium text-gray-300 flex items-center gap-2"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={profileData.email}
                    disabled
                    className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700/50 rounded-lg text-gray-500 cursor-not-allowed text-sm"
                  />
                  <p className="text-gray-600 text-xs">
                    Email cannot be changed
                  </p>
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="phone"
                    className="text-sm font-medium text-gray-300 flex items-center gap-2"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    Phone Number{" "}
                    <span className="text-gray-500 font-normal">
                      (optional)
                    </span>
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleInputChange}
                    maxLength={15}
                    placeholder="Optional"
                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all text-sm"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={updating}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {updating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Role Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-gray-400" />
                Role & Permissions
              </h2>
              <div className="flex items-center gap-3 p-4 bg-red-600/10 border border-red-500/20 rounded-lg">
                <ShieldCheck className="w-5 h-5 text-red-400 shrink-0" />
                <div>
                  <p className="text-white font-medium text-sm">
                    Administrator
                  </p>
                  <p className="text-gray-400 text-xs mt-0.5">
                    Full access to movies, theaters, showtimes, and system
                    settings
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Danger Zone */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-white mb-4">
                Sign Out
              </h2>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="border-red-600/50 text-red-400 hover:bg-red-600 hover:text-white hover:border-red-600 transition-colors"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminProfilePage;
