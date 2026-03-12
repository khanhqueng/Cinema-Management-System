import { authService } from "../services/authService";

/**
 * Check if user is authenticated and has admin role
 */
export const isAdminUser = (): boolean => {
  return authService.isAuthenticated() && authService.isAdmin();
};

/**
 * Check if user is authenticated and has user role
 */
export const isRegularUser = (): boolean => {
  return authService.isAuthenticated() && authService.isUser();
};

/**
 * Get user info from localStorage
 */
export const getCurrentUser = () => {
  return authService.getCurrentUserFromStorage();
};

/**
 * Get user role
 */
export const getUserRole = (): string | null => {
  return authService.getUserRole();
};

/**
 * Check if user can access admin routes
 */
export const canAccessAdmin = (): boolean => {
  return isAdminUser();
};
