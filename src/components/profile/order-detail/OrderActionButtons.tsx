
import React from 'react';
import { useNavigate } from 'react-router-dom';
import CustomButton from '../../common/CustomButton';
import { toast } from '@/components/ui/sonner';

const OrderActionButtons: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-md">
      <div className="flex gap-3 max-w-lg mx-auto">
        <CustomButton 
          variant="outline" 
          fullWidth
          onClick={() => navigate('/marketplace')}
        >
          Continuar comprando
        </CustomButton>
        
        <CustomButton 
          variant="primary" 
          fullWidth
          onClick={() => {
            // In a real app, this would add all items from this order to cart
            navigate('/marketplace');
            toast.success("Função de comprar novamente ainda não implementada");
          }}
        >
          Comprar novamente
        </CustomButton>
      </div>
    </div>
  );
};

export default OrderActionButtons;
