
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle, Loader2, Ticket, Package, AlertCircle } from 'lucide-react';

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
    <div className="bg-white rounded-md shadow-sm p-4 mb-3">
      <h3 className="flex items-center gap-1 text-sm font-medium mb-3">
        <Ticket className="w-4 h-4 text-gray-600" />
        Cupom de desconto
      </h3>

      {appliedCoupon ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-md px-3 py-2">
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-green-800">{appliedCoupon.code}</p>
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
              disabled={isValidating}
            >
              Remover
            </Button>
          </div>
          
          {/* Informação sobre produtos no carrinho */}
          {cartItems.length > 0 && (
            <div className="text-xs text-gray-500 flex items-center gap-1">
              <Package className="w-3 h-3" />
              <span>Aplicado aos produtos elegíveis no carrinho ({cartItems.length} item{cartItems.length !== 1 ? 's' : ''})</span>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <form onSubmit={handleApplyCoupon} className="space-y-2">
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  value={couponCode}
                  onChange={handleCodeChange}
                  placeholder="Digite seu cupom"
                  className={`h-9 text-sm ${localError ? 'border-red-300' : ''}`}
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
                variant="secondary"
                size="sm"
                className="h-9 bg-blue-100 hover:bg-blue-200 text-blue-800 whitespace-nowrap"
                disabled={!couponCode.trim() || isValidating || cartItems.length === 0}
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
            </div>
          </form>
          
          {/* Informações adicionais */}
          {cartItems.length === 0 && (
            <div className="text-xs text-gray-500 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              <span>Adicione produtos ao carrinho para aplicar cupons</span>
            </div>
          )}
          
          {cartItems.length > 0 && (
            <div className="text-xs text-gray-500 flex items-center gap-1">
              <Package className="w-3 h-3" />
              <span>{cartItems.length} produto{cartItems.length !== 1 ? 's' : ''} no carrinho</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CouponSection;
