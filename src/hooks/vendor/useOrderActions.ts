
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateOrderStatus as updateOrderStatusService } from '@/services/vendor/orders/orderStatusUpdater';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const useOrderActions = (orderId: string) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const queryClient = useQueryClient();

  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      console.log('🔄 [useOrderActions] Iniciando atualização de status:', newStatus);
      console.log('🔄 [useOrderActions] Order ID:', orderId);
      
      setIsUpdating(true);
      
      // Verificar autenticação atual antes de tentar atualizar
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      console.log('👤 [useOrderActions] Usuário autenticado:', user?.email);
      
      if (authError || !user) {
        console.error('❌ [useOrderActions] Erro de autenticação:', authError);
        throw new Error('Usuário não autenticado');
      }
      
      // Verificar se o usuário tem um vendedor associado
      const { data: vendorData, error: vendorError } = await supabase
        .from('vendedores')
        .select('id, nome_loja, usuario_id')
        .eq('usuario_id', user.id)
        .single();
      
      console.log('🏪 [useOrderActions] Dados do vendedor:', vendorData);
      
      if (vendorError || !vendorData) {
        console.error('❌ [useOrderActions] Erro ao buscar vendedor:', vendorError);
        throw new Error('Vendedor não encontrado para o usuário atual');
      }
      
      console.log('🚀 [useOrderActions] Chamando serviço de atualização...');
      const success = await updateOrderStatusService(orderId, newStatus);
      if (!success) {
        throw new Error('Falha ao atualizar status do pedido');
      }
      
      console.log('✅ [useOrderActions] Status atualizado com sucesso para:', newStatus);
      return success;
    },
    onSuccess: (_, newStatus) => {
      console.log('✅ [useOrderActions] Mutação bem-sucedida, novo status:', newStatus);
      
      toast({
        title: "Status atualizado",
        description: `Status alterado para: ${newStatus}`,
      });
      
      // Invalidar múltiplas queries para garantir atualização
      queryClient.invalidateQueries({ queryKey: ['vendorPedidoDetails', orderId] });
      queryClient.invalidateQueries({ queryKey: ['vendorPedidos'] });
      queryClient.invalidateQueries({ queryKey: ['vendorOrders'] });
      
      // Forçar refresh da página de detalhes após um pequeno delay
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    },
    onError: (error) => {
      console.error('❌ [useOrderActions] Erro na mutação:', error);
      
      let errorMessage = 'Erro ao atualizar status';
      if (error instanceof Error) {
        if (error.message.includes('autenticado')) {
          errorMessage = 'Sessão expirada. Faça login novamente.';
        } else if (error.message.includes('Vendedor não encontrado')) {
          errorMessage = 'Você não tem permissão para alterar este pedido.';
        } else if (error.message.includes('constraint') || error.message.includes('violates check')) {
          errorMessage = 'Erro de validação de status. O sistema está sendo corrigido.';
        } else if (error.message.includes('sincronizar')) {
          errorMessage = 'Erro na sincronização entre sistemas. Tente novamente.';
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsUpdating(false);
      console.log('🏁 [useOrderActions] Mutação finalizada');
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
    console.log('🔄 [useOrderActions] Estado isUpdating antes:', isUpdating);
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
