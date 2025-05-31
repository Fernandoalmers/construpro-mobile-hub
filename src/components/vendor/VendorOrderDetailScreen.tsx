
import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Package } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { orderDetailsService } from '@/services/vendor/orders/detailsService';
import { supabase } from '@/integrations/supabase/client';
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
  const queryClient = useQueryClient();
  
  // Fetch order details
  const { 
    data: pedido, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['vendorPedidoDetails', id],
    queryFn: () => id ? orderDetailsService.getOrderDetails(id) : Promise.reject('No order ID provided'),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!id
  });

  // Set up bidirectional real-time listening using order_id for better synchronization
  useEffect(() => {
    if (!pedido?.order_id) return;

    console.log('🔄 [VendorOrderDetailScreen] Setting up bidirectional real-time for order_id:', pedido.order_id);

    const channel = supabase
      .channel(`order-sync-${pedido.order_id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'pedidos',
          filter: `order_id=eq.${pedido.order_id}`
        },
        (payload) => {
          console.log('📡 [VendorOrderDetailScreen] Pedidos table updated:', payload);
          // Invalidate vendor order details
          queryClient.invalidateQueries({ queryKey: ['vendorPedidoDetails', id] });
          queryClient.invalidateQueries({ queryKey: ['vendorPedidos'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${pedido.order_id}`
        },
        (payload) => {
          console.log('📡 [VendorOrderDetailScreen] Orders table updated:', payload);
          // Invalidate both vendor and customer queries for full sync
          queryClient.invalidateQueries({ queryKey: ['vendorPedidoDetails', id] });
          queryClient.invalidateQueries({ queryKey: ['userOrders'] });
          queryClient.invalidateQueries({ queryKey: ['order'] });
        }
      )
      .subscribe();

    return () => {
      console.log('🔄 [VendorOrderDetailScreen] Cleaning up bidirectional real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [pedido?.order_id, queryClient, id]);

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-100">
        <OrderHeader orderId="..." status="..." />
        <div className="p-6">
          <LoadingState text="Carregando detalhes do pedido" />
        </div>
      </div>
    );
  }
  
  if (error || !pedido) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-100">
        <OrderHeader orderId="..." status="..." />
        <div className="text-center py-10">
          <Package className="mx-auto text-gray-400 mb-3" size={40} />
          <h3 className="text-lg font-medium text-gray-700">Pedido não encontrado</h3>
          <p className="text-gray-500 mt-1">O pedido que você está procurando não existe ou houve um erro ao carregar</p>
          <CustomButton 
            variant="primary" 
            className="mt-4"
            onClick={() => window.history.back()}
          >
            Voltar para pedidos
          </CustomButton>
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

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* Header - usar order_id se disponível */}
      <OrderHeader 
        orderId={pedido.id} 
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
