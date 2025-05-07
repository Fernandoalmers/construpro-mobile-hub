
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CartSummaryProps {
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  totalPoints: number;
}

const CartSummary: React.FC<CartSummaryProps> = ({
  subtotal,
  shipping,
  discount,
  total,
  totalPoints
}) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white shadow-lg rounded-t-xl fixed left-0 right-0 bottom-0 border-t border-gray-200 z-20 pb-16 md:pb-4">
      <div className="max-w-md mx-auto py-4 px-6">
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium">R$ {subtotal.toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Frete</span>
            <span className="font-medium text-amber-600">
              {shipping > 0 ? `R$ ${shipping.toFixed(2)}` : 'A calcular'}
            </span>
          </div>
          
          {discount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Desconto</span>
              <span>-R$ {discount.toFixed(2)}</span>
            </div>
          )}
          
          <div className="flex justify-between font-bold text-lg border-t border-gray-200 pt-3 mt-2">
            <span>Total</span>
            <span>R$ {total.toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between text-orange-500 text-xs items-center">
            <span className="flex items-center">
              <Coins size={16} className="mr-1" /> Pontos a ganhar:
            </span>
            <span className="font-medium">{totalPoints} pontos</span>
          </div>
        </div>
        
        <Button 
          onClick={() => navigate('/checkout')}
          className="w-full h-14 py-4 text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-md"
        >
          <span className="text-lg font-medium">Finalizar Compra</span>
          <ArrowRight size={20} />
        </Button>
      </div>
    </div>
  );
};

export default CartSummary;
