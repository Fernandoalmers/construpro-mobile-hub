import { useState, useCallback, useMemo, useRef } from 'react';
import { 
  fetchRedemptions, 
  approveRedemption, 
  rejectRedemption, 
  markRedemptionAsDelivered,
  AdminRedemption
} from '@/services/admin/redemptions';
import { toast } from '@/components/ui/sonner';

export const useRedemptionsManagement = () => {
  const [redemptions, setRedemptions] = useState<AdminRedemption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedRedemptionId, setSelectedRedemptionId] = useState<string | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const loadingRef = useRef(false); // To prevent multiple simultaneous load requests

  const loadRedemptions = useCallback(async (forceRefresh = false) => {
    // Prevent multiple simultaneous calls
    if (loadingRef.current && !forceRefresh) return;
    
    try {
      loadingRef.current = true;
      setIsLoading(true);
      setError(null);
      const redemptionsData = await fetchRedemptions(forceRefresh);
      setRedemptions(redemptionsData);
    } catch (err) {
      console.error("Error loading redemptions:", err);
      setError('Falha ao carregar resgates. Por favor, tente novamente.');
      toast.error('Erro ao carregar resgates');
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  }, []);

  const filteredRedemptions = useMemo(() => {
    return redemptions.filter(redemption => {
      const matchesSearch = 
        !searchTerm || 
        redemption.cliente_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        redemption.item.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || redemption.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [redemptions, searchTerm, statusFilter]);

  const handleApproveRedemption = useCallback(async (redemptionId: string) => {
    if (isProcessing) return;
    
    try {
      setIsProcessing(true);
      const success = await approveRedemption(redemptionId);
      
      if (success) {
        setRedemptions(prevRedemptions =>
          prevRedemptions.map(redemption =>
            redemption.id === redemptionId ? { ...redemption, status: 'aprovado' } : redemption
          )
        );
        toast.success('Resgate aprovado com sucesso');
      }
    } catch (error) {
      console.error('Error approving redemption:', error);
      toast.error('Erro ao aprovar resgate');
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing]);
  
  const handleRejectRedemption = useCallback(async (redemptionId: string) => {
    if (isProcessing) return;
    
    try {
      setIsProcessing(true);
      const success = await rejectRedemption(redemptionId);
      
      if (success) {
        setRedemptions(prevRedemptions =>
          prevRedemptions.map(redemption =>
            redemption.id === redemptionId ? { ...redemption, status: 'recusado' } : redemption
          )
        );
        toast.success('Resgate recusado com sucesso');
      }
    } catch (error) {
      console.error('Error rejecting redemption:', error);
      toast.error('Erro ao recusar resgate');
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing]);
  
  const handleMarkAsDelivered = useCallback(async (redemptionId: string) => {
    if (isProcessing) return;
    
    try {
      setIsProcessing(true);
      const success = await markRedemptionAsDelivered(redemptionId);
      
      if (success) {
        setRedemptions(prevRedemptions =>
          prevRedemptions.map(redemption =>
            redemption.id === redemptionId ? { ...redemption, status: 'entregue' } : redemption
          )
        );
        toast.success('Resgate marcado como entregue com sucesso');
      }
    } catch (error) {
      console.error('Error marking redemption as delivered:', error);
      toast.error('Erro ao marcar resgate como entregue');
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing]);
  
  const handleViewDetails = useCallback((redemptionId: string) => {
    setSelectedRedemptionId(redemptionId);
    setDetailsDialogOpen(true);
  }, []);

  return {
    redemptions,
    filteredRedemptions,
    isLoading,
    error,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    isProcessing,
    selectedRedemptionId,
    detailsDialogOpen,
    setDetailsDialogOpen,
    loadRedemptions,
    handleApproveRedemption,
    handleRejectRedemption,
    handleMarkAsDelivered,
    handleViewDetails
  };
};
