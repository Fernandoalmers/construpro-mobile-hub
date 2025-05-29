
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle, Loader2, Ticket, Package, AlertCircle, Gift } from 'lucide-react';

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
    
    // Limpar erro anterior
    setLocalError('');
    
    // Validações locais
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
    
    console.log('[CouponSection] Applying coupon:', {
      code: couponCode.trim(),
      cartItemsCount: cartItems.length
    });
    
    onApplyCoupon(couponCode.trim());
    setCouponCode('');
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setCouponCode(value);
    
    // Limpar erro quando usuário digita
    if (localError) {
      setLocalError('');
    }
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 p-4 mb-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold mb-3 text-gray-800">
        <Gift className="w-5 h-5 text-blue-600" />
        Cupom de desconto
        {cartItems.length > 0 && (
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
            {cartItems.length} {cartItems.length === 1 ? 'produto' : 'produtos'}
          </span>
        )}
      </h3>

      {appliedCoupon ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-4 py-3">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
              <div>
                <p className="text-sm font-semibold text-green-800">{appliedCoupon.code}</p>
                <p className="text-xs text-green-700">
                  Desconto de R$ {appliedCoupon.discount.toFixed(2)} aplicado
                </p>
              </div>
            </div>
            
            <Button 
              variant="ghost" 
              size="sm"
              className="h-8 px-3 text-xs text-gray-600 hover:text-red-600 hover:bg-red-50"
              onClick={onRemoveCoupon}
              disabled={isValidating}
            >
              Remover
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <form onSubmit={handleApplyCoupon} className="space-y-3">
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  value={couponCode}
                  onChange={handleCodeChange}
                  placeholder="Digite seu cupom (ex: DESCONTO10)"
                  className={`h-10 text-sm ${localError ? 'border-red-300 focus:border-red-500' : 'border-blue-300 focus:border-blue-500'}`}
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
                className="h-10 px-6 bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap"
                disabled={!couponCode.trim() || isValidating || cartItems.length === 0}
              >
                {isValidating ? (
                  <span className="flex items-center">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Validando...
                  </span>
                ) : (
                  <>
                    <Ticket className="w-4 h-4 mr-2" />
                    Aplicar
                  </>
                )}
              </Button>
            </div>
          </form>
          
          {/* Informações adicionais */}
          {cartItems.length === 0 ? (
            <div className="text-xs text-amber-600 flex items-center gap-1 bg-amber-50 p-2 rounded border border-amber-200">
              <AlertCircle className="w-3 h-3" />
              <span>Adicione produtos ao carrinho para aplicar cupons</span>
            </div>
          ) : (
            <div className="text-xs text-gray-600 flex items-center gap-1">
              <Package className="w-3 h-3" />
              <span>Cupom será aplicado aos produtos elegíveis do seu carrinho</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CouponSection;
