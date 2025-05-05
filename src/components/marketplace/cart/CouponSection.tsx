
import React, { useState } from 'react';
import { Ticket } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/sonner';
import Card from '@/components/common/Card';

interface CouponSectionProps {
  appliedCoupon: {code: string, discount: number} | null;
  onApplyCoupon: (code: string) => void;
  onRemoveCoupon: () => void;
}

const CouponSection: React.FC<CouponSectionProps> = ({
  appliedCoupon,
  onApplyCoupon,
  onRemoveCoupon
}) => {
  const [couponCode, setCouponCode] = useState('');

  const handleApplyCoupon = () => {
    if (!couponCode) {
      toast.error('Digite um cupom válido');
      return;
    }
    onApplyCoupon(couponCode);
  };

  return (
    <Card className="p-4">
      <h3 className="text-sm font-medium mb-3">Cupom de desconto</h3>
      {appliedCoupon ? (
        <div className="flex items-center justify-between bg-green-50 p-3 rounded-md">
          <div className="flex items-center">
            <Ticket size={18} className="text-green-600 mr-2" />
            <div>
              <p className="text-sm font-medium">{appliedCoupon.code.toUpperCase()}</p>
              <p className="text-xs text-green-600">Desconto de {appliedCoupon.discount}% aplicado</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onRemoveCoupon} className="h-8">
            Remover
          </Button>
        </div>
      ) : (
        <div className="flex gap-2">
          <Input
            placeholder="Digite seu cupom"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            className="flex-1"
          />
          <Button onClick={handleApplyCoupon}>Aplicar</Button>
        </div>
      )}
    </Card>
  );
};

export default CouponSection;
