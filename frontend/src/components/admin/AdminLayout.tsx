import React from "react";
import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import {
  Film,
  LayoutDashboard,
  Clapperboard,
  Building2,
  Clock,
  LogOut,
  CircleUserRound,
} from "lucide-react";
import { authService } from "../../services/authService";

const navItems = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/movies", label: "Movies", icon: Clapperboard, exact: false },
  { to: "/admin/theaters", label: "Theaters", icon: Building2, exact: false },
  { to: "/admin/showtimes", label: "Showtimes", icon: Clock, exact: false },
];

const AdminLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUserFromStorage();

  const handleLogout = () => {
    authService.logout();
    navigate("/login");
  };

  const isActive = (to: string, exact: boolean) =>
    exact ? location.pathname === to : location.pathname.startsWith(to);

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Admin Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="sticky top-0 z-50 bg-gray-950/95 backdrop-blur-md border-b border-gray-800"
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/admin" className="flex items-center space-x-2 group">
              <div className="bg-linear-to-r from-red-600 to-red-500 p-2 rounded-lg group-hover:shadow-lg group-hover:shadow-red-500/50 transition-all">
                <Film className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-base font-bold bg-linear-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
                  CineMax
                </span>
                <span className="text-[10px] text-gray-500 font-medium tracking-widest uppercase">
                  Admin Panel
                </span>
              </div>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              {navItems.map(({ to, label, icon: Icon, exact }) => {
                const active = isActive(to, exact);
                return (
                  <Link
                    key={to}
                    to={to}
                    className={`relative flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? "text-white bg-gray-800"
                        : "text-gray-400 hover:text-white hover:bg-gray-800/60"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{label}</span>
                    {active && (
                      <motion.div
                        layoutId="adminActiveNav"
                        className="absolute bottom-0 left-2 right-2 h-0.5 bg-linear-to-r from-red-600 to-red-500 rounded-full"
                        transition={{
                          type: "spring",
                          stiffness: 380,
                          damping: 30,
                        }}
                      />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Right section */}
            <div className="flex items-center space-x-3">
              {/* Admin badge */}
              <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-red-600/15 text-red-400 border border-red-500/20">
                ADMIN
              </span>

              {/* Profile */}
              <Link
                to="/admin/profile"
                className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors text-sm text-gray-200"
                title={currentUser?.fullName || currentUser?.email || "Admin"}
              >
                <CircleUserRound className="w-4 h-4 text-red-400 shrink-0" />
                <span className="hidden sm:inline max-w-28 truncate">
                  {currentUser?.fullName || currentUser?.email || "Admin"}
                </span>
              </Link>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-800 hover:bg-red-600 transition-colors text-sm text-gray-300 hover:text-white"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Admin Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-4">
        <p className="text-center text-xs text-gray-600">
          © {new Date().getFullYear()} CineMax — Admin Panel
        </p>
      </footer>
    </div>
  );
};

export default AdminLayout;
