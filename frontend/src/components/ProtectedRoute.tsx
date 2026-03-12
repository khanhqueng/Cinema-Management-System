import React from "react";
import { Navigate } from "react-router-dom";
import { authService } from "../services/authService";

interface ProtectedRouteProps {
  children: React.ReactElement;
  requiredRole?: "ADMIN" | "USER";
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
}) => {
  const isAuthenticated = authService.isAuthenticated();
  const userRole = authService.getUserRole();

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If role is required and user doesn't have it, redirect
  if (requiredRole && userRole !== requiredRole) {
    // If trying to access admin route but not admin, redirect to home
    if (requiredRole === "ADMIN") {
      return <Navigate to="/" replace />;
    }
    // If trying to access user-only route but is admin, could allow or redirect
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
