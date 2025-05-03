
import React, { useEffect, useState } from 'react';
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
  const { isAuthenticated, isLoading, profile, getProfile } = useAuth();
  const [profileLoading, setProfileLoading] = useState(false);
  const location = useLocation();

  // Additional profile loading check - ensures profile is loaded for authenticated users
  useEffect(() => {
    const loadProfile = async () => {
      if (isAuthenticated && !profile) {
        setProfileLoading(true);
        await getProfile();
        setProfileLoading(false);
      }
    };
    
    loadProfile();
  }, [isAuthenticated, profile, getProfile]);

  // Show loading while checking authentication or loading profile
  if (isLoading || profileLoading) {
    return <LoadingState text="Verificando autenticação..." />;
  }

  // If authentication is required and user is not authenticated, redirect to login
  if (requireAuth && !isAuthenticated) {
    console.log("Auth required but user not authenticated. Redirecting to login from:", location.pathname);
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If admin access is required and user is not an admin, redirect to home
  if (requireAdmin && (!profile?.is_admin)) {
    return <Navigate to="/home" replace />;
  }

  // If user is authenticated and trying to access auth pages, redirect to home
  if (isAuthenticated && ['/login', '/signup'].includes(location.pathname)) {
    return <Navigate to="/home" replace />;
  }

  // Special case: allow authenticated users to access onboarding
  if (isAuthenticated && location.pathname === '/onboarding') {
    return <>{children}</>;
  }
  
  // Special case: if user is authenticated but has no role selected, direct to profile selection
  if (isAuthenticated && profile && !profile.papel && !location.pathname.includes('/auth/profile-selection')) {
    console.log("User has no role, redirecting to profile selection");
    return <Navigate to="/auth/profile-selection" replace />;
  }

  // Render children if all conditions are met
  return <>{children}</>;
};

export default ProtectedRoute;
