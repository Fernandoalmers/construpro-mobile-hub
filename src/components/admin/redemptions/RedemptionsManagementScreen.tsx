
import React, { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import RedemptionFilters from './RedemptionFilters';
import RedemptionTable from './RedemptionTable';
import RedemptionTableSkeleton from './RedemptionTableSkeleton';
import { useTitle } from '@/hooks/use-title';
import { useRedemptionsData, Redemption } from '@/hooks/useRedemptionsData';
import { supabase } from '@/integrations/supabase/client';

const RedemptionsManagementScreen: React.FC = () => {
  useTitle('ConstruPro Admin - Resgates');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  const { redemptions, isLoading, error, refetch } = useRedemptionsData({ 
    status: statusFilter === 'all' ? undefined : statusFilter 
  });
  
  // Filter redemptions based on search term
  const filteredRedemptions = redemptions.filter((redemption: Redemption) =>
    !searchTerm || 
    redemption.cliente_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    redemption.item?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    redemption.cliente_email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleApprove = async (redemptionId: string) => {
    try {
      const { error } = await supabase
        .from('resgates')
        .update({ 
          status: 'aprovado', 
          updated_at: new Date().toISOString() 
        })
        .eq('id', redemptionId);
      
      if (error) throw error;
      
      // Refetch data
      refetch();
    } catch (error) {
      console.error('Error approving redemption:', error);
    }
  };

  const handleReject = async (redemptionId: string) => {
    try {
      const { error } = await supabase
        .from('resgates')
        .update({ 
          status: 'recusado', 
          updated_at: new Date().toISOString() 
        })
        .eq('id', redemptionId);
      
      if (error) throw error;
      
      // Refetch data
      refetch();
    } catch (error) {
      console.error('Error rejecting redemption:', error);
    }
  };

  const handleMarkDelivered = async (redemptionId: string) => {
    try {
      const { error } = await supabase
        .from('resgates')
        .update({ 
          status: 'entregue', 
          updated_at: new Date().toISOString() 
        })
        .eq('id', redemptionId);
      
      if (error) throw error;
      
      // Refetch data
      refetch();
    } catch (error) {
      console.error('Error marking redemption as delivered:', error);
    }
  };
  
  return (
    <AdminLayout currentSection="resgates">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Gerenciar Resgates</h1>
        
        <RedemptionFilters 
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />
        
        {isLoading ? (
          <RedemptionTableSkeleton />
        ) : error ? (
          <div className="p-4 text-center">
            <p className="text-red-500">Erro ao carregar resgates: {error}</p>
            <button 
              onClick={() => refetch()}
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
            >
              Tentar novamente
            </button>
          </div>
        ) : (
          <RedemptionTable 
            redemptions={filteredRedemptions}
            onApprove={handleApprove}
            onReject={handleReject}
            onMarkDelivered={handleMarkDelivered}
          />
        )}
      </div>
    </AdminLayout>
  );
};

export default RedemptionsManagementScreen;
