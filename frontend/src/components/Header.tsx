import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Film,
  User,
  LayoutDashboard,
  LogOut,
  CircleUserRound,
} from "lucide-react";
import { motion } from "motion/react";
import { authService } from "../services/authService";

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const isAdmin = location.pathname.startsWith("/admin");

  const [isAuthenticated, setIsAuthenticated] = useState(
    authService.isAuthenticated(),
  );
  const [isAdminRole, setIsAdminRole] = useState(authService.isAdmin());
  const [currentUser, setCurrentUser] = useState(
    authService.getCurrentUserFromStorage(),
  );

  // Re-check auth on every route change (catches login / logout)
  useEffect(() => {
    setIsAuthenticated(authService.isAuthenticated());
    setIsAdminRole(authService.isAdmin());
    setCurrentUser(authService.getCurrentUserFromStorage());
  }, [location]);

  const handleLogout = () => {
    authService.logout();
    navigate("/login");
  };

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 bg-gray-950/95 backdrop-blur-md border-b border-gray-800"
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="bg-linear-to-r from-red-600 to-red-500 p-2 rounded-lg group-hover:shadow-lg group-hover:shadow-red-500/50 transition-all">
              <Film className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-linear-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
              CineMax
            </span>
          </Link>

          {/* Navigation — only show when authenticated */}
          {isAuthenticated && !isAdmin && (
            <nav className="hidden md:flex items-center space-x-8">
              <NavLink to="/" active={location.pathname === "/"}>
                Home
              </NavLink>
              <NavLink to="/movies" active={location.pathname === "/movies"}>
                Movies
              </NavLink>
              <NavLink
                to="/showtimes"
                active={location.pathname === "/showtimes"}
              >
                Showtimes
              </NavLink>
              <NavLink
                to="/recommendations"
                active={location.pathname === "/recommendations"}
              >
                For You
              </NavLink>
              <NavLink
                to="/bookings"
                active={location.pathname === "/bookings"}
              >
                <span className="flex items-center gap-1">My Bookings</span>
              </NavLink>
            </nav>
          )}

          {!isAuthenticated && (
            <nav className="hidden md:flex items-center space-x-8">
              <NavLink to="/movies" active={location.pathname === "/movies"}>
                Movies
              </NavLink>
              <NavLink
                to="/showtimes"
                active={location.pathname === "/showtimes"}
              >
                Showtimes
              </NavLink>
            </nav>
          )}

          {isAdmin && (
            <nav className="hidden md:flex items-center space-x-8">
              <NavLink to="/admin" active={location.pathname === "/admin"}>
                Dashboard
              </NavLink>
              <NavLink
                to="/admin/movies"
                active={location.pathname === "/admin/movies"}
              >
                Manage Movies
              </NavLink>
              <NavLink
                to="/admin/showtimes"
                active={location.pathname === "/admin/showtimes"}
              >
                Manage Showtimes
              </NavLink>
            </nav>
          )}

          {/* Actions */}
          <div className="flex items-center space-x-3">
            {isAuthenticated ? (
              <>
                {/* Show Admin button only to admin users when in user view */}
                {isAdminRole && !isAdmin && (
                  <Link
                    to="/admin"
                    className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors text-sm"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span className="hidden sm:inline">Admin</span>
                  </Link>
                )}

                {/* Show User View button when in admin view */}
                {isAdmin && (
                  <Link
                    to="/"
                    className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors text-sm"
                  >
                    <Film className="w-4 h-4" />
                    <span className="hidden sm:inline">User View</span>
                  </Link>
                )}

                {/* Profile link */}
                <Link
                  to="/profile"
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors text-sm"
                  title={
                    currentUser?.fullName || currentUser?.email || "Profile"
                  }
                >
                  <CircleUserRound className="w-4 h-4 text-red-400" />
                  <span className="hidden sm:inline text-gray-200 max-w-25 truncate">
                    {currentUser?.fullName || currentUser?.email || "Profile"}
                  </span>
                </Link>

                {/* Logout button */}
                <button
                  onClick={handleLogout}
                  className="flex items-center flex-nowrap min-w-0 space-x-2 px-4 py-2 rounded-lg bg-gray-800 hover:bg-red-600 transition-colors text-sm"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4 shrink-0" />
                  <span className="hidden sm:inline truncate max-w-20">
                    Sign Out
                  </span>
                </button>
              </>
            ) : (
              /* Guest actions */
              <div className="flex items-center space-x-2">
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
                >
                  Register
                </Link>
                <Link
                  to="/login"
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-linear-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 transition-all text-sm font-medium text-white"
                >
                  <User className="w-4 h-4" />
                  <span>Sign In</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.header>
  );
}

interface NavLinkProps {
  to: string;
  active: boolean;
  children: React.ReactNode;
}

function NavLink({ to, active, children }: NavLinkProps) {
  return (
    <Link
      to={to}
      className={`relative text-sm font-medium transition-colors ${
        active ? "text-red-500" : "text-gray-300 hover:text-white"
      }`}
    >
      {children}
      {active && (
        <motion.div
          layoutId="activeNav"
          className="absolute -bottom-6 left-0 right-0 h-0.5 bg-linear-to-r from-red-600 to-red-500"
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
        />
      )}
    </Link>
  );
}
