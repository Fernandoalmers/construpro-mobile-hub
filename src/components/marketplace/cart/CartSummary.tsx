
import React from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, Trash2, CreditCard, Tag, Package } from 'lucide-react';

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
  return (
    <div className="bg-white rounded-lg border shadow-sm p-6 space-y-4 sticky bottom-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-blue-600" />
          Resumo do Pedido
        </h3>
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <Package className="h-4 w-4" />
          <span>{itemCount} {itemCount === 1 ? 'item' : 'itens'}</span>
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal</span>
          <span className="font-medium">R$ {subtotal.toFixed(2)}</span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Frete</span>
          <span className="font-medium text-green-600">Grátis</span>
        </div>
        
        {discount > 0 && appliedCoupon && (
          <div className="flex justify-between text-sm">
            <span className="flex items-center gap-1 text-green-600">
              <Tag className="h-3 w-3" />
              Desconto ({appliedCoupon.code})
            </span>
            <span className="font-medium text-green-600">-R$ {discount.toFixed(2)}</span>
          </div>
        )}
        
        <Separator />
        
        <div className="flex justify-between text-lg font-bold">
          <span>Total</span>
          <span className="text-blue-600">R$ {total.toFixed(2)}</span>
        </div>
      </div>
      
      {discount > 0 && (
        <div className="text-xs text-green-600 text-center p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center justify-center gap-1">
            <Tag className="h-3 w-3" />
            <span className="font-medium">Você economizou R$ {discount.toFixed(2)}!</span>
          </div>
        </div>
      )}
      
      <div className="space-y-3 pt-2">
        <Button 
          onClick={onCheckout} 
          className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-base font-medium"
          size="lg"
          disabled={itemCount === 0}
        >
          <CreditCard className="h-5 w-5 mr-2" />
          Finalizar Compra
        </Button>
        
        <Button 
          onClick={onClearCart} 
          variant="outline" 
          className="w-full text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400 h-10"
          disabled={itemCount === 0}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Limpar Carrinho
        </Button>
      </div>
    </div>
  );
};

export default CartSummary;
