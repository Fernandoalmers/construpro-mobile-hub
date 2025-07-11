
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle, Loader2, Ticket, Package, AlertCircle, Gift, X } from 'lucide-react';

interface CouponSectionProps {
  appliedCoupon: {code: string, discount: number} | null;
  onApplyCoupon: (code: string) => void;
  onRemoveCoupon: () => void;
  cartItems?: any[];
  isValidating?: boolean;
}

const CouponSection: React.FC<CouponSectionProps> = ({ 
  appliedCoupon, 
  onApplyCoupon, 
  onRemoveCoupon,
  cartItems = [],
  isValidating = false
}) => {
  const [couponCode, setCouponCode] = useState('');
  const [localError, setLocalError] = useState<string>('');

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    
    setLocalError('');
    
    if (!couponCode.trim()) {
      setLocalError('Digite um código de cupom');
      return;
    }
    
    if (couponCode.trim().length < 3) {
      setLocalError('Código muito curto');
      return;
    }
    
    if (cartItems.length === 0) {
      setLocalError('Adicione produtos ao carrinho primeiro');
      return;
    }
    
    onApplyCoupon(couponCode.trim());
    setCouponCode('');
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setCouponCode(value);
    
    if (localError) {
      setLocalError('');
    }
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200/50 p-3 mb-3 shadow-sm">
      <h3 className="flex items-center gap-2 text-sm font-bold mb-2 text-gray-800">
        <Gift className="w-4 h-4 text-blue-600" />
        Cupom de desconto
      </h3>

      {appliedCoupon ? (
        <div className="flex items-center justify-between bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg px-3 py-2 shadow-sm">
          <div className="flex items-center">
            <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
            <div>
              <p className="text-sm font-bold text-green-800">{appliedCoupon.code}</p>
              <p className="text-xs text-green-700">
                Desconto de R$ {appliedCoupon.discount.toFixed(2)}
              </p>
            </div>
          </div>
          
          <Button 
            variant="ghost" 
            size="sm"
            className="h-7 w-7 p-0 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
            onClick={onRemoveCoupon}
            disabled={isValidating}
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      ) : (
        <form onSubmit={handleApplyCoupon} className="space-y-2">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                value={couponCode}
                onChange={handleCodeChange}
                placeholder="Digite seu cupom"
                className={`h-9 text-sm rounded-lg ${localError ? 'border-red-300' : 'border-gray-300'}`}
                disabled={isValidating}
                maxLength={20}
              />
              {localError && (
                <div className="flex items-center gap-1 mt-1 text-xs text-red-600">
                  <AlertCircle className="w-3 h-3" />
                  <span>{localError}</span>
                </div>
              )}
            </div>
            
            <Button 
              type="submit" 
              className="h-9 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm rounded-lg transition-all duration-200 hover:scale-105 shadow-md"
              disabled={!couponCode.trim() || isValidating || cartItems.length === 0}
            >
              {isValidating ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <>
                  <Ticket className="w-3 h-3 mr-1" />
                  Aplicar
                </>
              )}
            </Button>
          </div>
          
          {cartItems.length === 0 ? (
            <div className="text-xs text-amber-700 flex items-center gap-1 bg-amber-50 p-2 rounded-lg border border-amber-200">
              <AlertCircle className="w-3 h-3" />
              <span>Adicione produtos para aplicar cupons</span>
            </div>
          ) : (
            <div className="text-xs text-gray-600 flex items-center gap-1">
              <Package className="w-3 h-3" />
              <span>Desconto aplicado aos produtos elegíveis</span>
            </div>
          )}
        </form>
      )}
    </div>
  );
};

export default CouponSection;
