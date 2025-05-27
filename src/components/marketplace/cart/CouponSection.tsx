
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle, Loader2, Ticket } from 'lucide-react';

interface CouponSectionProps {
  appliedCoupon: {code: string, discount: number} | null;
  onApplyCoupon: (code: string, orderValue?: number) => void;
  onRemoveCoupon: () => void;
  orderValue?: number;
  isValidating?: boolean;
}

const CouponSection: React.FC<CouponSectionProps> = ({ 
  appliedCoupon, 
  onApplyCoupon, 
  onRemoveCoupon,
  orderValue = 0,
  isValidating = false
}) => {
  const [couponCode, setCouponCode] = useState('');

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!couponCode.trim()) return;
    
    onApplyCoupon(couponCode, orderValue);
    setCouponCode('');
  };

  return (
    <div className="bg-white rounded-md shadow-sm p-4 mb-3">
      <h3 className="flex items-center gap-1 text-sm font-medium mb-3">
        <Ticket className="w-4 h-4 text-gray-600" />
        Cupom de desconto
      </h3>

      {appliedCoupon ? (
        <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-md px-3 py-2">
          <div className="flex items-center">
            <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
            <div>
              <p className="text-sm font-medium">{appliedCoupon.code}</p>
              <p className="text-xs text-green-700">
                Desconto de R$ {appliedCoupon.discount.toFixed(2)} aplicado
              </p>
            </div>
          </div>
          
          <Button 
            variant="ghost" 
            size="sm"
            className="h-8 text-xs text-gray-600 hover:text-red-600"
            onClick={onRemoveCoupon}
          >
            Remover
          </Button>
        </div>
      ) : (
        <form onSubmit={handleApplyCoupon} className="flex gap-2">
          <Input
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            placeholder="Digite seu cupom"
            className="h-9 text-sm"
            disabled={isValidating}
          />
          <Button 
            type="submit" 
            variant="secondary"
            size="sm"
            className="h-9 bg-blue-100 hover:bg-blue-200 text-blue-800 whitespace-nowrap"
            disabled={!couponCode.trim() || isValidating}
          >
            {isValidating ? (
              <span className="flex items-center">
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                Validando...
              </span>
            ) : (
              'Aplicar'
            )}
          </Button>
        </form>
      )}
    </div>
  );
};

export default CouponSection;
