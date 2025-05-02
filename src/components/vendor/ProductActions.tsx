
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Box } from 'lucide-react';
import CustomButton from '../common/CustomButton';

const ProductActions: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="space-y-4">
      <CustomButton
        variant="primary"
        icon={<Plus size={18} />}
        onClick={() => navigate('/vendor/product-form')}
        fullWidth
      >
        Adicionar novo produto
      </CustomButton>

      <CustomButton
        variant="outline"
        icon={<Box size={18} />}
        onClick={() => navigate('/vendor/product-clone')}
        fullWidth
      >
        Clonar produto existente
      </CustomButton>
    </div>
  );
};

export default ProductActions;
