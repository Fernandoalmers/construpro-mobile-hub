
import React from 'react';
import { Clock, Tag, Percent } from 'lucide-react';
import Card from '@/components/common/Card';

interface OrderSummaryProps {
  order: any;
}

const OrderSummary: React.FC<OrderSummaryProps> = ({ order }) => {
  // Format date
  const formattedDate = new Date(order.created_at).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Get order ID for display
  const displayOrderId = order.id ? order.id.substring(0, 8).toUpperCase() : '';
  
  // Calculate subtotal from order items
  const subtotalFromItems = order.items && Array.isArray(order.items) 
    ? order.items.reduce((sum: number, item: any) => {
        const itemSubtotal = Number(item.subtotal) || (Number(item.preco_unitario) * Number(item.quantidade));
        return sum + itemSubtotal;
      }, 0)
    : 0;
    
  // Use calculated subtotal or fallback to valor_total
  const subtotal = subtotalFromItems > 0 ? subtotalFromItems : Number(order.valor_total) || 0;
  
  // Get discount and total values
  const descontoAplicado = Number(order.desconto_aplicado) || 0;
  const valorTotal = Number(order.valor_total) || 0;
  
  const hasDiscount = descontoAplicado > 0 && order.cupom_codigo && order.cupom_codigo.trim() !== '';
  
  // Get payment method display
  const getPaymentMethodDisplay = (method: string) => {
    switch (method) {
      case 'credit': return 'Cartão de Crédito';
      case 'debit': return 'Cartão de Débito';
      case 'pix': return 'Pix';
      case 'money': return 'Dinheiro';
      default: return method || 'Não informado';
    }
  };

  // Get status display
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'Confirmado': return { text: 'Confirmado', color: 'bg-yellow-100 text-yellow-800' };
      case 'Processando': return { text: 'Processando', color: 'bg-blue-100 text-blue-800' };
      case 'Enviado': return { text: 'Enviado', color: 'bg-green-100 text-green-800' };
      case 'Entregue': return { text: 'Entregue', color: 'bg-gray-100 text-gray-800' };
      case 'Cancelado': return { text: 'Cancelado', color: 'bg-red-100 text-red-800' };
      default: return { text: status || 'Processando', color: 'bg-yellow-100 text-yellow-800' };
    }
  };

  const statusDisplay = getStatusDisplay(order.status);

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-4">
      {/* Order Header */}
      <div className="border-b pb-3 mb-3">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-lg font-semibold">Pedido #{displayOrderId}</h2>
            <p className="text-sm text-gray-600">{formattedDate}</p>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium inline-flex items-center ${statusDisplay.color}`}>
            <Clock size={12} className="mr-1" />
            {statusDisplay.text}
          </span>
        </div>
      </div>

      {/* Payment Method */}
      <div className="border-b pb-3 mb-3">
        <div className="flex justify-between">
          <span className="text-gray-600">Forma de pagamento:</span>
          <span className="font-medium">{getPaymentMethodDisplay(order.forma_pagamento)}</span>
        </div>
      </div>

      {/* Order Summary */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-600">Subtotal:</span>
          <span>R$ {subtotal.toFixed(2)}</span>
        </div>
        
        {hasDiscount && (
          <div className="bg-green-50 p-2 rounded-md border-l-4 border-green-400">
            <div className="flex justify-between items-center text-green-700">
              <span className="flex items-center gap-1 font-medium">
                <Tag size={14} />
                Desconto ({order.cupom_codigo}):
              </span>
              <span className="font-semibold">-R$ {descontoAplicado.toFixed(2)}</span>
            </div>
          </div>
        )}
        
        <div className="flex justify-between items-center pt-2 border-t">
          <span className="font-bold text-lg">Total:</span>
          <span className="font-bold text-lg">R$ {valorTotal.toFixed(2)}</span>
        </div>
        
        <div className="flex justify-between text-construPro-orange">
          <span>Pontos ganhos:</span>
          <span className="font-medium">{order.pontos_ganhos || 0} pontos</span>
        </div>
        
        {hasDiscount && (
          <div className="bg-green-100 border border-green-300 p-2 rounded-md">
            <div className="flex items-center gap-2 text-green-800">
              <Percent size={14} />
              <span className="text-xs font-medium">
                Você economizou R$ {descontoAplicado.toFixed(2)} com o cupom {order.cupom_codigo}!
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderSummary;
