
import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import RedemptionFilters from './RedemptionFilters';
import RedemptionTable from './RedemptionTable';
import RedemptionTableSkeleton from './RedemptionTableSkeleton';
import { useTitle } from '@/hooks/use-title';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { AdminRedemption } from '@/types/admin';

const RedemptionsManagementScreen: React.FC = () => {
  useTitle('ConstruPro Admin - Resgates');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [redemptions, setRedemptions] = useState<AdminRedemption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const fetchRedemptions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      let query = supabase
        .from('resgates')
        .select('*');
      
      // Apply status filter if not 'all'
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      
      // Order by creation date, newest first
      query = query.order('created_at', { ascending: false });
      
      const { data: redemptionData, error: redemptionError } = await query;
      
      if (redemptionError) {
        throw redemptionError;
      }

      // Fetch client profiles separately to get names and emails
      const clientIds = (redemptionData || [])
        .filter(item => item.cliente_id)
        .map(item => item.cliente_id);

      let clientProfiles: Record<string, { nome?: string; email?: string }> = {};
      
      if (clientIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, nome, email')
          .in('id', clientIds);

        if (!profilesError && profilesData) {
          clientProfiles = profilesData.reduce((acc, profile) => {
            acc[profile.id] = { nome: profile.nome, email: profile.email };
            return acc;
          }, {} as Record<string, { nome?: string; email?: string }>);
        }
      }
      
      // Transform the data to include cliente_nome and cliente_email
      const transformedData: AdminRedemption[] = (redemptionData || []).map(item => {
        const clientProfile = clientProfiles[item.cliente_id] || {};
        
        return {
          id: item.id,
          cliente_id: item.cliente_id,
          cliente_nome: clientProfile.nome || 'Cliente desconhecido',
          cliente_email: clientProfile.email || 'Email não disponível',
          item: item.item,
          pontos: item.pontos,
          imagem_url: item.imagem_url || '',
          codigo: item.codigo || null,
          status: item.status as "recusado" | "pendente" | "aprovado" | "entregue",
          data: item.data || item.created_at,
          created_at: item.created_at,
          updated_at: item.updated_at || item.created_at
        };
      });
      
      setRedemptions(transformedData);
    } catch (err: any) {
      console.error('Error fetching redemptions:', err);
      setError(err.message || 'Erro ao carregar resgates');
      toast.error('Falha ao carregar resgates');
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchRedemptions();
    
    // Set up realtime subscription for redemptions
    const channel = supabase
      .channel('redemptions_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'resgates' 
        }, 
        () => {
          fetchRedemptions();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [statusFilter]);
  
  // Filter redemptions based on search term
  const filteredRedemptions = redemptions.filter((redemption) =>
    !searchTerm || 
    redemption.cliente_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    redemption.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
    redemption.cliente_email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleApprove = async (redemptionId: string) => {
    try {
      setIsProcessing(true);
      const { error } = await supabase
        .from('resgates')
        .update({ 
          status: 'aprovado', 
          updated_at: new Date().toISOString() 
        })
        .eq('id', redemptionId);
      
      if (error) throw error;
      
      toast.success('Resgate aprovado com sucesso');
      // Refetch data
      fetchRedemptions();
    } catch (error) {
      console.error('Error approving redemption:', error);
      toast.error('Erro ao aprovar resgate');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (redemptionId: string) => {
    try {
      setIsProcessing(true);
      const { error } = await supabase
        .from('resgates')
        .update({ 
          status: 'recusado', 
          updated_at: new Date().toISOString() 
        })
        .eq('id', redemptionId);
      
      if (error) throw error;
      
      toast.success('Resgate recusado com sucesso');
      // Refetch data
      fetchRedemptions();
    } catch (error) {
      console.error('Error rejecting redemption:', error);
      toast.error('Erro ao recusar resgate');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMarkAsDelivered = async (redemptionId: string) => {
    try {
      setIsProcessing(true);
      const { error } = await supabase
        .from('resgates')
        .update({ 
          status: 'entregue', 
          updated_at: new Date().toISOString() 
        })
        .eq('id', redemptionId);
      
      if (error) throw error;
      
      toast.success('Resgate marcado como entregue');
      // Refetch data
      fetchRedemptions();
    } catch (error) {
      console.error('Error marking redemption as delivered:', error);
      toast.error('Erro ao marcar resgate como entregue');
    } finally {
      setIsProcessing(false);
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
              onClick={() => fetchRedemptions()}
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
            onMarkAsDelivered={handleMarkAsDelivered}
            isProcessing={isProcessing}
          />
        )}
      </div>
    </AdminLayout>
  );
};

export default RedemptionsManagementScreen;
