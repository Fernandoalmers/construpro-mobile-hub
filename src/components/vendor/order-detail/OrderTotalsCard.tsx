
import React from 'react';
import { Tag, Percent } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface OrderTotalsCardProps {
  subtotal: number;
  total: number;
  hasDiscount: boolean;
  discountAmount: number;
  couponCode?: string | null;
}

const OrderTotalsCard: React.FC<OrderTotalsCardProps> = ({
  subtotal,
  total,
  hasDiscount,
  discountAmount,
  couponCode
}) => {
  return (
    <Card className="p-4">
      <Separator className="my-4" />
      
      {/* Order Total */}
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal:</span>
          <span className="font-medium">R$ {subtotal.toFixed(2)}</span>
        </div>
        
        {hasDiscount && (
          <div className="flex justify-between text-sm bg-green-50 p-2 rounded-md border-l-4 border-green-400">
            <span className="flex items-center gap-2 text-green-700 font-medium">
              <Tag size={16} />
              <span>Desconto aplicado ({couponCode}):</span>
            </span>
            <span className="font-semibold text-green-700">-R$ {discountAmount.toFixed(2)}</span>
          </div>
        )}
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Frete:</span>
          <span className="text-green-600 font-medium">Grátis</span>
        </div>
        
        <Separator className="my-2" />
        
        <div className="flex justify-between font-semibold text-lg">
          <span>Total:</span>
          <span className="text-construPro-orange">R$ {total.toFixed(2)}</span>
        </div>
        
        {hasDiscount && (
          <div className="bg-green-100 border border-green-300 p-3 rounded-md">
            <div className="flex items-center gap-2 text-green-800">
              <Percent size={16} />
              <span className="text-sm font-medium">
                Cliente economizou R$ {discountAmount.toFixed(2)} com o cupom {couponCode}!
              </span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default OrderTotalsCard;
