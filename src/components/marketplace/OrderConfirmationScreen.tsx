
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from '@/components/ui/sonner';
import LoadingState from '../common/LoadingState';
import { orderService } from '@/services/orderService';
import { useIsMobile } from '@/hooks/use-mobile';
import CheckoutErrorState from '../checkout/CheckoutErrorState';
import { OrderData } from '@/services/order/types';
import { useAuth } from '@/context/AuthContext';

// Imported components
import OrderHeader from './order-confirmation/OrderHeader';
import OrderSuccessMessage from './order-confirmation/OrderSuccessMessage';
import OrderSummaryCard from './order-confirmation/OrderSummaryCard';
import OrderItemsList from './order-confirmation/OrderItemsList';
import DeliveryAddressDisplay from './order-confirmation/DeliveryAddressDisplay';
import OrderActionButtons from './order-confirmation/OrderActionButtons';

const OrderConfirmationScreen: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderDetails, setOrderDetails] = useState<OrderData | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const { refreshProfile } = useAuth();

  useEffect(() => {
    if (!orderId) {
      setError('ID do pedido não encontrado');
      setLoading(false);
      return;
    }

    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        console.log(`🔍 Buscando detalhes do pedido ${orderId} (tentativa: ${retryCount + 1})`);
        
        let order: OrderData | null = null;
        
        try {
          // First try the corrected RPC method
          console.log('🔄 Trying RPC method with corrected parameter...');
          order = await orderService.getOrderByIdRPC(orderId);
          console.log('✅ Order retrieved using corrected RPC method');
        } catch (rpcError) {
          console.log("⚠️ RPC method failed, trying direct method", rpcError);
          
          try {
            // Fallback to direct method
            order = await orderService.getOrderByIdDirect(orderId);
            console.log('✅ Order retrieved using direct method');
          } catch (directError) {
            console.log("⚠️ Direct method failed, trying regular method", directError);
            // Final fallback to regular method
            order = await orderService.getOrderById(orderId);
            console.log('✅ Order retrieved using regular method');
          }
        }
        
        if (!order) {
          throw new Error('Pedido não encontrado');
        }
        
        console.log('📋 Detalhes do pedido recuperados:', {
          id: order.id,
          status: order.status,
          valor_total: order.valor_total,
          pontos_ganhos: order.pontos_ganhos,
          itemsCount: order.items?.length || 0
        });
        
        setOrderDetails(order);

        // IMPORTANTE: Atualizar o perfil do usuário para obter o saldo de pontos atualizado
        try {
          await refreshProfile();
          console.log('✅ Profile refreshed successfully');
        } catch (profileError) {
          console.warn('⚠️ Failed to refresh profile:', profileError);
          // Don't fail the whole process if profile refresh fails
        }
        
        setLoading(false);
        setError(null);
        
      } catch (err: any) {
        console.error('❌ Error fetching order details:', err);
        
        // If we've tried less than 3 times, retry after a delay
        if (retryCount < 2) {
          console.log(`🔄 Tentando novamente em 2 segundos (tentativa ${retryCount + 1}/3)`);
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, 2000);
        } else {
          const errorMessage = err.message || 'Não foi possível carregar os detalhes do pedido';
          setError(errorMessage);
          setLoading(false);
          
          // Show toast for better visibility
          toast.error('Erro ao carregar confirmação do pedido', {
            description: errorMessage + '. Verifique sua conexão e tente novamente'
          });
        }
      }
    };

    fetchOrderDetails();
  }, [orderId, retryCount, refreshProfile]);

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    setRetryCount(0); // Reset retry count to start fresh
  };

  if (loading) {
    return <LoadingState text="Carregando detalhes do pedido..." />;
  }

  if (error || !orderDetails) {
    return (
      <CheckoutErrorState 
        error={error || "Pedido não encontrado"}
        attemptCount={retryCount + 1}
        onRetry={handleRetry}
      />
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <OrderHeader />
      
      <div className="flex-1 p-4 pb-20">
        <OrderSuccessMessage />
        
        <OrderSummaryCard orderDetails={orderDetails} />
        
        <div className="mb-4 p-4 bg-white rounded-lg shadow">
          <OrderItemsList items={orderDetails.items || []} />
          
          {orderDetails.endereco_entrega && (
            <DeliveryAddressDisplay endereco={orderDetails.endereco_entrega} />
          )}
        </div>

        <OrderActionButtons />
      </div>
    </div>
  );
};

export default OrderConfirmationScreen;
