
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { ShoppingCart, ArrowRight } from 'lucide-react';

interface CartPopupProps {
  cartCount: number;
  cartTotal: number;
  onClose: () => void;
}

const CartPopup: React.FC<CartPopupProps> = ({ cartCount, cartTotal, onClose }) => {
  const navigate = useNavigate();
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  
  const goToCart = () => {
    navigate('/cart');
    onClose();
  };

  return (
    <Card className="shadow-lg animate-fade-in">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="bg-green-100 rounded-full p-2">
            <ShoppingCart size={20} className="text-green-600" />
          </div>
          <div>
            <h3 className="font-medium">Produto adicionado</h3>
            <p className="text-sm text-gray-600">
              {cartCount} {cartCount === 1 ? 'item' : 'itens'} no carrinho
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center border-t p-4">
        <div>
          <p className="text-sm text-gray-600">Total:</p>
          <p className="font-bold text-lg">{formatCurrency(cartTotal)}</p>
        </div>
        <Button onClick={goToCart}>
          Ver Carrinho <ArrowRight size={16} className="ml-1" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CartPopup;
