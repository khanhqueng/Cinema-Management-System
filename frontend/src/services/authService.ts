import api from './api';
import { LoginRequest, RegisterRequest, AuthResponse } from '../types';

export const authService = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await api.post('/auth/login', credentials);
    const { token, user } = response.data;

    // Store token in localStorage
    localStorage.setItem('jwt_token', token);

    return { token, user };
  },

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await api.post('/auth/register', userData);
    const { token, user } = response.data;

    // Store token in localStorage
    localStorage.setItem('jwt_token', token);

    return { token, user };
  },

  logout(): void {
    localStorage.removeItem('jwt_token');
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('jwt_token');
  },

  getToken(): string | null {
    return localStorage.getItem('jwt_token');
  },
};