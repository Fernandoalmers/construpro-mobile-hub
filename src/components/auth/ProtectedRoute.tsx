
import React from 'react';
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
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { isAdmin, isLoading: adminCheckLoading } = useIsAdmin();
  const location = useLocation();

  console.log('🔐 [ProtectedRoute] Status:', {
    requireAuth,
    requireAdmin,
    isAuthenticated,
    isAdmin,
    authLoading,
    adminCheckLoading,
    pathname: location.pathname
  });

  // Show loading while auth is loading OR while admin check is loading (if admin is required)
  const isCheckingAuth = authLoading;
  const isCheckingAdmin = requireAdmin && adminCheckLoading;
  const isStillLoading = isCheckingAuth || isCheckingAdmin;

  if (isStillLoading) {
    const loadingText = isCheckingAuth 
      ? "Verificando autenticação..." 
      : "Verificando permissões de administrador...";
    
    console.log('🔐 [ProtectedRoute] Still loading:', { isCheckingAuth, isCheckingAdmin });
    return <LoadingState text={loadingText} />;
  }

  // If authentication is required and user is not authenticated, redirect to login
  if (requireAuth && !isAuthenticated) {
    console.log('🔐 [ProtectedRoute] Auth required but not authenticated, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If admin access is required and user is not an admin, redirect to home
  // Only check this AFTER we're sure admin check is complete (!adminCheckLoading)
  if (requireAdmin && isAuthenticated && !adminCheckLoading && !isAdmin) {
    console.log('🔐 [ProtectedRoute] Admin required but not admin, redirecting to home');
    return <Navigate to="/home" replace />;
  }

  // If user is authenticated and trying to access auth pages, redirect to home
  if (isAuthenticated && ['/login', '/signup'].includes(location.pathname)) {
    console.log('🔐 [ProtectedRoute] Authenticated user accessing auth page, redirecting to home');
    return <Navigate to="/home" replace />;
  }

  console.log('🔐 [ProtectedRoute] Access granted');
  return <>{children}</>;
};

export default ProtectedRoute;
