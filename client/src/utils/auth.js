// Auth utility functions for managing JWT tokens and user data

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

/**
 * Get the stored JWT token
 * @returns {string|null} The JWT token or null if not found
 */
export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

/**
 * Get the stored user object
 * @returns {object|null} The user object or null if not found
 */
export const getUser = () => {
  const userStr = localStorage.getItem(USER_KEY);
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch (error) {
    return null;
  }
};

/**
 * Store token and user data after successful login
 * @param {string} token - JWT token
 * @param {object} user - User object
 */
export const setAuth = (token, user) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

/**
 * Remove token and user data (logout)
 */
export const logout = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

/**
 * Check if user is logged in
 * @returns {boolean} True if token exists, false otherwise
 */
export const isLoggedIn = () => {
  return !!getToken();
};

/**
 * Get user role
 * @returns {string|null} User role or null if not logged in
 */
export const getUserRole = () => {
  const user = getUser();
  return user ? user.role : null;
};

