
import React from 'react';
import { Clock } from 'lucide-react';
import Card from '@/components/common/Card';

interface OrderSummaryCardProps {
  orderDetails: any;
}

const OrderSummaryCard: React.FC<OrderSummaryCardProps> = ({ orderDetails }) => {
  // Format date
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
    </Card>
  );
};

export default OrderSummaryCard;
