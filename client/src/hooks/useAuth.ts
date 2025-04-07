import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

// Define types
interface User {
  id: number;
  username: string;
  email: string;
  name: string;
  role: string;
}

interface LoginCredentials {
  username: string;
  password: string;
}

interface RegisterData extends LoginCredentials {
  email: string;
  name: string;
}

interface AuthResponse {
  user: User;
  token: string;
  message: string;
}

// Token storage keys
const TOKEN_KEY = 'family_app_token';
const USER_KEY = 'family_app_user';

/**
 * Custom hook for authentication state and methods
 */
export default function useAuth() {
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem(USER_KEY);
    return storedUser ? JSON.parse(storedUser) : null;
  });

  // Get current user data from API using the updated query client
  const { data: currentUser, refetch } = useQuery({
    queryKey: ['/api/auth/me'],
    enabled: !!token, // Only run if token exists
    retry: false,
  });
  
  // Update user when data refreshes
  useEffect(() => {
    if (currentUser) {
      setUser(currentUser);
      localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
    }
  }, [currentUser]);
  
  // Handle errors and cleanup
  useEffect(() => {
    if (!token) {
      setUser(null);
    }
  }, [token]);

  // Login function
  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }

      const data: AuthResponse = await response.json();
      
      // Store token and user
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      
      setToken(data.token);
      setUser(data.user);
      
      // Invalidate relevant queries
      queryClient.invalidateQueries();
      
      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }, [queryClient]);

  // Register function
  const register = useCallback(async (data: RegisterData) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Registration failed');
      }

      const authData: AuthResponse = await response.json();
      
      // Store token and user
      localStorage.setItem(TOKEN_KEY, authData.token);
      localStorage.setItem(USER_KEY, JSON.stringify(authData.user));
      
      setToken(authData.token);
      setUser(authData.user);
      
      return authData;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }, []);

  // Logout function
  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
    queryClient.clear(); // Clear all query cache
  }, [queryClient]);

  // Returns authorization header for API requests
  const getAuthHeader = useCallback(() => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, [token]);

  return {
    user,
    token,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    getAuthHeader,
    refreshUser: refetch,
  };
}

// Export interfaces for use in other files
export type { User, LoginCredentials, RegisterData, AuthResponse };