
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Package } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { orderDetailsService } from '@/services/vendor/orders/detailsService';
import { useVendorOrderRealtime } from '@/hooks/useVendorOrderRealtime';
import { toast } from '@/components/ui/sonner';
import LoadingState from '../common/LoadingState';
import { Card } from '@/components/ui/card';
import CustomButton from '../common/CustomButton';
import OrderTimeline from './orders/OrderTimeline';
import VendorOrderActions from './orders/VendorOrderActions';
import OrderHeader from './order-detail/OrderHeader';
import OrderSummaryCard from './order-detail/OrderSummaryCard';
import CustomerInfoCard from './order-detail/CustomerInfoCard';
import DeliveryAddressCard from './order-detail/DeliveryAddressCard';
import OrderItemsList from './order-detail/OrderItemsList';
import OrderTotalsCard from './order-detail/OrderTotalsCard';

const VendorOrderDetailScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Validate order ID format
  const isValidUUID = (uuid: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  };

  // Redirect if invalid ID
  useEffect(() => {
    if (!id || !isValidUUID(id)) {
      console.error('❌ [VendorOrderDetailScreen] Invalid order ID:', id);
      toast.error('ID de pedido inválido');
      navigate('/vendor/orders', { replace: true });
      return;
    }
  }, [id, navigate]);
  
  // Setup real-time updates for this specific order
  useVendorOrderRealtime(id);
  
  // Fetch order details with improved error handling
  const { 
    data: pedido, 
    isLoading, 
    error,
    isError 
  } = useQuery({
    queryKey: ['vendorPedidoDetails', id],
    queryFn: async () => {
      if (!id) {
        throw new Error('No order ID provided');
      }
      
      console.log('🔍 [VendorOrderDetailScreen] Fetching order details for:', id);
      const result = await orderDetailsService.getOrderDetails(id);
      
      if (!result) {
        console.error('❌ [VendorOrderDetailScreen] Order not found:', id);
        throw new Error('Order not found');
      }
      
      console.log('✅ [VendorOrderDetailScreen] Order details loaded:', result.id);
      return result;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry if order is not found
      if (error?.message === 'Order not found') {
        return false;
      }
      // Retry up to 2 times for other errors
      return failureCount < 2;
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    enabled: !!id && isValidUUID(id || ''),
    meta: {
      errorPolicy: 'none' // Don't show global error handling
    }
  });

  // Handle order not found - redirect to orders list
  useEffect(() => {
    if (isError && error?.message === 'Order not found') {
      console.log('🔄 [VendorOrderDetailScreen] Order not found, redirecting to orders list');
      toast.error('Pedido não encontrado');
      navigate('/vendor/orders', { replace: true });
    }
  }, [isError, error, navigate]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-100">
        <OrderHeader orderId={id || "..."} status="..." />
        <div className="p-6">
          <LoadingState text="Carregando detalhes do pedido..." />
        </div>
      </div>
    );
  }
  
  // Show error state with redirect option (fallback)
  if (isError || !pedido) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-100">
        <OrderHeader orderId={id || "..."} status="..." />
        <div className="text-center py-10">
          <Package className="mx-auto text-gray-400 mb-3" size={40} />
          <h3 className="text-lg font-medium text-gray-700">Pedido não encontrado</h3>
          <p className="text-gray-500 mt-1">
            {error?.message === 'Order not found' 
              ? 'O pedido que você está procurando não existe ou você não tem permissão para visualizá-lo'
              : 'Houve um erro ao carregar os detalhes do pedido'
            }
          </p>
          <div className="flex gap-2 justify-center mt-4">
            <CustomButton 
              variant="primary" 
              onClick={() => navigate('/vendor/orders', { replace: true })}
            >
              Voltar para pedidos
            </CustomButton>
            {error?.message !== 'Order not found' && (
              <CustomButton 
                variant="outline"
                onClick={() => queryClient.invalidateQueries({ queryKey: ['vendorPedidoDetails', id] })}
              >
                Tentar novamente
              </CustomButton>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Calculate order totals based on vendor items only
  const subtotalBruto = pedido.itens?.reduce((sum, item) => {
    return sum + (Number(item.preco_unitario) * Number(item.quantidade));
  }, 0) || 0;
  
  const valorTotal = Number(pedido.valor_total) || 0; // Already filtered for vendor
  const descontoAplicado = Number(pedido.desconto_aplicado) || 0;
  const hasDiscount = descontoAplicado > 0 && pedido.cupom_codigo && pedido.cupom_codigo.trim() !== '';

  // Usar order_id como código principal se disponível, senão usar pedido ID
  const displayOrderCode = pedido.order_id || pedido.id;

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 pb-20">
      {/* Header - usar order_id como código principal */}
      <OrderHeader 
        orderId={displayOrderCode} 
        status={pedido.status} 
        orderIdFromOrders={pedido.order_id}
      />
      
      <div className="p-6 space-y-4">
        {/* Vendor Actions */}
        <VendorOrderActions pedido={pedido} />

        {/* Order Summary */}
        <OrderSummaryCard 
          createdAt={pedido.created_at}
          paymentMethod={pedido.forma_pagamento}
          hasDiscount={hasDiscount}
          couponCode={pedido.cupom_codigo}
          discountAmount={descontoAplicado}
        />

        {/* Customer Info */}
        {pedido.cliente && (
          <CustomerInfoCard customer={pedido.cliente} />
        )}

        {/* Delivery Address */}
        <DeliveryAddressCard address={pedido.endereco_entrega} />

        {/* Order Timeline */}
        <Card className="p-4">
          <OrderTimeline 
            currentStatus={pedido.status} 
            createdAt={pedido.created_at} 
          />
        </Card>

        {/* Order Items - Only vendor's items */}
        {pedido.itens && pedido.itens.length > 0 && (
          <OrderItemsList items={pedido.itens} />
        )}

        {/* Order Totals - Only vendor's portion */}
        <OrderTotalsCard 
          subtotal={subtotalBruto}
          total={valorTotal}
          hasDiscount={hasDiscount}
          discountAmount={descontoAplicado}
          couponCode={pedido.cupom_codigo}
        />
      </div>
    </div>
  );
};

export default VendorOrderDetailScreen;
