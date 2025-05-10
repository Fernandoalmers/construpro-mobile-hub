
import React from 'react';
import { ArrowRight, ShoppingBag, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface CartSummaryProps {
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  totalPoints: number;
}

const CartSummary: React.FC<CartSummaryProps> = ({ 
  subtotal, 
  discount, 
  shipping, 
  total, 
  totalPoints 
}) => {
  const navigate = useNavigate();
  
  const handleCheckout = () => {
    navigate('/checkout');
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg px-4 pt-4 pb-8 z-30">
      <div className="max-w-2xl mx-auto">
        {/* Summary items */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium">R$ {subtotal.toFixed(2)}</span>
          </div>
          
          {discount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-green-600 font-medium">Desconto</span>
              <span className="text-green-600 font-medium">-R$ {discount.toFixed(2)}</span>
            </div>
          )}
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Frete estimado</span>
            <span className="font-medium">
              {shipping > 0 ? `R$ ${shipping.toFixed(2)}` : "Grátis"}
            </span>
          </div>
          
          <div className="border-t border-gray-200 my-3 pt-2 flex justify-between">
            <span className="font-medium text-base">Total</span>
            <div className="text-right">
              <div className="font-semibold text-lg">R$ {total.toFixed(2)}</div>
              <div className="flex items-center text-xs text-green-700 mt-1 font-medium">
                <Gift size={12} className="mr-1" />
                Ganhe {totalPoints} pontos
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-4">
          <Button 
            onClick={handleCheckout}
            className={cn(
              "w-full py-6 text-base flex items-center justify-center",
              "bg-green-600 hover:bg-green-700"
            )}
          >
            Finalizar Compra
            <ArrowRight size={18} className="ml-2" />
          </Button>
          
          <Button 
            variant="outline"
            className="w-full mt-2 border-gray-300"
            onClick={() => navigate('/marketplace')}
          >
            <ShoppingBag size={16} className="mr-2" />
            Continuar Comprando
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CartSummary;
