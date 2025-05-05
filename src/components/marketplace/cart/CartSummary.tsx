
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
      <div className="space-y-2 mb-4">
        <div className="flex justify-between">
          <span className="text-gray-600">Subtotal</span>
          <span>R$ {subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Frete</span>
          <span>R$ {shipping.toFixed(2)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Desconto</span>
            <span>-R$ {discount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold">
          <span>Total</span>
          <span>R$ {total.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-construPro-orange text-sm">
          <span>Pontos a ganhar</span>
          <span>{totalPoints} pontos</span>
        </div>
      </div>
      
      <CustomButton 
        variant="primary" 
        fullWidth
        onClick={() => navigate('/checkout')}
      >
        Finalizar Compra
      </CustomButton>
    </div>
  );
};

export default CartSummary;
