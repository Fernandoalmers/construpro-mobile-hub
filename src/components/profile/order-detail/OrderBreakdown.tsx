
import React from 'react';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tag, Truck, Receipt } from 'lucide-react';

interface OrderBreakdownProps {
  valorProdutos: number;
  valorFreteTotal: number;
  descontoAplicado: number;
  valorTotal: number;
  cupomCodigo?: string;
}

const OrderBreakdown: React.FC<OrderBreakdownProps> = ({
  valorProdutos,
  valorFreteTotal,
  descontoAplicado,
  valorTotal,
  cupomCodigo
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const hasDiscount = descontoAplicado > 0 && cupomCodigo;

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <Receipt size={20} className="text-gray-600" />
        <h3 className="font-semibold text-lg">Resumo do Pedido</h3>
      </div>

      <div className="space-y-3">
        {/* Valor dos produtos */}
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Produtos</span>
          <span className="font-medium">{formatCurrency(valorProdutos)}</span>
        </div>

        {/* Frete */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Truck size={16} className="text-gray-500" />
            <span className="text-gray-600">Frete</span>
          </div>
          <span className="font-medium">
            {valorFreteTotal > 0 ? formatCurrency(valorFreteTotal) : 'Grátis'}
          </span>
        </div>

        {/* Desconto */}
        {hasDiscount && (
          <div className="flex justify-between items-center text-green-600">
            <div className="flex items-center gap-2">
              <Tag size={16} />
              <span>Desconto ({cupomCodigo})</span>
            </div>
            <span className="font-medium">-{formatCurrency(descontoAplicado)}</span>
          </div>
        )}

        <Separator className="my-3" />

        {/* Total */}
        <div className="flex justify-between items-center text-lg font-bold">
          <span>Total</span>
          <span className="text-construPro-blue">{formatCurrency(valorTotal)}</span>
        </div>

        {hasDiscount && (
          <div className="text-sm text-green-600 text-center bg-green-50 py-2 px-3 rounded-md">
            ✅ Você economizou {formatCurrency(descontoAplicado)} com o cupom {cupomCodigo}
          </div>
        )}
      </div>
    </Card>
  );
};

export default OrderBreakdown;
