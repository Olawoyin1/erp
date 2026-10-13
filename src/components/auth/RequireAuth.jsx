import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated, selectBootstrapping } from '../../store/authSlice';

/**
 * Wraps protected routes. Redirects to /auth/login if not authenticated.
 * While the app is bootstrapping (checking the stored token), renders nothing.
 */
export default function RequireAuth({ children }) {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const bootstrapping = useSelector(selectBootstrapping);
  const location = useLocation();

  if (bootstrapping) {
    // Could render a full-page spinner here if desired
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  return children;
}
