
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import LoadingState from '../common/LoadingState';

const AdminRoute: React.FC = () => {
  const { isAdmin, isLoading } = useIsAdmin();

  if (isLoading) {
    return <LoadingState text="Verificando permissões de administrador..." />;
  }

  if (!isAdmin) {
    return <Navigate to="/home" replace />;
  }

  return <Outlet />;
};

export default AdminRoute;
