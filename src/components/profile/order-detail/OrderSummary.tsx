
import React from 'react';
import Card from '../../common/Card';
import { Calendar, CreditCard, Award, Package, MapPin, Tag } from 'lucide-react';
import { OrderData } from '@/services/order/types';

interface OrderSummaryProps {
  order: OrderData;
}

const OrderSummary: React.FC<OrderSummaryProps> = ({ order }) => {
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

  const hasDiscount = order.desconto_aplicado && Number(order.desconto_aplicado) > 0;

  return (
    <Card className="p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-medium">Pedido #{order.id.substring(0, 8)}</h3>
        <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadge(order.status)}`}>
          {order.status}
        </span>
      </div>
      
      <div className="flex flex-col gap-2 text-sm mb-4">
        <div className="flex items-center gap-2 text-gray-600">
          <Calendar size={16} />
          <span>Realizado em {formatDate(order.created_at)}</span>
        </div>
        
        <div className="flex items-center gap-2 text-gray-600">
          <CreditCard size={16} />
          <span>Pagamento: {order.forma_pagamento}</span>
        </div>
        
        <div className="flex items-center gap-2 text-gray-600">
          <Award size={16} />
          <span>Pontos ganhos: {order.pontos_ganhos || 0}</span>
        </div>
        
        {hasDiscount && (
          <div className="flex items-center gap-2 text-green-600">
            <Tag size={16} />
            <span>Cupom aplicado: {order.cupom_codigo} (-R$ {Number(order.desconto_aplicado).toFixed(2)})</span>
          </div>
        )}
        
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
            {order.endereco_entrega && (
              <p className="text-sm text-gray-600">
                {typeof order.endereco_entrega === 'string' 
                  ? order.endereco_entrega
                  : `${order.endereco_entrega.logradouro || ''}, 
                      ${order.endereco_entrega.numero || ''}, 
                      ${order.endereco_entrega.cidade || ''} - 
                      ${order.endereco_entrega.estado || ''}`
                }
              </p>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default OrderSummary;
