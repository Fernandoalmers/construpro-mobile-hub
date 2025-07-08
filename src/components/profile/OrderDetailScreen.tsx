
import React from 'react';
import { useParams } from 'react-router-dom';
import { Package, ChevronLeft } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { orderService } from '@/services/orderService';
import LoadingState from '../common/LoadingState';
import { OrderData } from '@/services/order/types';
import OrderDetailHeader from './order-detail/OrderDetailHeader';
import OrderSummary from './order-detail/OrderSummary';
import Card from '../common/Card';
import OrderActionButtons from './order-detail/OrderActionButtons';
import { useNavigate } from 'react-router-dom';
import CustomButton from '../common/CustomButton';
import DeliveryAddressDisplay from '../marketplace/order-confirmation/DeliveryAddressDisplay';
import GroupedOrderItems from './order-detail/GroupedOrderItems';
import OrderBreakdown from './order-detail/OrderBreakdown';

const OrderDetailScreen: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  // Fetch order details from API
  const { 
    data: orderData, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['order', id],
    queryFn: () => id ? orderService.getOrderById(id) : Promise.reject('No order ID provided'),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!id
  });

  // Add more detailed logging to help debug discount and data issues
  React.useEffect(() => {
    if (orderData) {
      console.log("📊 [OrderDetailScreen] Order data loaded:", {
        id: orderData.id,
        status: orderData.status,
        hasItems: !!orderData.items,
        itemsCount: orderData.items?.length || 0,
        valorTotal: orderData.valor_total,
        valorProdutos: orderData.valor_produtos,
        valorFreteTotal: orderData.valor_frete_total,
        descontoAplicado: orderData.desconto_aplicado,
        cupomCodigo: orderData.cupom_codigo,
        pontos_ganhos: orderData.pontos_ganhos,
        shippingInfo: orderData.shipping_info
      });
      
      // If we have items, check vendors and freight
      if (orderData.items && orderData.items.length > 0) {
        const vendorsInfo = orderData.items.map(item => ({
          produto_id: item.produto_id,
          vendedor_id: item.vendedor_id,
          vendor_name: item.vendedor?.nome_loja || 'N/A',
          valor_frete: item.valor_frete || 0,
          desconto_cupom: item.desconto_cupom || 0
        }));
        console.log("🏪 [OrderDetailScreen] Vendors and freight info:", vendorsInfo);
      }

      // Log shipping info details
      if (orderData.shipping_info && orderData.shipping_info.length > 0) {
        console.log("🚚 [OrderDetailScreen] Shipping info details:");
        orderData.shipping_info.forEach(shipping => {
          console.log(`  Vendor ${shipping.vendedor_id}:`, {
            prazo_entrega: shipping.prazo_entrega,
            valor_frete: shipping.valor_frete,
            zona_entrega: shipping.zona_entrega,
            desconto_cupom: shipping.desconto_cupom
          });
        });
      }

      // Log coupon information if present
      if (orderData.cupom_codigo) {
        console.log("🎫 [OrderDetailScreen] Coupon applied:", {
          codigo: orderData.cupom_codigo,
          desconto_total: orderData.desconto_aplicado,
          has_shipping_info: !!orderData.shipping_info,
          vendor_discounts: orderData.shipping_info?.map(s => ({
            vendor: s.vendedor_id,
            desconto: s.desconto_cupom
          }))
        });
      }
    }
  }, [orderData]);

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-100 p-6 pt-12">
        <div className="flex items-center mb-4">
          <button onClick={() => navigate('/profile/orders')} className="text-construPro-blue">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold ml-2">Carregando pedido...</h1>
        </div>
        <LoadingState text="Carregando detalhes do pedido" />
      </div>
    );
  }
  
  if (error || !orderData) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-100 p-6 pt-12">
        <div className="flex items-center mb-4">
          <button onClick={() => navigate('/profile/orders')} className="text-construPro-blue">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold ml-2">Pedido não encontrado</h1>
        </div>
        <div className="text-center py-10">
          <Package className="mx-auto text-gray-400 mb-3" size={40} />
          <h3 className="text-lg font-medium text-gray-700">Pedido não encontrado</h3>
          <p className="text-gray-500 mt-1">O pedido que você está procurando não existe ou houve um erro ao carregar</p>
          <CustomButton 
            variant="primary" 
            className="mt-4"
            onClick={() => navigate('/profile/orders')}
          >
            Voltar para pedidos
          </CustomButton>
        </div>
      </div>
    );
  }

  const order = orderData as OrderData;
  // Ensure we always have an array of items, even if empty
  const orderItems = order.items || [];
  
  console.log("💾 [OrderDetailScreen] Rendering order details:", {
    orderId: order.id,
    itemsCount: orderItems.length,
    valorTotal: order.valor_total,
    valorProdutos: order.valor_produtos,
    valorFreteTotal: order.valor_frete_total,
    descontoAplicado: order.desconto_aplicado,
    cupomCodigo: order.cupom_codigo,
    shippingInfoCount: order.shipping_info?.length || 0
  });

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* Header */}
      <OrderDetailHeader />
      
      {/* Content Container with proper padding for bottom buttons */}
      <div className="flex-1 px-6 pb-32">
        {/* Order Summary */}
        <div className="-mt-6 mb-4">
          <OrderSummary order={order} />
        </div>
        
        {/* Grouped Order Items by Vendor */}
        {orderItems.length > 0 && (
          <div className="mb-4">
            <GroupedOrderItems 
              items={orderItems} 
              shippingInfo={order.shipping_info}
            />
          </div>
        )}

        {/* Order Breakdown */}
        <div className="mb-4">
          <OrderBreakdown
            valorProdutos={order.valor_produtos || 0}
            valorFreteTotal={order.valor_frete_total || 0}
            descontoAplicado={order.desconto_aplicado || 0}
            valorTotal={order.valor_total}
            cupomCodigo={order.cupom_codigo}
          />
        </div>
        
        {/* Delivery Address */}
        {order.endereco_entrega && (
          <div className="mb-4 p-4 bg-white rounded-lg shadow">
            <DeliveryAddressDisplay endereco={order.endereco_entrega} />
          </div>
        )}
      </div>
      
      {/* Actions - Fixed at the bottom */}
      <OrderActionButtons />
    </div>
  );
};

export default OrderDetailScreen;
