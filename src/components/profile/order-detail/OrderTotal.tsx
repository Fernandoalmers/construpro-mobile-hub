
import React from 'react';
import { Separator } from '@/components/ui/separator';
import { OrderData } from '@/services/order/types';
import { Tag, Percent } from 'lucide-react';

interface OrderTotalProps {
  order: OrderData;
}

const OrderTotal: React.FC<OrderTotalProps> = ({ order }) => {
  // Calcular subtotal bruto a partir dos itens do pedido
  const subtotalBruto = order.items?.reduce((sum, item) => {
    return sum + (Number(item.preco_unitario) * Number(item.quantidade));
  }, 0) || 0;
  
  // Garantir que temos valores numéricos válidos
  const valorTotal = Number(order.valor_total) || 0;
  const descontoAplicado = Number(order.desconto_aplicado) || 0;
  
  // Verificar se há desconto aplicado - mais rigoroso
  const hasDiscount = descontoAplicado > 0 && order.cupom_codigo && order.cupom_codigo.trim() !== '';

  console.log('[OrderTotal] Cálculos detalhados:', {
    subtotalBruto,
    valorTotal,
    descontoAplicado,
    hasDiscount,
    cupomCodigo: order.cupom_codigo,
    cupomCodigoTrimmed: order.cupom_codigo?.trim(),
    itemsCount: order.items?.length || 0,
    items: order.items?.map(item => ({
      preco: item.preco_unitario,
      quantidade: item.quantidade,
      subtotal: Number(item.preco_unitario) * Number(item.quantidade)
    }))
  });

  return (
    <>
      <Separator className="my-4" />
      
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal:</span>
          <span className="font-medium">R$ {subtotalBruto.toFixed(2)}</span>
        </div>
        
        {hasDiscount && (
          <div className="flex justify-between text-sm bg-green-50 p-2 rounded-md border-l-4 border-green-400">
            <span className="flex items-center gap-2 text-green-700 font-medium">
              <Tag size={16} />
              <span>Desconto aplicado ({order.cupom_codigo}):</span>
            </span>
            <span className="font-semibold text-green-700">-R$ {descontoAplicado.toFixed(2)}</span>
          </div>
        )}
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Frete:</span>
          <span className="text-green-600 font-medium">Grátis</span>
        </div>
        
        <Separator className="my-2" />
        
        <div className="flex justify-between font-semibold text-lg">
          <span>Total:</span>
          <span className="text-construPro-orange">R$ {valorTotal.toFixed(2)}</span>
        </div>
        
        {hasDiscount && (
          <div className="bg-green-100 border border-green-300 p-3 rounded-md">
            <div className="flex items-center gap-2 text-green-800">
              <Percent size={16} />
              <span className="text-sm font-medium">
                Você economizou R$ {descontoAplicado.toFixed(2)} com o cupom {order.cupom_codigo}!
              </span>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default OrderTotal;
