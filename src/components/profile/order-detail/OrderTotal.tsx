
import React from 'react';
import { Separator } from '@/components/ui/separator';
import { OrderData } from '@/services/order/types';
import { Tag } from 'lucide-react';

interface OrderTotalProps {
  order: OrderData;
}

const OrderTotal: React.FC<OrderTotalProps> = ({ order }) => {
  // Calcular subtotal considerando desconto
  const subtotalOriginal = order.desconto_aplicado 
    ? Number(order.valor_total) + Number(order.desconto_aplicado)
    : Number(order.valor_total);
    
  const hasDiscount = order.desconto_aplicado && Number(order.desconto_aplicado) > 0;

  return (
    <>
      <Separator className="my-4" />
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Subtotal:</span>
          <span>R$ {subtotalOriginal.toFixed(2)}</span>
        </div>
        
        {hasDiscount && (
          <div className="flex justify-between text-sm text-green-600">
            <span className="flex items-center gap-1">
              <Tag size={12} />
              Desconto ({order.cupom_codigo}):
            </span>
            <span>-R$ {Number(order.desconto_aplicado).toFixed(2)}</span>
          </div>
        )}
        
        <div className="flex justify-between text-sm">
          <span>Frete:</span>
          <span>Grátis</span>
        </div>
        
        <div className="flex justify-between font-medium">
          <span>Total:</span>
          <span>R$ {Number(order.valor_total).toFixed(2)}</span>
        </div>
        
        {hasDiscount && (
          <p className="text-xs text-green-600 mt-1">
            ✅ Desconto de R$ {Number(order.desconto_aplicado).toFixed(2)} aplicado
          </p>
        )}
      </div>
    </>
  );
};

export default OrderTotal;
