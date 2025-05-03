
import React from 'react';
import { Card } from '@/components/ui/card';
import { CalendarClock, ChevronRight, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VendorOrder } from '@/services/vendorService';
import Avatar from '../common/Avatar';

interface OrderItemProps {
  order: VendorOrder;
  onViewDetails: (orderId: string) => void;
}

const OrderItem: React.FC<OrderItemProps> = ({ order, onViewDetails }) => {
  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };
  
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  
  // Get status info
  const getStatusInfo = () => {
    switch (order.status) {
      case 'pendente':
        return {
          label: 'Pendente',
          bgColor: 'bg-amber-100',
          textColor: 'text-amber-800'
        };
      case 'aprovado':
        return {
          label: 'Aprovado',
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-800'
        };
      case 'processando':
        return {
          label: 'Em processamento',
          bgColor: 'bg-purple-100',
          textColor: 'text-purple-800'
        };
      case 'enviado':
        return {
          label: 'Enviado',
          bgColor: 'bg-indigo-100',
          textColor: 'text-indigo-800'
        };
      case 'entregue':
        return {
          label: 'Entregue',
          bgColor: 'bg-green-100',
          textColor: 'text-green-800'
        };
      case 'cancelado':
        return {
          label: 'Cancelado',
          bgColor: 'bg-red-100',
          textColor: 'text-red-800'
        };
      default:
        return {
          label: order.status,
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800'
        };
    }
  };
  
  const { label, bgColor, textColor } = getStatusInfo();
  
  // Get total items in order
  const totalItems = order.itens?.reduce((sum, item) => sum + item.quantidade, 0) || 0;

  return (
    <Card className="p-4 hover:shadow-md transition-all">
      <div className="flex flex-col md:flex-row md:items-center">
        <div className="flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
            <div>
              <span className="text-sm text-gray-500">Pedido #</span>
              <span className="font-medium ml-1">{order.id.slice(0, 8)}</span>
            </div>
            <div className={`px-2 py-0.5 rounded-full ${bgColor} ${textColor} text-xs`}>
              {label}
            </div>
          </div>
          
          <div className="flex items-center mb-3">
            <CalendarClock size={14} className="text-gray-500 mr-1" />
            <span className="text-sm text-gray-500">{formatDate(order.created_at)}</span>
          </div>
          
          <div className="flex items-center mb-4">
            {order.cliente ? (
              <>
                <Avatar
                  fallback={order.cliente.nome}
                  size="sm"
                  className="mr-2"
                />
                <div>
                  <p className="font-medium">{order.cliente.nome}</p>
                  <p className="text-xs text-gray-500">{order.cliente.email || order.cliente.telefone || ''}</p>
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-500">Cliente não encontrado</p>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2 text-sm mb-4">
            <div className="bg-gray-100 px-2 py-1 rounded flex items-center">
              <Package size={14} className="mr-1" />
              <span>{totalItems} {totalItems === 1 ? 'item' : 'itens'}</span>
            </div>
            <div className="bg-gray-100 px-2 py-1 rounded">
              <span className="font-medium">Total:</span>{' '}
              <span>{formatCurrency(order.valor_total)}</span>
            </div>
            <div className="bg-gray-100 px-2 py-1 rounded">
              <span className="font-medium">Pagamento:</span>{' '}
              <span>{order.forma_pagamento}</span>
            </div>
          </div>
        </div>
        
        <Button 
          variant="ghost" 
          size="sm"
          className="self-end md:self-center"
          onClick={() => onViewDetails(order.id)}
        >
          Ver Detalhes
          <ChevronRight size={16} className="ml-1" />
        </Button>
      </div>
    </Card>
  );
};

export default OrderItem;
