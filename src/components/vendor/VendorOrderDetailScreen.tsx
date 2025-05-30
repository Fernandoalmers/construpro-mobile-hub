
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Package, Calendar, CreditCard, MapPin, Tag, Percent, User, Mail, Phone } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { orderDetailsService } from '@/services/vendor/orders/detailsService';
import LoadingState from '../common/LoadingState';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import CustomButton from '../common/CustomButton';
import { translatePaymentMethod } from '@/utils/paymentTranslation';
import { formatCompleteAddress } from '@/utils/addressFormatter';
import OrderTimeline from './orders/OrderTimeline';
import ProductImageDisplay from './orders/ProductImageDisplay';

const VendorOrderDetailScreen: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
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

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  // Status badge styling
  const getStatusBadge = (status: string) => {
    switch(status.toLowerCase()) {
      case "entregue":
        return "bg-green-100 text-green-800";
      case "enviado":
        return "bg-blue-100 text-blue-800";
      case "processando":
        return "bg-yellow-100 text-yellow-800";
      case "confirmado":
        return "bg-purple-100 text-purple-800";
      case "pendente":
        return "bg-orange-100 text-orange-800";
      case "cancelado":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-100">
        <div className="bg-white p-4 flex items-center shadow-sm">
          <button onClick={() => navigate('/vendor/orders')} className="mr-4">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold">Carregando pedido...</h1>
        </div>
        <div className="p-6">
          <LoadingState text="Carregando detalhes do pedido" />
        </div>
      </div>
    );
  }
  
  if (error || !pedido) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-100">
        <div className="bg-white p-4 flex items-center shadow-sm">
          <button onClick={() => navigate('/vendor/orders')} className="mr-4">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold">Pedido não encontrado</h1>
        </div>
        <div className="text-center py-10">
          <Package className="mx-auto text-gray-400 mb-3" size={40} />
          <h3 className="text-lg font-medium text-gray-700">Pedido não encontrado</h3>
          <p className="text-gray-500 mt-1">O pedido que você está procurando não existe ou houve um erro ao carregar</p>
          <CustomButton 
            variant="primary" 
            className="mt-4"
            onClick={() => navigate('/vendor/orders')}
          >
            Voltar para pedidos
          </CustomButton>
        </div>
      </div>
    );
  }

  // Calculate order totals
  const subtotalBruto = pedido.itens?.reduce((sum, item) => {
    return sum + (Number(item.preco_unitario) * Number(item.quantidade));
  }, 0) || 0;
  
  const valorTotal = Number(pedido.valor_total) || 0;
  const descontoAplicado = Number(pedido.desconto_aplicado) || 0;
  const hasDiscount = descontoAplicado > 0 && pedido.cupom_codigo && pedido.cupom_codigo.trim() !== '';

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white p-4 flex items-center shadow-sm">
        <button onClick={() => navigate('/vendor/orders')} className="mr-4">
          <ChevronLeft size={24} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Pedido #{pedido.id.substring(0, 8)}</h1>
          <Badge className={getStatusBadge(pedido.status)}>
            {pedido.status}
          </Badge>
        </div>
      </div>
      
      <div className="p-6 space-y-4">
        {/* Order Summary */}
        <Card className="p-4">
          <h3 className="font-medium mb-3">Resumo do Pedido</h3>
          
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar size={16} />
              <span>Realizado em {formatDate(pedido.created_at)}</span>
            </div>
            
            <div className="flex items-center gap-2 text-gray-600">
              <CreditCard size={16} />
              <span>Pagamento: {translatePaymentMethod(pedido.forma_pagamento)}</span>
            </div>
            
            {hasDiscount && (
              <div className="flex items-center gap-2 text-green-600 bg-green-50 p-2 rounded-md">
                <Tag size={16} />
                <span className="font-medium">
                  Cupom aplicado: {pedido.cupom_codigo} (Economia: R$ {descontoAplicado.toFixed(2)})
                </span>
              </div>
            )}
          </div>
        </Card>

        {/* Customer Info */}
        <Card className="p-4">
          <div className="flex items-start gap-2 mb-3">
            <User size={16} className="text-gray-600 mt-0.5" />
            <h3 className="font-medium">Informações do Cliente</h3>
          </div>
          <div className="space-y-2 text-sm">
            <p><strong>Nome:</strong> {pedido.cliente?.nome || 'Cliente'}</p>
            {pedido.cliente?.email && (
              <div className="flex items-center gap-2 text-gray-600">
                <Mail size={14} />
                <span>{pedido.cliente.email}</span>
              </div>
            )}
            {pedido.cliente?.telefone && (
              <div className="flex items-center gap-2 text-gray-600">
                <Phone size={14} />
                <span>{pedido.cliente.telefone}</span>
              </div>
            )}
          </div>
        </Card>

        {/* Delivery Address */}
        <Card className="p-4">
          <div className="flex items-start gap-2 mb-3">
            <MapPin size={16} className="text-gray-600 mt-0.5" />
            <h3 className="font-medium">Endereço de Entrega</h3>
          </div>
          <p className="text-sm text-gray-600">
            {formatCompleteAddress(pedido.endereco_entrega)}
          </p>
        </Card>

        {/* Order Timeline */}
        <Card className="p-4">
          <OrderTimeline 
            currentStatus={pedido.status} 
            createdAt={pedido.created_at} 
          />
        </Card>

        {/* Order Items */}
        <Card className="p-4">
          <h3 className="font-medium mb-3">Itens do Pedido</h3>
          <div className="space-y-3">
            {pedido.itens?.map((item) => (
              <div key={item.id} className="flex gap-3 p-3 border rounded-md">
                <ProductImageDisplay 
                  imageUrl={item.produto?.imagem_url}
                  productName={item.produto?.nome || 'Produto'}
                  className="w-16 h-16"
                />
                <div className="flex-1">
                  <h4 className="font-medium">{item.produto?.nome || 'Produto'}</h4>
                  <p className="text-sm text-gray-600">
                    Quantidade: {item.quantidade} x R$ {Number(item.preco_unitario).toFixed(2)}
                  </p>
                  {item.produto?.descricao && (
                    <p className="text-xs text-gray-500 mt-1">{item.produto.descricao}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-medium">R$ {Number(item.total).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>

          <Separator className="my-4" />
          
          {/* Order Total */}
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">R$ {subtotalBruto.toFixed(2)}</span>
            </div>
            
            {hasDiscount && (
              <div className="flex justify-between text-sm bg-green-50 p-2 rounded-md border-l-4 border-green-400">
                <span className="flex items-center gap-2 text-green-700 font-medium">
                  <Tag size={16} />
                  <span>Desconto aplicado ({pedido.cupom_codigo}):</span>
                </span>
                <span className="font-semibold text-green-700">-R$ {descontoAplicado.toFixed(2)}</span>
              </div>
            )}
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Frete:</span>
              <span className="text-green-600 font-medium">Grátis</span>
            </div>
            
            <Separator className="my-2" />
            
            <div className="flex justify-between font-semibold text-lg">
              <span>Total:</span>
              <span className="text-construPro-orange">R$ {valorTotal.toFixed(2)}</span>
            </div>
            
            {hasDiscount && (
              <div className="bg-green-100 border border-green-300 p-3 rounded-md">
                <div className="flex items-center gap-2 text-green-800">
                  <Percent size={16} />
                  <span className="text-sm font-medium">
                    Cliente economizou R$ {descontoAplicado.toFixed(2)} com o cupom {pedido.cupom_codigo}!
                  </span>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default VendorOrderDetailScreen;
