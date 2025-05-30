
import React from 'react';
import { Separator } from '@/components/ui/separator';
import { OrderData } from '@/services/order/types';
import { Tag } from 'lucide-react';

interface OrderTotalProps {
  order: OrderData;
}

const OrderTotal: React.FC<OrderTotalProps> = ({ order }) => {
  // Garantir que temos valores numéricos válidos
  const valorTotal = Number(order.valor_total) || 0;
  const descontoAplicado = Number(order.desconto_aplicado) || 0;
  
  // Calcular subtotal bruto (valor original antes do desconto)
  const subtotalBruto = descontoAplicado > 0 
    ? valorTotal + descontoAplicado
    : valorTotal;
    
  const hasDiscount = descontoAplicado > 0 && order.cupom_codigo;

  return (
    <>
      <Separator className="my-4" />
      
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span>Subtotal:</span>
          <span className="font-medium">R$ {subtotalBruto.toFixed(2)}</span>
        </div>
        
        {hasDiscount && (
          <div className="flex justify-between text-sm text-green-600">
            <span className="flex items-center gap-1">
              <Tag size={14} />
              Desconto ({order.cupom_codigo}):
            </span>
            <span className="font-medium">-R$ {descontoAplicado.toFixed(2)}</span>
          </div>
        )}
        
        <div className="flex justify-between text-sm">
          <span>Frete:</span>
          <span className="text-green-600 font-medium">Grátis</span>
        </div>
        
        <Separator className="my-2" />
        
        <div className="flex justify-between font-semibold text-lg">
          <span>Total:</span>
          <span className="text-construPro-orange">R$ {valorTotal.toFixed(2)}</span>
        </div>
        
        {hasDiscount && (
          <div className="bg-green-50 p-2 rounded-md">
            <p className="text-xs text-green-700 text-center">
              ✅ Desconto de R$ {descontoAplicado.toFixed(2)} aplicado com sucesso!
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default OrderTotal;
