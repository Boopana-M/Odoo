import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/authApi';

const AuthContext = createContext(null);

export const DEMO_ACCOUNTS = [
  { role: 'Admin', email: 'admin@peoplepay360.com', password: 'Password123!', label: 'Admin (Full Access)' },
  { role: 'HR Manager', email: 'hrmanager@peoplepay360.com', password: 'Password123!', label: 'HR Manager' },
  { role: 'HR Payroll User', email: 'payrolluser@peoplepay360.com', password: 'Password123!', label: 'Payroll User' },
  { role: 'HR Payroll Manager', email: 'payrollmanager@peoplepay360.com', password: 'Password123!', label: 'Payroll Manager' },
  { role: 'Employee', email: 'john.doe@peoplepay360.com', password: 'Password123!', label: 'Employee (John Doe)' }
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('peoplepay360_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('peoplepay360_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      setToken(null);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const res = await authApi.getMe();
          if (res?.data) {
            setUser(res.data);
            localStorage.setItem('peoplepay360_user', JSON.stringify(res.data));
          }
        } catch (err) {
          console.warn('Session verification failed:', err);
          setUser(null);
          setToken(null);
          localStorage.removeItem('peoplepay360_token');
          localStorage.removeItem('peoplepay360_user');
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [token]);

  const login = async (email, password) => {
    const res = await authApi.login({ email, password });
    if (res?.data) {
      const { token: newToken, user: newUser } = res.data;
      setToken(newToken);
      setUser(newUser);
      localStorage.setItem('peoplepay360_token', newToken);
      localStorage.setItem('peoplepay360_user', JSON.stringify(newUser));
      return newUser;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('peoplepay360_token');
    localStorage.removeItem('peoplepay360_user');
  };

  const role = user?.role || null;
  const isAdmin = role === 'Admin';
  const isHRManager = role === 'Admin' || role === 'HR Manager';
  const isPayrollUser = role === 'Admin' || role === 'HR Payroll Manager' || role === 'HR Payroll User';
  const isPayrollManager = role === 'Admin' || role === 'HR Payroll Manager';
  const isEmployeeOnly = role === 'Employee';

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token && !!user,
    role,
    isAdmin,
    isHRManager,
    isPayrollUser,
    isPayrollManager,
    isEmployeeOnly,
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
