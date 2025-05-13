
import React from 'react';
import { ArrowRight, ShoppingBag } from 'lucide-react';
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
    <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-gray-200 shadow-md px-4 py-3 z-30">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between">
          {/* Summary info - compact version */}
          <div className="flex flex-col">
            <div className="flex items-baseline gap-1">
              <span className="text-sm text-gray-600">Total:</span>
              <span className="font-semibold text-lg">R$ {total.toFixed(2)}</span>
            </div>
            <div className="text-xs text-green-700">
              Ganhe {totalPoints} pontos
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <Button 
              variant="outline"
              size="sm"
              className="border-gray-300 text-sm h-8"
              onClick={() => navigate('/marketplace')}
            >
              <ShoppingBag size={14} className="mr-1" />
              Continuar
            </Button>
            
            <Button 
              onClick={handleCheckout}
              className={cn(
                "text-sm py-1 h-8 flex items-center justify-center",
                "bg-green-600 hover:bg-green-700"
              )}
              size="sm"
            >
              Finalizar
              <ArrowRight size={14} className="ml-1" />
            </Button>
          </div>
        </div>
        
        {/* Expandable details - shown on click or hover */}
        <details className="text-xs mt-1">
          <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
            Ver detalhes
          </summary>
          <div className="pt-2 space-y-1 animate-fade-in">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span>R$ {subtotal.toFixed(2)}</span>
            </div>
            
            {discount > 0 && (
              <div className="flex justify-between">
                <span className="text-green-600">Desconto</span>
                <span className="text-green-600">-R$ {discount.toFixed(2)}</span>
              </div>
            )}
            
            <div className="flex justify-between">
              <span className="text-gray-600">Frete estimado</span>
              <span>
                {shipping > 0 ? `R$ ${shipping.toFixed(2)}` : "Grátis"}
              </span>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
};

export default CartSummary;
