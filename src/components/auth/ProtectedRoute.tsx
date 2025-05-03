
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingState from '../common/LoadingState';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAuth = true,
  requireAdmin = false
}) => {
  const { isAuthenticated, isLoading, profile } = useAuth();
  const location = useLocation();

  // Show loading while checking authentication
  if (isLoading) {
    return <LoadingState text="Verificando autenticação..." />;
  }

  // If authentication is required and user is not authenticated, redirect to login
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If admin access is required and user is not an admin, redirect to home
  if (requireAdmin && (!profile?.is_admin)) {
    return <Navigate to="/home" replace />;
  }

  // If user is authenticated and trying to access auth pages, redirect to home
  if (isAuthenticated && ['/login', '/signup', '/onboarding'].includes(location.pathname)) {
    return <Navigate to="/home" replace />;
  }

  // Render children if all conditions are met
  return <>{children}</>;
};

export default ProtectedRoute;
