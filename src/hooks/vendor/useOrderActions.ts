
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateOrderStatus as updateOrderStatusService } from '@/services/vendor/orders/orderStatusUpdater';
import { toast } from '@/hooks/use-toast';

export const useOrderActions = (orderId: string) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const queryClient = useQueryClient();

  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      console.log('🔄 [useOrderActions] Starting status update mutation:', {
        orderId,
        newStatus,
        timestamp: new Date().toISOString()
      });
      
      setIsUpdating(true);
      
      const success = await updateOrderStatusService(orderId, newStatus);
      if (!success) {
        throw new Error('Failed to update order status');
      }
      
      console.log('✅ [useOrderActions] Status update completed successfully');
      return success;
    },
    onSuccess: (_, newStatus) => {
      console.log('✅ [useOrderActions] Mutation successful, invalidating queries...');
      
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['vendorPedidoDetails', orderId] });
      queryClient.invalidateQueries({ queryKey: ['vendorPedidos'] });
      queryClient.invalidateQueries({ queryKey: ['vendorOrders'] });
      
      // Show success notification
      toast({
        title: "Status atualizado",
        description: `Status alterado para "${newStatus}" com sucesso`,
      });
    },
    onError: (error) => {
      console.error('❌ [useOrderActions] Mutation error:', {
        error: error,
        message: error.message,
        orderId
      });
      
      // Error handling with user-friendly messages
      let errorMessage = 'Erro ao atualizar status do pedido';
      if (error instanceof Error) {
        if (error.message.includes('autenticado') || error.message.includes('authentication')) {
          errorMessage = 'Sessão expirada. Faça login novamente.';
        } else if (error.message.includes('permissão') || error.message.includes('permission')) {
          errorMessage = 'Você não tem permissão para alterar este pedido.';
        } else if (error.message.includes('não encontrado') || error.message.includes('not found')) {
          errorMessage = 'Pedido não encontrado.';
        } else if (error.message.includes('finalizado') || error.message.includes('final status')) {
          errorMessage = 'Não é possível alterar o status de um pedido finalizado.';
        } else if (error.message.includes('conexão') || error.message.includes('network')) {
          errorMessage = 'Erro de conexão. Verifique sua internet.';
        } else if (error.message !== 'Failed to update order status') {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Erro na atualização",
        description: errorMessage,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsUpdating(false);
      console.log('🏁 [useOrderActions] Mutation settled, updating state');
    },
    retry: (failureCount, error) => {
      // Only retry for network-related errors
      if (error instanceof Error) {
        const shouldRetry = error.message.includes('network') || 
                           error.message.includes('timeout') ||
                           error.message.includes('conexão');
        const shouldRetryResult = shouldRetry && failureCount < 2;
        console.log('🔄 [useOrderActions] Retry decision:', {
          shouldRetry,
          failureCount,
          errorMessage: error.message,
          willRetry: shouldRetryResult
        });
        return shouldRetryResult;
      }
      return false;
    },
    retryDelay: (attemptIndex) => {
      const delay = Math.min(1000 * 2 ** attemptIndex, 5000);
      console.log('⏳ [useOrderActions] Retry delay:', { attemptIndex, delay });
      return delay;
    },
  });

  const getNextStatus = (currentStatus: string): string | null => {
    // Normalize status to lowercase for comparison
    const normalizedStatus = currentStatus.toLowerCase();
    
    const statusFlow = {
      'pendente': 'confirmado',
      'confirmado': 'processando', 
      'processando': 'enviado',
      'enviado': 'entregue'
    };
    
    const nextStatus = statusFlow[normalizedStatus] || null;
    console.log('🔄 [useOrderActions] Status flow:', { currentStatus, normalizedStatus, nextStatus });
    return nextStatus;
  };

  const getStatusButtonText = (currentStatus: string): string => {
    // Normalize status to lowercase for comparison
    const normalizedStatus = currentStatus.toLowerCase();
    
    const buttonTexts = {
      'pendente': 'Confirmar Pedido',
      'confirmado': 'Iniciar Processamento',
      'processando': 'Marcar como Enviado', 
      'enviado': 'Marcar como Entregue'
    };
    return buttonTexts[normalizedStatus] || '';
  };

  const canUpdateStatus = (currentStatus: string): boolean => {
    // Normalize status to lowercase for comparison
    const normalizedStatus = currentStatus.toLowerCase();
    const finalStates = ['entregue', 'cancelado'];
    const canUpdate = !finalStates.includes(normalizedStatus);
    console.log('🔍 [useOrderActions] Status update validation:', { currentStatus, normalizedStatus, canUpdate });
    return canUpdate;
  };

  const updateOrderStatus = (newStatus: string) => {
    console.log('🚀 [useOrderActions] Triggering status update:', {
      orderId,
      newStatus,
      isCurrentlyUpdating: isUpdating
    });
    updateStatusMutation.mutate(newStatus);
  };

  return {
    isUpdating: isUpdating || updateStatusMutation.isPending,
    updateOrderStatus,
    getNextStatus,
    getStatusButtonText,
    canUpdateStatus
  };
};
