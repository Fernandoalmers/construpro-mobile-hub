
import React from 'react';
import { Calendar, CreditCard, Tag } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { translatePaymentMethod } from '@/utils/paymentTranslation';

interface OrderSummaryCardProps {
  createdAt: string;
  paymentMethod: string;
  hasDiscount: boolean;
  couponCode?: string | null;
  discountAmount: number;
}

const OrderSummaryCard: React.FC<OrderSummaryCardProps> = ({
  createdAt,
  paymentMethod,
  hasDiscount,
  couponCode,
  discountAmount
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <Card className="p-4">
      <h3 className="font-medium mb-3">Resumo do Pedido</h3>
      
      <div className="space-y-3 text-sm">
        <div className="flex items-center gap-2 text-gray-600">
          <Calendar size={16} />
          <span>Realizado em {formatDate(createdAt)}</span>
        </div>
        
        <div className="flex items-center gap-2 text-gray-600">
          <CreditCard size={16} />
          <span>Pagamento: {translatePaymentMethod(paymentMethod)}</span>
        </div>
        
        {hasDiscount && (
          <div className="flex items-center gap-2 text-green-600 bg-green-50 p-2 rounded-md">
            <Tag size={16} />
            <span className="font-medium">
              Cupom aplicado: {couponCode} (Economia: R$ {discountAmount.toFixed(2)})
            </span>
          </div>
        )}
      </div>
    </Card>
  );
};

export default OrderSummaryCard;
