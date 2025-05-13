
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
    <>
      {/* Sticky summary at bottom - compact version */}
      <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-gray-200 shadow-md px-4 py-2 z-30">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between">
            {/* Summary info - compact version */}
            <div className="flex flex-col">
              <div className="flex items-baseline gap-1">
                <span className="text-sm text-gray-600">Total:</span>
                <span className="font-semibold text-lg">R$ {total.toFixed(2)}</span>
              </div>
              <div className="text-xs text-green-700 font-medium">
                Ganhe {totalPoints} pontos
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <Button 
                variant="outline"
                size="sm"
                className="border-gray-300 text-xs h-7 px-2"
                onClick={() => navigate('/marketplace')}
              >
                <ShoppingBag size={14} className="mr-1" />
                Continuar
              </Button>
              
              <Button 
                onClick={handleCheckout}
                className={cn(
                  "text-xs py-1 h-7 px-3",
                  "bg-green-600 hover:bg-green-700"
                )}
                size="sm"
              >
                Finalizar
                <ArrowRight size={14} className="ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Detailed summary at page bottom - non-sticky */}
      <div className="mt-8 bg-white rounded-lg shadow p-4">
        <h3 className="font-medium text-gray-700 mb-3">Resumo da compra</h3>
        
        <div className="space-y-2">
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
          
          <div className="border-t border-gray-200 my-2 pt-2"></div>
          
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>R$ {total.toFixed(2)}</span>
          </div>
          
          <div className="bg-green-50 border border-green-100 rounded-md p-2 mt-2">
            <div className="flex justify-between items-center">
              <span className="text-green-700 text-sm font-medium">Pontos a receber:</span>
              <span className="text-green-700 font-semibold">{totalPoints} pontos</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CartSummary;
