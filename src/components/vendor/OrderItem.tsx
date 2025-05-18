
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { VendorOrder } from "@/services/vendor/orders";

interface OrderItemProps {
  order: VendorOrder;
  onViewDetails: (orderId: string) => void;
}

const OrderItem: React.FC<OrderItemProps> = ({ order, onViewDetails }) => {
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (error) {
      console.error("Date formatting error:", error);
      return "Data inválida";
    }
  };

  const formatCurrency = (value: number | undefined | null) => {
    if (value === undefined || value === null) return "R$ 0,00";
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusBadge = () => {
    if (!order.status) return <Badge>Status desconhecido</Badge>;
    
    const status = order.status.toLowerCase();
    switch (status) {
      case 'pendente':
        return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
      case 'aprovado':
      case 'confirmado':
        return <Badge className="bg-blue-100 text-blue-800">Confirmado</Badge>;
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

  const getOrderId = () => {
    if (!order.id) return 'Sem ID';
    return order.id.substring(0, 8);
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-medium">Pedido #{getOrderId()}</h3>
              {getStatusBadge()}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {order.created_at ? formatDate(order.created_at) : "Data não disponível"}
            </p>
          </div>
          <div className="text-right">
            <p className="font-medium text-lg">
              {formatCurrency(Number(order.valor_total))}
            </p>
            <p className="text-sm">{order.cliente?.nome || 'Cliente'}</p>
          </div>
        </div>
        
        <div className="mt-3 text-sm text-gray-600">
          <p>Itens: {order.itens?.length || 0}</p>
          <p>Pagamento: {order.forma_pagamento || "Não especificado"}</p>
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
