
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, Trash2, CreditCard, Tag, Package, Loader2 } from 'lucide-react';

interface CartSummaryProps {
  subtotal: number;
  discount: number;
  total: number;
  onCheckout: () => void;
  onClearCart: () => void;
  itemCount: number;
  appliedCoupon?: {code: string, discount: number} | null;
}

const CartSummary: React.FC<CartSummaryProps> = ({
  subtotal,
  discount,
  total,
  onCheckout,
  onClearCart,
  itemCount,
  appliedCoupon
}) => {
  const [isClearingCart, setIsClearingCart] = useState(false);

  const handleClearCart = async () => {
    if (itemCount === 0) return;
    
    // Confirm before clearing
    if (!window.confirm('Tem certeza que deseja limpar todo o carrinho?')) {
      return;
    }
    
    try {
      setIsClearingCart(true);
      console.log('[CartSummary] Clearing cart...');
      await onClearCart();
      console.log('[CartSummary] Cart cleared successfully');
    } catch (error) {
      console.error('[CartSummary] Error clearing cart:', error);
    } finally {
      setIsClearingCart(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border shadow-sm p-3 space-y-2 sticky bottom-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <ShoppingCart className="h-3.5 w-3.5 text-blue-600" />
          Resumo do Pedido
        </h3>
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Package className="h-2.5 w-2.5" />
          <span>{itemCount} {itemCount === 1 ? 'item' : 'itens'}</span>
        </div>
      </div>
      
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-gray-600">Subtotal</span>
          <span className="font-medium">R$ {subtotal.toFixed(2)}</span>
        </div>
        
        <div className="flex justify-between text-xs">
          <span className="text-gray-600">Frete</span>
          <span className="font-medium text-green-600">Grátis</span>
        </div>
        
        {/* Linha de desconto - sempre mostrar quando há cupom aplicado */}
        {appliedCoupon && discount > 0 && (
          <div className="flex justify-between text-xs">
            <span className="flex items-center gap-1 text-green-600">
              <Tag className="h-2.5 w-2.5" />
              Desconto ({appliedCoupon.code})
            </span>
            <span className="font-medium text-green-600">-R$ {discount.toFixed(2)}</span>
          </div>
        )}
        
        <Separator />
        
        <div className="flex justify-between text-sm font-bold">
          <span>Total</span>
          <span className="text-blue-600">R$ {total.toFixed(2)}</span>
        </div>
      </div>
      
      {/* Destaque de economia quando há desconto */}
      {appliedCoupon && discount > 0 && (
        <div className="text-xs text-green-600 text-center p-1.5 bg-green-50 rounded-md border border-green-200">
          <div className="flex items-center justify-center gap-1">
            <Tag className="h-2.5 w-2.5" />
            <span className="font-medium">Você economizou R$ {discount.toFixed(2)}!</span>
          </div>
        </div>
      )}
      
      <div className="space-y-1.5 pt-1">
        <Button 
          onClick={onCheckout} 
          className="w-full bg-blue-600 hover:bg-blue-700 text-white h-9 text-xs font-medium"
          size="lg"
          disabled={itemCount === 0}
        >
          <CreditCard className="h-3.5 w-3.5 mr-2" />
          Finalizar Compra
        </Button>
        
        <Button 
          onClick={handleClearCart} 
          variant="outline" 
          className="w-full text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400 h-7 text-xs"
          disabled={itemCount === 0 || isClearingCart}
        >
          {isClearingCart ? (
            <Loader2 className="h-2.5 w-2.5 mr-2 animate-spin" />
          ) : (
            <Trash2 className="h-2.5 w-2.5 mr-2" />
          )}
          {isClearingCart ? 'Limpando...' : 'Limpar Carrinho'}
        </Button>
      </div>
    </div>
  );
};

export default CartSummary;
