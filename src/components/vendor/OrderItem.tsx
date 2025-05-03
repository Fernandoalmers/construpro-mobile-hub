
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { VendorOrder } from "@/services/vendorService";

interface OrderItemProps {
  order: VendorOrder;
  onViewDetails: (orderId: string) => void;
}

const OrderItem: React.FC<OrderItemProps> = ({ order, onViewDetails }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusBadge = () => {
    switch (order.status) {
      case 'pendente':
        return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
      case 'aprovado':
        return <Badge className="bg-blue-100 text-blue-800">Aprovado</Badge>;
      case 'processando':
        return <Badge className="bg-purple-100 text-purple-800">Processando</Badge>;
      case 'enviado':
        return <Badge className="bg-indigo-100 text-indigo-800">Enviado</Badge>;
      case 'entregue':
        return <Badge className="bg-green-100 text-green-800">Entregue</Badge>;
      case 'cancelado':
        return <Badge className="bg-red-100 text-red-800">Cancelado</Badge>;
      default:
        return <Badge>{order.status}</Badge>;
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-medium">Pedido #{order.id.substring(0, 8)}</h3>
              {getStatusBadge()}
            </div>
            <p className="text-sm text-gray-500 mt-1">{formatDate(order.created_at)}</p>
          </div>
          <div className="text-right">
            <p className="font-medium text-lg">{formatCurrency(order.valor_total)}</p>
            <p className="text-sm">{order.cliente?.nome || 'Cliente'}</p>
          </div>
        </div>
        
        <div className="mt-3 text-sm text-gray-600">
          <p>Itens: {order.itens?.length || 0}</p>
          <p>Pagamento: {order.forma_pagamento}</p>
        </div>
        
        <div className="mt-4 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            onClick={() => onViewDetails(order.id)}
          >
            Ver detalhes
            <ArrowRight size={16} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderItem;
