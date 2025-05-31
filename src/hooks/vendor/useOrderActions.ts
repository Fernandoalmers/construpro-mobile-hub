
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateOrderStatus as updateOrderStatusService } from '@/services/vendor/orders/orderStatusUpdater';
import { toast } from '@/hooks/use-toast';

export const useOrderActions = (orderId: string) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const queryClient = useQueryClient();

  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      console.log('🔄 [useOrderActions] Iniciando atualização de status:', newStatus);
      setIsUpdating(true);
      const success = await updateOrderStatusService(orderId, newStatus);
      if (!success) {
        throw new Error('Falha ao atualizar status do pedido');
      }
      return success;
    },
    onSuccess: () => {
      console.log('✅ [useOrderActions] Status atualizado com sucesso');
      toast({
        title: "Status atualizado",
        description: "O status do pedido foi atualizado com sucesso",
      });
      // Invalidar a query para recarregar os dados
      queryClient.invalidateQueries({ queryKey: ['vendorPedidoDetails', orderId] });
      queryClient.invalidateQueries({ queryKey: ['vendorPedidos'] });
    },
    onError: (error) => {
      console.error('❌ [useOrderActions] Erro ao atualizar status:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao atualizar status",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsUpdating(false);
    }
  });

  const getNextStatus = (currentStatus: string): string | null => {
    const statusFlow = {
      'pendente': 'confirmado',
      'confirmado': 'processando',
      'processando': 'enviado',
      'enviado': 'entregue'
    };
    return statusFlow[currentStatus.toLowerCase()] || null;
  };

  const getStatusButtonText = (currentStatus: string): string => {
    const buttonTexts = {
      'pendente': 'Confirmar Pedido',
      'confirmado': 'Iniciar Processamento',
      'processando': 'Marcar como Enviado',
      'enviado': 'Marcar como Entregue'
    };
    return buttonTexts[currentStatus.toLowerCase()] || '';
  };

  const canUpdateStatus = (currentStatus: string): boolean => {
    const finalStates = ['entregue', 'cancelado'];
    return !finalStates.includes(currentStatus.toLowerCase());
  };

  const updateOrderStatus = (newStatus: string) => {
    console.log('🔄 [useOrderActions] Chamando mutação para status:', newStatus);
    updateStatusMutation.mutate(newStatus);
  };

  return {
    isUpdating,
    updateOrderStatus,
    getNextStatus,
    getStatusButtonText,
    canUpdateStatus
  };
};
