
import React, { useEffect } from 'react';
import AdminLayout from '../AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRedemptionsManagement } from '@/hooks/useRedemptionsManagement';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';
import RedemptionTableSkeleton from './RedemptionTableSkeleton';
import RedemptionFilters from './RedemptionFilters';
import RedemptionTable from './RedemptionTable';

const RedemptionsManagementScreen: React.FC = () => {
  const { isAdmin, isLoading: isAdminLoading } = useIsAdmin();
  const {
    filteredRedemptions,
    isLoading,
    error,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    isProcessing,
    loadRedemptions,
    handleApproveRedemption,
    handleRejectRedemption,
    handleMarkAsDelivered
  } = useRedemptionsManagement();
  
  useEffect(() => {
    if (isAdminLoading) {
      return; // Wait for admin status verification
    }
    
    if (!isAdmin) {
      return; // Not authorized
    }
    
    loadRedemptions();
  }, [isAdmin, isAdminLoading, loadRedemptions]);
  
  // If admin status is still loading
  if (isAdminLoading) {
    return (
      <AdminLayout currentSection="Resgates">
        <Card>
          <CardHeader>
            <CardTitle>Gerenciamento de Resgates</CardTitle>
            <CardDescription>Verificando permissões...</CardDescription>
          </CardHeader>
          <CardContent>
            <LoadingState text="Verificando permissões de administrador..." />
          </CardContent>
        </Card>
      </AdminLayout>
    );
  }
  
  // If user is not admin
  if (!isAdmin) {
    return (
      <AdminLayout currentSection="Resgates">
        <Card>
          <CardHeader>
            <CardTitle>Acesso Negado</CardTitle>
            <CardDescription>Você não tem permissões para acessar esta página</CardDescription>
          </CardHeader>
          <CardContent>
            <ErrorState 
              title="Acesso Negado" 
              message="Você não tem permissões de administrador para acessar este módulo."
              onRetry={() => window.location.href = '/profile'}
            />
          </CardContent>
        </Card>
      </AdminLayout>
    );
  }
  
  return (
    <AdminLayout currentSection="Resgates">
      <Card>
        <CardHeader>
          <CardTitle>Gerenciamento de Resgates</CardTitle>
          <CardDescription>
            Visualize e gerencie todos os resgates realizados na plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and filters */}
          <RedemptionFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
          />
          
          {/* Redemptions Table */}
          {isLoading ? (
            <RedemptionTableSkeleton />
          ) : error ? (
            <ErrorState title="Erro" message={error} onRetry={() => loadRedemptions(true)} />
          ) : filteredRedemptions.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500">Nenhum resgate encontrado</p>
            </div>
          ) : (
            <RedemptionTable
              redemptions={filteredRedemptions}
              onApprove={handleApproveRedemption}
              onReject={handleRejectRedemption}
              onMarkAsDelivered={handleMarkAsDelivered}
              isProcessing={isProcessing}
            />
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default RedemptionsManagementScreen;
