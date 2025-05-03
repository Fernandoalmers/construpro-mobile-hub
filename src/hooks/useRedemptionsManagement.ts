
import { useState, useCallback, useMemo } from 'react';
import { 
  fetchRedemptions, 
  approveRedemption, 
  rejectRedemption, 
  markRedemptionAsDelivered,
  AdminRedemption
} from '@/services/adminRedemptionsService';
import { toast } from '@/components/ui/sonner';

export const useRedemptionsManagement = () => {
  const [redemptions, setRedemptions] = useState<AdminRedemption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isProcessing, setIsProcessing] = useState(false);

  const loadRedemptions = useCallback(async (forceRefresh = false) => {
    try {
      setIsLoading(true);
      setError(null);
      const redemptionsData = await fetchRedemptions(forceRefresh);
      setRedemptions(redemptionsData);
    } catch (err) {
      setError('Falha ao carregar resgates. Por favor, tente novamente.');
      toast.error('Erro ao carregar resgates');
    } finally {
      setIsLoading(false);
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

  const handleApproveRedemption = async (redemptionId: string) => {
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
      }
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleRejectRedemption = async (redemptionId: string) => {
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
      }
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleMarkAsDelivered = async (redemptionId: string) => {
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
      }
    } finally {
      setIsProcessing(false);
    }
  };

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
    loadRedemptions,
    handleApproveRedemption,
    handleRejectRedemption,
    handleMarkAsDelivered
  };
};
