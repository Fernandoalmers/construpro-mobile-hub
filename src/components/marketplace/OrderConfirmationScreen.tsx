import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowLeft, Clock, ShoppingBag, Home, Package, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LoadingState from '../common/LoadingState';
import ErrorState from '../common/ErrorState';
import Card from '../common/Card';
import { orderService } from '@/services/orderService';
import ProductImage from '../admin/products/components/ProductImage';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from '@/components/ui/sonner';
import CheckoutErrorState from '../checkout/CheckoutErrorState';

const OrderConfirmationScreen: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [retryCount, setRetryCount] = useState(0);

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
        const order = await orderService.getOrderById(orderId);
        
        if (!order) {
          throw new Error('Pedido não encontrado');
        }
        
        console.log('Detalhes do pedido recuperados:', order);
        setOrderDetails(order);
        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching order details:', err);
        
        // If we've tried less than 3 times, retry after a delay
        if (retryCount < 2) {
          console.log(`Tentando novamente em 1 segundo (tentativa ${retryCount + 1})`);
          setRetryCount(prev => prev + 1);
          setTimeout(() => {
            // This will trigger the useEffect again
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
  }, [orderId, retryCount]);

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

  const formattedDate = new Date(orderDetails.created_at).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Get order ID for display
  const displayOrderId = orderDetails.id ? orderDetails.id.substring(0, 8).toUpperCase() : '';

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white p-4 flex items-center shadow-sm">
        <button onClick={() => navigate(-1)} className="mr-4">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold">Confirmação de Pedido</h1>
      </div>

      <div className="flex-1 p-4 pb-20">
        <div className="mb-6 text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle size={32} className="text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-green-600 mb-2">Pedido Confirmado!</h2>
          <p className="text-gray-600">
            Seu pedido foi realizado com sucesso e está sendo processado.
          </p>
        </div>

        <Card className="mb-4 p-4">
          <div className="grid grid-cols-2 gap-y-3 border-b pb-3 mb-3">
            <div className="text-gray-600">Número do Pedido:</div>
            <div className="font-medium text-right">{displayOrderId}</div>
            
            <div className="text-gray-600">Data do Pedido:</div>
            <div className="text-right">{formattedDate}</div>
          </div>

          <div className="grid grid-cols-2 gap-y-3 border-b pb-3 mb-3">
            <div className="text-gray-600">Status:</div>
            <div className="text-right">
              <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full text-sm inline-flex items-center">
                <Clock size={14} className="mr-1" />
                {orderDetails.status || 'Processando'}
              </span>
            </div>
            
            <div className="text-gray-600">Forma de pagamento:</div>
            <div className="text-right">{orderDetails.forma_pagamento === 'credit' ? 'Cartão de Crédito' : 
                  orderDetails.forma_pagamento === 'debit' ? 'Cartão de Débito' :
                  orderDetails.forma_pagamento === 'pix' ? 'Pix' :
                  orderDetails.forma_pagamento === 'money' ? 'Dinheiro' : 
                  orderDetails.forma_pagamento || 'Não informado'}</div>
          </div>

          <div className="border-b pb-3 mb-4">
            <h3 className="font-medium mb-2">Resumo</h3>
            <div className="grid grid-cols-2 gap-2 mb-1">
              <span className="text-gray-600">Total:</span>
              <span className="font-bold text-right">R$ {orderDetails.valor_total?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-construPro-orange">
              <span>Pontos ganhos:</span>
              <span className="text-right">{orderDetails.pontos_ganhos || 0} pontos</span>
            </div>
          </div>

          <div className="mb-4">
            <h3 className="font-medium mb-3 flex items-center">
              <Package className="mr-2" size={18} />
              Itens do Pedido
            </h3>
            
            {orderDetails.items && Array.isArray(orderDetails.items) && orderDetails.items.length > 0 ? (
              <div className="space-y-4">
                {orderDetails.items.map((item: any, index: number) => (
                  <div key={item.id || index} className="flex border-b border-gray-100 pb-4">
                    <div className="w-20 h-20 flex-shrink-0 mr-3">
                      <ProductImage 
                        imagemUrl={item.produto?.imagem_url}
                        productName={item.produto?.nome || 'Produto'}
                        size="lg"
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm line-clamp-2">{item.produto?.nome || 'Produto'}</h4>
                      <div className="mt-2 text-gray-600 text-sm">
                        <div className="flex justify-between items-center">
                          <span>Quantidade: {item.quantidade}x</span>
                          <span>R$ {Number(item.preco_unitario).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          <span className="font-medium">Subtotal:</span>
                          <span className="font-medium">R$ {Number(item.subtotal || (item.preco_unitario * item.quantidade)).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 py-2 text-center">Nenhum item encontrado</p>
            )}
          </div>
          
          {orderDetails.endereco_entrega && (
            <div className="pt-3 border-t">
              <h3 className="font-medium mb-2 flex items-center">
                <MapPin className="mr-2" size={18} />
                Endereço de Entrega
              </h3>
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                {typeof orderDetails.endereco_entrega === 'string' 
                  ? orderDetails.endereco_entrega
                  : `${orderDetails.endereco_entrega.logradouro}, ${orderDetails.endereco_entrega.numero}, ${orderDetails.endereco_entrega.bairro}, ${orderDetails.endereco_entrega.cidade} - ${orderDetails.endereco_entrega.estado}`
                }
              </p>
            </div>
          )}
        </Card>

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-md">
          <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
            <Button 
              variant="default" 
              className="w-full"
              onClick={() => navigate('/profile/orders')}
            >
              <ShoppingBag size={18} className="mr-2" />
              Meus Pedidos
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => navigate('/marketplace')}
            >
              <Home size={18} className="mr-2" />
              Continuar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmationScreen;
