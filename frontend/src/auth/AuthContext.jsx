import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  getStoredToken,
  setStoredToken,
  removeStoredToken,
  loginApi,
  getCurrentUserApi,
} from '../services/auth';

const AuthContext = createContext(null);

/**
 * Authentication Provider Component
 * Manages JWT storage, session restoration, and authenticated user state.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Restores user session on initial app mount
   */
  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      const storedToken = getStoredToken();
      if (!storedToken) {
        if (isMounted) {
          setIsLoading(false);
        }
        return;
      }

      try {
        const userData = await getCurrentUserApi(storedToken);
        if (isMounted) {
          setUser(userData);
          setToken(storedToken);
          setError(null);
        }
      } catch {
        if (isMounted) {
          // Token is expired, invalid, or server rejected it
          removeStoredToken();
          setUser(null);
          setToken(null);
          setError(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  /**
   * Submits login credentials and establishes an authenticated session
   * @param {string} email
   * @param {string} password
   */
  const login = useCallback(async (email, password) => {
    setError(null);
    try {
      const response = await loginApi({ email, password });
      const receivedToken = response?.data?.token;

      if (!receivedToken) {
        throw new Error('No authentication token returned by server.');
      }

      // Persist token
      setStoredToken(receivedToken);
      setToken(receivedToken);

      // Retrieve full current user profile
      const userData = await getCurrentUserApi(receivedToken);
      setUser(userData);
      return userData;
    } catch (err) {
      setError(err.message || 'Login failed. Please verify credentials.');
      throw err;
    }
  }, []);

  /**
   * Logs out the current user, clears stored JWT, and resets state
   */
  const logout = useCallback(() => {
    removeStoredToken();
    setUser(null);
    setToken(null);
    setError(null);
  }, []);

  const value = {
    user,
    token,
    role: user?.role || null,
    isAuthenticated: Boolean(user && token),
    isLoading,
    error,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Custom hook to access authentication context
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
