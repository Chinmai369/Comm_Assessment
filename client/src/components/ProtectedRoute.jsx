import React from 'react';
import { Navigate } from 'react-router-dom';
import { isLoggedIn, getUserRole } from '../utils/auth';

/**
 * ProtectedRoute component - protects routes based on authentication and role
 * @param {object} props
 * @param {React.ReactNode} props.children - Component to render if authorized
 * @param {string[]} props.allowedRoles - Array of allowed roles (e.g., ['admin', 'engineer'])
 * @returns {React.ReactNode} Either the protected component or redirect to login
 */
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const loggedIn = isLoggedIn();
  const userRole = getUserRole();

  // If not logged in, redirect to login
  if (!loggedIn) {
    return <Navigate to="/login" replace />;
  }

  // If roles are specified, check if user role is allowed
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    // User is logged in but doesn't have the required role
    // Redirect based on their role
    if (userRole === 'commissioner') {
      return <Navigate to="/quiz" replace />;
    } else if (userRole === 'admin' || userRole === 'engineer') {
      return <Navigate to="/admin" replace />;
    }
    // Fallback to login if role is unknown
    return <Navigate to="/login" replace />;
  }

  // User is authorized, render the protected component
  return children;
};

export default ProtectedRoute;

