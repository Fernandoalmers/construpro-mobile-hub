
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

const OrderActionButtons: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-md">
      <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
        <Button 
          variant="default" 
          className="w-full"
          onClick={() => navigate('/profile/orders')}
        >
          <ShoppingBag size={18} className="mr-2" />
          Meus Pedidos
        </Button>
        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => navigate('/marketplace')}
        >
          <Home size={18} className="mr-2" />
          Continuar
        </Button>
      </div>
    </div>
  );
};

export default OrderActionButtons;
