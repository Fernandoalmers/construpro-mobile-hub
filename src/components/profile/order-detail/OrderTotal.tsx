
import React from 'react';
import { Separator } from '@/components/ui/separator';
import { OrderData } from '@/services/order/types';
import { Tag } from 'lucide-react';

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
