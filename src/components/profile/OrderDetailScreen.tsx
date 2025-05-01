
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Package, MapPin, Calendar, CreditCard, Award } from 'lucide-react';
import Card from '../common/Card';
import { Separator } from '@/components/ui/separator';
import CustomButton from '../common/CustomButton';
import pedidos from '../../data/pedidos.json';
import produtos from '../../data/produtos.json';

const OrderDetailScreen: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  // Find order by ID
  const order = pedidos.find(pedido => pedido.id === id);
  
  if (!order) {
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
          <p className="text-gray-500 mt-1">O pedido que você está procurando não existe</p>
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
  
  // Get product details for items in order
  const orderItems = order.itens.map(item => {
    const product = produtos.find(produto => produto.id === item.produtoId);
    return {
      ...item,
      product
    };
  });
  
  // Status badge styling
  const getStatusBadge = (status: string) => {
    switch(status) {
      case "Entregue":
        return "bg-green-100 text-green-800";
      case "Em Trânsito":
        return "bg-blue-100 text-blue-800";
      case "Em Separação":
        return "bg-yellow-100 text-yellow-800";
      case "Confirmado":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  
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

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 pb-20">
      {/* Header */}
      <div className="bg-construPro-blue p-6 pt-12">
        <div className="flex items-center mb-4">
          <button onClick={() => navigate('/profile/orders')} className="text-white">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold text-white ml-2">Detalhes do Pedido</h1>
        </div>
      </div>
      
      {/* Order Summary */}
      <div className="px-6 -mt-6">
        <Card className="p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium">Pedido #{order.id}</h3>
            <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadge(order.status)}`}>
              {order.status}
            </span>
          </div>
          
          <div className="flex flex-col gap-2 text-sm mb-4">
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar size={16} />
              <span>Realizado em {formatDate(order.data)}</span>
            </div>
            
            <div className="flex items-center gap-2 text-gray-600">
              <CreditCard size={16} />
              <span>Pagamento: {order.formaPagamento}</span>
            </div>
            
            <div className="flex items-center gap-2 text-gray-600">
              <Award size={16} />
              <span>Pontos ganhos: {order.pontosGanhos}</span>
            </div>
            
            {order.rastreio && (
              <div className="flex items-center gap-2 text-gray-600">
                <Package size={16} />
                <span>Código de rastreio: {order.rastreio}</span>
              </div>
            )}
          </div>
          
          <div className="bg-gray-50 p-3 rounded-md mb-4">
            <div className="flex items-start gap-2">
              <MapPin size={16} className="text-gray-600 mt-0.5" />
              <div>
                <p className="font-medium">Endereço de entrega</p>
                <p className="text-sm text-gray-600">{order.enderecoEntrega}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Order Items */}
      <div className="px-6 mt-4">
        <Card className="p-4">
          <h3 className="font-medium mb-3">Itens do pedido</h3>
          
          <div className="divide-y">
            {orderItems.map((item, index) => (
              <div key={index} className="py-3 flex">
                <div 
                  className="w-16 h-16 bg-gray-200 rounded mr-3 bg-center bg-cover flex-shrink-0"
                  style={{ backgroundImage: `url(${item.product?.imagemUrl})` }}
                />
                <div className="flex-1">
                  <h4 className="font-medium">{item.product?.nome || 'Produto indisponível'}</h4>
                  <p className="text-sm text-gray-500">Qtd: {item.quantidade}</p>
                  <p className="text-sm font-medium mt-1">
                    R$ {((item.product?.preco || 0) * item.quantidade).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          <Separator className="my-4" />
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>R$ {order.valorTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Frete:</span>
              <span>Grátis</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>Total:</span>
              <span>R$ {order.valorTotal.toFixed(2)}</span>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Actions */}
      <div className="p-6">
        <div className="flex gap-3">
          <CustomButton 
            variant="outline" 
            fullWidth
            onClick={() => navigate('/marketplace')}
          >
            Continuar comprando
          </CustomButton>
          
          <CustomButton 
            variant="primary" 
            fullWidth
            onClick={() => {
              // In a real app, this would add all items from this order to cart
              navigate('/marketplace');
            }}
          >
            Comprar novamente
          </CustomButton>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailScreen;
