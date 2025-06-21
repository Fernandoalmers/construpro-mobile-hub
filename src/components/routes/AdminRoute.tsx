
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useAuth } from '@/context/AuthContext';
import LoadingState from '../common/LoadingState';

const AdminRoute: React.FC = () => {
  const { isAdmin, isLoading } = useIsAdmin();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  console.log('🔐 [AdminRoute] Status:', {
    isAuthenticated,
    isAdmin,
    isLoading,
    authLoading
  });

  if (authLoading || isLoading) {
    return <LoadingState text="Verificando permissões de administrador..." />;
  }

  if (!isAuthenticated) {
    console.log('🔐 [AdminRoute] User not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    console.log('🔐 [AdminRoute] User not admin, redirecting to home');
    return <Navigate to="/home" replace />;
  }

  console.log('🔐 [AdminRoute] Admin access granted');
  return <Outlet />;
};

export default AdminRoute;
