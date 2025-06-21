
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useAuth } from '@/context/AuthContext';
import LoadingState from '../common/LoadingState';

const AdminRoute: React.FC = () => {
  const { isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();

  console.log('🔐 [AdminRoute] Status:', {
    isAuthenticated,
    isAdmin,
    adminLoading,
    authLoading,
    userId: user?.id,
    userEmail: user?.email
  });

  // Show loading while checking auth or admin status
  const isStillLoading = authLoading || adminLoading;

  if (isStillLoading) {
    const loadingText = authLoading 
      ? "Verificando autenticação..." 
      : "Verificando permissões de administrador...";
    
    console.log('🔐 [AdminRoute] Still loading:', { authLoading, adminLoading });
    return <LoadingState text={loadingText} />;
  }

  if (!isAuthenticated) {
    console.log('🔐 [AdminRoute] User not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    console.log('🔐 [AdminRoute] User not admin, redirecting to home. User:', user?.email);
    return <Navigate to="/home" replace />;
  }

  console.log('🔐 [AdminRoute] Admin access granted for user:', user?.email);
  return <Outlet />;
};

export default AdminRoute;
