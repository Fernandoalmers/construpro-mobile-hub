
import React from 'react';
import AdminLayout from '../AdminLayout';
import DashboardStats from './DashboardStats';
import PendingItemsSection from './PendingItemsSection';
import ActivityLogs from './ActivityLogs';
import { useDashboardData } from './useDashboardData';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';
import { useIsAdmin } from '@/hooks/useIsAdmin';

const AdminDashboard: React.FC = () => {
  const { isAdmin, isLoading: isAdminLoading } = useIsAdmin();
  const { loading, error } = useDashboardData();
  
  // If admin status is still loading
  if (isAdminLoading) {
    return (
      <AdminLayout currentSection="Dashboard">
        <LoadingState text="Verificando permissões de administrador..." />
      </AdminLayout>
    );
  }
  
  // If user is not an admin
  if (!isAdmin) {
    return (
      <AdminLayout currentSection="Dashboard">
        <ErrorState 
          title="Acesso Negado" 
          message="Você não tem permissões de administrador para acessar este painel."
          onRetry={() => window.location.href = '/profile'}
        />
      </AdminLayout>
    );
  }

  // If there's an error loading the stats
  if (error) {
    return (
      <AdminLayout currentSection="Dashboard">
        <ErrorState 
          title="Erro ao carregar o painel administrativo" 
          message={error}
          onRetry={() => window.location.reload()}
        />
      </AdminLayout>
    );
  }

  // If data is still loading
  if (loading) {
    return (
      <AdminLayout currentSection="Dashboard">
        <LoadingState text="Carregando estatísticas administrativas..." />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout currentSection="Dashboard">
      <div className="space-y-6">
        {/* Stats Grid */}
        <DashboardStats />
        
        {/* Pending Items Section */}
        <PendingItemsSection />
        
        {/* Activity Logs */}
        <ActivityLogs />
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
