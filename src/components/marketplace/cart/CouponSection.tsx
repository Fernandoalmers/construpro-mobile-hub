
import React, { useState } from 'react';
import { Check, Ticket, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
  const [isApplying, setIsApplying] = useState(false);

  const handleApply = () => {
    if (!couponCode.trim()) return;
    
    setIsApplying(true);
    // Simulate API delay
    setTimeout(() => {
      onApplyCoupon(couponCode);
      setIsApplying(false);
      setCouponCode('');
    }, 500);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
      <h3 className="font-medium text-gray-700 mb-3 flex items-center">
        <Ticket size={18} className="mr-2 text-construPro-blue" />
        Cupom de desconto
      </h3>
      
      {appliedCoupon ? (
        <div className="flex items-center justify-between bg-green-50 p-3 rounded-md border border-green-200">
          <div className="flex items-center">
            <div className="bg-green-100 w-8 h-8 rounded-full flex items-center justify-center mr-2">
              <Check size={16} className="text-green-600" />
            </div>
            <div>
              <p className="font-medium text-green-700">{appliedCoupon.code}</p>
              <p className="text-xs text-green-600">Desconto de {appliedCoupon.discount}% aplicado</p>
            </div>
          </div>
          <button 
            onClick={onRemoveCoupon}
            className="text-gray-500 hover:text-red-500 p-2 rounded-full hover:bg-gray-100"
            aria-label="Remover cupom"
          >
            <X size={18} />
          </button>
        </div>
      ) : (
        <div className="flex items-stretch gap-2">
          <Input
            placeholder="Digite seu cupom"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            className="flex-1"
          />
          <Button 
            onClick={handleApply} 
            disabled={!couponCode.trim() || isApplying}
            className="whitespace-nowrap bg-construPro-blue hover:bg-blue-700"
          >
            {isApplying ? "Aplicando..." : "Aplicar"}
          </Button>
        </div>
      )}
    </div>
  );
};

export default CouponSection;
