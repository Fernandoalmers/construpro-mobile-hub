
import React from 'react';
import { Card } from '@/components/ui/card';
import { VendorOrder } from '@/services/vendor/orders';

interface OrderStatsProps {
  orders: VendorOrder[];
}

const OrderStats: React.FC<OrderStatsProps> = ({ orders }) => {
  return (
    <div className="grid grid-cols-3 gap-4">
      <Card className="p-4 text-center">
        <p className="text-gray-500 text-sm">Pedidos Pendentes</p>
        <p className="text-xl font-bold">
          {orders.filter(order => order.status && order.status.toLowerCase() === 'pendente').length}
        </p>
      </Card>
      
      <Card className="p-4 text-center">
        <p className="text-gray-500 text-sm">Pedidos Recentes</p>
        <p className="text-xl font-bold">
          {orders.filter(order => {
            const orderDate = new Date(order.created_at);
            const threeDaysAgo = new Date();
            threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
            return orderDate > threeDaysAgo;
          }).length}
        </p>
      </Card>
      
      <Card className="p-4 text-center">
        <p className="text-gray-500 text-sm">Total Vendido</p>
        <p className="text-xl font-bold">
          {new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
          }).format(
            orders.reduce((sum, order) => sum + Number(order.valor_total || 0), 0)
          )}
        </p>
      </Card>
    </div>
  );
};

export default OrderStats;
