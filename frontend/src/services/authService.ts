import api from "./api";
import {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  RegisterResponse,
} from "../types";

export const authService = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await api.post("/auth/login", credentials);
    const { token, user } = response.data;

    // Store token and user info in localStorage
    localStorage.setItem("jwt_token", token);
    localStorage.setItem("user", JSON.stringify(user));

    return { token, user };
  },

  async register(userData: RegisterRequest): Promise<RegisterResponse> {
    // Clean up phone field - send undefined if empty string
    const cleanedData = {
      ...userData,
      phone: userData.phone?.trim() || undefined,
    };

    const response = await api.post("/auth/register", cleanedData);
    const { message, user } = response.data;

    // Registration doesn't return token immediately, user needs to login
    return { message, user };
  },

  logout(): void {
    localStorage.removeItem("jwt_token");
    localStorage.removeItem("user");
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem("jwt_token");
  },

  getToken(): string | null {
    return localStorage.getItem("jwt_token");
  },

  getCurrentUserFromStorage(): any | null {
    const userStr = localStorage.getItem("user");
    if (!userStr) return null;

    try {
      return JSON.parse(userStr);
    } catch (error) {
      console.error("Error parsing user from localStorage:", error);
      return null;
    }
  },

  getUserRole(): string | null {
    const user = this.getCurrentUserFromStorage();
    return user?.role || null;
  },

  isAdmin(): boolean {
    return this.getUserRole() === "ADMIN";
  },

  isUser(): boolean {
    return this.getUserRole() === "USER";
  },

  async checkEmailExists(email: string): Promise<boolean> {
    try {
      const response = await api.get(
        `/auth/check-email?email=${encodeURIComponent(email)}`
      );
      return response.data.exists;
    } catch (error) {
      console.error("Error checking email:", error);
      return false;
    }
  },

  async getAuthStatus(): Promise<boolean> {
    try {
      const response = await api.get("/auth/status");
      return response.data.authenticated;
    } catch (error) {
      return false;
    }
  },

  async getCurrentUser(): Promise<any | null> {
    try {
      if (!this.isAuthenticated()) {
        return null;
      }

      const response = await api.get("/auth/me");
      return response.data;
    } catch (error) {
      console.error("Error getting current user:", error);
      return null;
    }
  },
};
