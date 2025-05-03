
import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useIsAdmin } from '@/hooks/useIsAdmin';
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
  const { isAuthenticated, isLoading, profile, refreshProfile } = useAuth();
  const { isAdmin, isLoading: adminCheckLoading } = useIsAdmin();
  const [profileLoading, setProfileLoading] = useState(false);
  const location = useLocation();

  // Additional profile loading check - ensures profile is loaded for authenticated users
  useEffect(() => {
    const loadProfile = async () => {
      if (isAuthenticated && !profile && !isLoading) {
        console.log("ProtectedRoute: Loading profile for authenticated user");
        setProfileLoading(true);
        try {
          await refreshProfile();
        } catch (error) {
          console.error("Error loading profile in ProtectedRoute:", error);
        } finally {
          setProfileLoading(false);
        }
      }
    };
    
    loadProfile();
  }, [isAuthenticated, profile, refreshProfile, isLoading]);

  // Show debug logging
  useEffect(() => {
    console.log("ProtectedRoute state:", {
      path: location.pathname,
      isAuthenticated,
      isLoading,
      profileLoading,
      requireAuth,
      requireAdmin,
      profile: profile?.papel,
      adminCheckLoading,
      isAdmin
    });
  }, [location.pathname, isAuthenticated, isLoading, profileLoading, requireAuth, requireAdmin, profile, adminCheckLoading, isAdmin]);

  // Only show loading when data is actually being fetched
  if (isLoading || profileLoading || (requireAdmin && adminCheckLoading)) {
    console.log("ProtectedRoute: Showing loading state for:", location.pathname);
    return <LoadingState text="Verificando autenticação..." />;
  }

  // If authentication is required and user is not authenticated, redirect to login
  if (requireAuth && !isAuthenticated) {
    console.log("Auth required but user not authenticated. Redirecting to login from:", location.pathname);
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If admin access is required and user is not an admin, redirect to home
  if (requireAdmin && !isAdmin) {
    console.log("Admin required but user is not admin. Redirecting to home from:", location.pathname);
    return <Navigate to="/home" replace />;
  }

  // If user is authenticated and trying to access auth pages, redirect to home
  if (isAuthenticated && ['/login', '/signup', '/auth/login', '/auth/signup'].includes(location.pathname)) {
    console.log("User is authenticated. Redirecting from auth page to home");
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
  console.log("ProtectedRoute: Rendering children for:", location.pathname);
  return <>{children}</>;
};

export default ProtectedRoute;
