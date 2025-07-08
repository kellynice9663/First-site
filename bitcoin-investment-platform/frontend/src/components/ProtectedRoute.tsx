import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Box, CircularProgress } from '@mui/material';

interface ProtectedRouteProps {
  allowedRoles?: string[]; // Optional: For role-based access control
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { user, token, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    // Show a loading spinner while checking auth status
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!token || !user) {
    // User not logged in, redirect to login page
    // Pass the current location so we can redirect back after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // User role not allowed for this route, redirect to an unauthorized page or dashboard
    // For simplicity, redirecting to dashboard. A dedicated "Unauthorized" page is better.
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />; // User is authenticated and authorized, render the child route
};

export default ProtectedRoute;
