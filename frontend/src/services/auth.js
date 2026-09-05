/**
 * PeoplePay360 Authentication Service Layer
 * Centralizes backend API requests, token persistence, and header management.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const TOKEN_KEY = 'peoplepay360_jwt_token';

/**
 * Retrieves the stored JWT token from localStorage
 */
export function getStoredToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * Stores the JWT token in localStorage
 */
export function setStoredToken(token) {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch (err) {
    console.error('Failed to access localStorage:', err);
  }
}

/**
 * Removes the stored JWT token
 */
export function removeStoredToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch (err) {
    console.error('Failed to clear localStorage:', err);
  }
}

/**
 * Submits user login credentials to the backend
 * POST /api/auth/login
 * @param {Object} credentials - { email, password }
 * @returns {Promise<Object>} { token, user }
 */
export async function loginApi({ email, password }) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email ? email.trim().toLowerCase() : '',
        password: password || '',
      }),
    });
  } catch {
    throw new Error('Network error: Unable to connect to server. Please verify the backend is running.');
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error('Invalid response from server. Please try again.');
  }

  if (!response.ok) {
    const errorMessage = data?.message || data?.error || 'Authentication failed. Please check your credentials.';
    throw new Error(errorMessage);
  }

  return data;
}

/**
 * Retrieves current authenticated user profile
 * GET /api/auth/me
 * @param {string} token - JWT bearer token
 * @returns {Promise<Object>} user profile object
 */
export async function getCurrentUserApi(token) {
  if (!token) {
    throw new Error('No authentication token provided');
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
  } catch {
    throw new Error('Network error: Unable to connect to server.');
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error('Invalid response received from server.');
  }

  if (!response.ok) {
    const errorMessage = data?.message || 'Authentication session has expired or is invalid.';
    const error = new Error(errorMessage);
    error.status = response.status;
    throw error;
  }

  return data.data;
}

export default {
  getStoredToken,
  setStoredToken,
  removeStoredToken,
  loginApi,
  getCurrentUserApi,
};
