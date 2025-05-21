
import React from 'react';
import { Separator } from '@/components/ui/separator';
import { OrderData } from '@/services/order/types';

interface OrderTotalProps {
  order: OrderData;
}

const OrderTotal: React.FC<OrderTotalProps> = ({ order }) => {
  return (
    <>
      <Separator className="my-4" />
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Subtotal:</span>
          <span>R$ {Number(order.valor_total).toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Frete:</span>
          <span>Grátis</span>
        </div>
        <div className="flex justify-between font-medium">
          <span>Total:</span>
          <span>R$ {Number(order.valor_total).toFixed(2)}</span>
        </div>
      </div>
    </>
  );
};

export default OrderTotal;
