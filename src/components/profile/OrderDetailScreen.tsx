
import React from 'react';
import { useParams } from 'react-router-dom';
import { Package, ChevronLeft } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { orderService } from '@/services/orderService';
import LoadingState from '../common/LoadingState';
import { OrderData } from '@/services/order/types';
import OrderDetailHeader from './order-detail/OrderDetailHeader';
import OrderSummary from './order-detail/OrderSummary';
import OrderItemsList from '../marketplace/order-confirmation/OrderItemsList';
import Card from '../common/Card';
import OrderTotal from './order-detail/OrderTotal';
import OrderActionButtons from './order-detail/OrderActionButtons';
import { useNavigate } from 'react-router-dom';
import CustomButton from '../common/CustomButton';
import DeliveryAddressDisplay from '../marketplace/order-confirmation/DeliveryAddressDisplay';

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
        descontoAplicado: orderData.desconto_aplicado,
        cupomCodigo: orderData.cupom_codigo,
        cupomCodigoType: typeof orderData.cupom_codigo,
        pontos_ganhos: orderData.pontos_ganhos
      });
      
      // If we have items, check the first one for debugging
      if (orderData.items && orderData.items.length > 0) {
        const firstItem = orderData.items[0];
        console.log("📦 [OrderDetailScreen] First item details:", {
          id: firstItem.id,
          produto_id: firstItem.produto_id,
          preco_unitario: firstItem.preco_unitario,
          quantidade: firstItem.quantidade,
          subtotal: firstItem.subtotal,
          produto: firstItem.produto ? {
            nome: firstItem.produto.nome,
            hasImage: !!firstItem.produto.imagem_url,
            hasImagens: !!firstItem.produto.imagens && 
                       Array.isArray(firstItem.produto.imagens) && 
                       firstItem.produto.imagens.length > 0
          } : 'No product data'
        });
      } else {
        console.warn("⚠️ [OrderDetailScreen] No items found in order data");
      }
      
      // Debug discount data specifically
      if (orderData.cupom_codigo || orderData.desconto_aplicado) {
        console.log("🎫 [OrderDetailScreen] Discount data:", {
          cupom_codigo: orderData.cupom_codigo,
          cupom_codigo_length: orderData.cupom_codigo?.length,
          desconto_aplicado: orderData.desconto_aplicado,
          desconto_aplicado_type: typeof orderData.desconto_aplicado,
          desconto_aplicado_number: Number(orderData.desconto_aplicado)
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
    descontoAplicado: order.desconto_aplicado,
    cupomCodigo: order.cupom_codigo
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
        
        {/* Order Items and Address - Using same structure as OrderConfirmationScreen */}
        <div className="mb-4 p-4 bg-white rounded-lg shadow">
          <OrderItemsList items={orderItems} />
          
          {order.endereco_entrega && (
            <DeliveryAddressDisplay endereco={order.endereco_entrega} />
          )}
        </div>
      </div>
      
      {/* Actions - Fixed at the bottom */}
      <OrderActionButtons />
    </div>
  );
};

export default OrderDetailScreen;
