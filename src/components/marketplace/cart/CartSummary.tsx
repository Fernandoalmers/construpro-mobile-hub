
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
    <div className="bg-white/95 backdrop-blur-lg rounded-xl border border-gray-200/50 shadow-xl p-4 space-y-3 sticky bottom-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-base flex items-center gap-2 text-gray-800">
          <ShoppingCart className="h-4 w-4 text-blue-600" />
          Resumo do Pedido
        </h3>
        <div className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
          <Package className="h-3 w-3" />
          <span>{itemCount} {itemCount === 1 ? 'item' : 'itens'}</span>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal</span>
          <span className="font-medium text-gray-800">R$ {subtotal.toFixed(2)}</span>
        </div>
        
        {/* Linha de desconto - sempre mostrar quando há cupom aplicado */}
        {appliedCoupon && discount > 0 && (
          <div className="flex justify-between text-sm bg-green-50 p-2 rounded-lg border-l-4 border-green-400">
            <span className="flex items-center gap-1 text-green-700 font-medium">
              <Tag className="h-3 w-3" />
              Desconto ({appliedCoupon.code})
            </span>
            <span className="font-bold text-green-700">-R$ {discount.toFixed(2)}</span>
          </div>
        )}
        
        <Separator className="my-2" />
        
        <div className="flex justify-between text-base font-bold bg-blue-50 p-2 rounded-lg">
          <span className="text-gray-800">Total</span>
          <span className="text-blue-600">R$ {total.toFixed(2)}</span>
        </div>
      </div>
      
      {/* Destaque de economia quando há desconto */}
      {appliedCoupon && discount > 0 && (
        <div className="text-sm text-green-700 text-center p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 shadow-sm">
          <div className="flex items-center justify-center gap-2">
            <Tag className="h-4 w-4" />
            <span className="font-bold">🎉 Você economizou R$ {discount.toFixed(2)}!</span>
          </div>
        </div>
      )}
      
      <div className="space-y-2 pt-2">
        <Button 
          onClick={onCheckout} 
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white h-12 text-sm font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
          size="lg"
          disabled={itemCount === 0}
        >
          <CreditCard className="h-4 w-4 mr-2" />
          Finalizar Compra
        </Button>
        
        <Button 
          onClick={onClearCart} 
          variant="outline" 
          className="w-full text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400 h-9 text-sm rounded-xl transition-all duration-200 hover:scale-105"
          disabled={itemCount === 0}
        >
          <Trash2 className="h-3 w-3 mr-2" />
          Limpar Carrinho
        </Button>
      </div>
    </div>
  );
};

export default CartSummary;
