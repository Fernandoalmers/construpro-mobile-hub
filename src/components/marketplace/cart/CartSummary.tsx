
import React from 'react';
import { useNavigate } from 'react-router-dom';
import CustomButton from '@/components/common/CustomButton';

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
    <div className="bg-white p-6 shadow-md">
      <div className="space-y-3 mb-6">
        <div className="flex justify-between">
          <span className="text-gray-600">Subtotal</span>
          <span className="font-medium">R$ {subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Frete</span>
          <span className="font-medium">R$ {shipping.toFixed(2)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Desconto</span>
            <span>-R$ {discount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-lg border-t border-gray-200 pt-2 mt-2">
          <span>Total</span>
          <span>R$ {total.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-orange-500 text-base">
          <span>Pontos a ganhar</span>
          <span className="font-medium">{totalPoints} pontos</span>
        </div>
      </div>
      
      <CustomButton 
        variant="primary" 
        fullWidth
        size="lg"
        onClick={() => navigate('/checkout')}
        className="py-4 text-lg"
      >
        Finalizar Compra
      </CustomButton>
    </div>
  );
};

export default CartSummary;
