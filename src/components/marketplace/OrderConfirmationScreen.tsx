
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
        console.log(`Buscando detalhes do pedido ${orderId} (tentativa: ${retryCount + 1})`);
        
        // Try with increased timeout for first attempt
        let order: OrderData | null;
        
        try {
          // First try with direct method
          order = await orderService.getOrderByIdDirect(orderId);
        } catch (directError) {
          console.log("Error with direct method, falling back to regular method", directError);
          order = await orderService.getOrderById(orderId);
        }
        
        if (!order) {
          throw new Error('Pedido não encontrado');
        }
        
        console.log('Detalhes do pedido recuperados:', order);
        setOrderDetails(order);

        // IMPORTANTE: Atualizar o perfil do usuário para obter o saldo de pontos atualizado
        await refreshProfile();
        
        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching order details:', err);
        
        // If we've tried less than 3 times, retry after a delay
        if (retryCount < 2) {
          console.log(`Tentando novamente em 1 segundo (tentativa ${retryCount + 1})`);
          setRetryCount(prev => prev + 1);
          setTimeout(() => {
            // This will trigger the useEffect again
            fetchOrderDetails();
          }, 1000);
        } else {
          setError(err.message || 'Não foi possível carregar os detalhes do pedido');
          setLoading(false);
          
          // Show toast for better visibility
          toast.error('Erro ao carregar confirmação do pedido', {
            description: err.message || 'Verifique sua conexão e tente novamente'
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
        attemptCount={retryCount}
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
