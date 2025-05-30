
import React from 'react';
import { Separator } from '@/components/ui/separator';
import { OrderData } from '@/services/order/types';
import { Tag } from 'lucide-react';

interface OrderTotalProps {
  order: OrderData;
}

const OrderTotal: React.FC<OrderTotalProps> = ({ order }) => {
  // Garantir que temos um valor numérico válido
  const valorTotal = Number(order.valor_total) || 0;
  const descontoAplicado = Number(order.desconto_aplicado) || 0;
  
  // Calcular subtotal considerando desconto
  const subtotalOriginal = descontoAplicado > 0 
    ? valorTotal + descontoAplicado
    : valorTotal;
    
  const hasDiscount = descontoAplicado > 0 && order.cupom_codigo;

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
            <span>-R$ {descontoAplicado.toFixed(2)}</span>
          </div>
        )}
        
        <div className="flex justify-between text-sm">
          <span>Frete:</span>
          <span>Grátis</span>
        </div>
        
        <div className="flex justify-between font-medium">
          <span>Total:</span>
          <span>R$ {valorTotal.toFixed(2)}</span>
        </div>
        
        {hasDiscount && (
          <p className="text-xs text-green-600 mt-1">
            ✅ Desconto de R$ {descontoAplicado.toFixed(2)} aplicado
          </p>
        )}
      </div>
    </>
  );
};

export default OrderTotal;
