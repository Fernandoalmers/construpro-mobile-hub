
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowLeft, Clock, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LoadingState from '../common/LoadingState';
import ErrorState from '../common/ErrorState';
import Card from '../common/Card';
import { orderService } from '@/services/orderService';

const OrderConfirmationScreen: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderDetails, setOrderDetails] = useState<any>(null);

  useEffect(() => {
    if (!orderId) return;

    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        
        // Fetch order details
        const order = await orderService.getOrderById(orderId);
        
        if (!order) {
          throw new Error('Pedido não encontrado');
        }
        
        setOrderDetails(order);
      } catch (err: any) {
        console.error('Error fetching order details:', err);
        setError(err.message || 'Não foi possível carregar os detalhes do pedido');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId]);

  if (loading) {
    return <LoadingState text="Carregando detalhes do pedido..." />;
  }

  if (error || !orderDetails) {
    return (
      <ErrorState 
        title="Erro ao carregar confirmação" 
        message={error || "Pedido não encontrado"}
        onRetry={() => navigate('/orders')}
      />
    );
  }

  const formattedDate = new Date(orderDetails.created_at).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white p-4 flex items-center shadow-sm">
        <button onClick={() => navigate(-1)} className="mr-4">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold">Confirmação de Pedido</h1>
      </div>

      <div className="flex-1 p-6">
        <div className="mb-8 text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle size={32} className="text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-green-600 mb-2">Pedido Confirmado!</h2>
          <p className="text-gray-600">
            Seu pedido foi realizado com sucesso e está sendo processado.
          </p>
        </div>

        <Card className="mb-6 p-4">
          <div className="border-b pb-3 mb-3">
            <div className="flex justify-between mb-1">
              <span className="text-gray-600">Número do Pedido:</span>
              <span className="font-medium">{orderDetails.id.substring(0, 8).toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Data do Pedido:</span>
              <span>{formattedDate}</span>
            </div>
          </div>

          <div className="border-b pb-3 mb-3">
            <div className="flex justify-between mb-1">
              <span className="text-gray-600">Status:</span>
              <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full text-sm flex items-center">
                <Clock size={14} className="mr-1" />
                {orderDetails.status || 'Processando'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Forma de pagamento:</span>
              <span>{orderDetails.forma_pagamento === 'credit' ? 'Cartão de Crédito' : 
                     orderDetails.forma_pagamento === 'debit' ? 'Cartão de Débito' :
                     orderDetails.forma_pagamento === 'pix' ? 'Pix' :
                     orderDetails.forma_pagamento === 'money' ? 'Dinheiro' : 
                     orderDetails.forma_pagamento || 'Não informado'}</span>
            </div>
          </div>

          <div className="border-b pb-3 mb-3">
            <h3 className="font-medium mb-2">Resumo</h3>
            <div className="flex justify-between mb-1">
              <span className="text-gray-600">Total:</span>
              <span className="font-bold">R$ {orderDetails.valor_total?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="flex justify-between text-construPro-orange">
              <span>Pontos ganhos:</span>
              <span>{orderDetails.pontos_ganhos || 0} pontos</span>
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-2">Itens do Pedido</h3>
            {orderDetails.items && orderDetails.items.length > 0 ? (
              <div className="space-y-3">
                {orderDetails.items.map((item: any) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-200 rounded overflow-hidden">
                      <img 
                        src={item.produtos?.imagem_url || 'https://via.placeholder.com/48'} 
                        alt={item.produtos?.nome || 'Produto'} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.produtos?.nome || 'Produto'}</p>
                      <p className="text-xs text-gray-600">{item.quantidade}x R$ {item.preco_unitario?.toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">R$ {item.subtotal?.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 py-2">Nenhum item encontrado</p>
            )}
          </div>
        </Card>

        <div className="flex flex-col gap-3">
          <Button 
            variant="default" 
            className="w-full"
            onClick={() => navigate('/orders')}
          >
            <ShoppingBag size={18} className="mr-2" />
            Ver Meus Pedidos
          </Button>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => navigate('/marketplace')}
          >
            Continuar Comprando
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmationScreen;
