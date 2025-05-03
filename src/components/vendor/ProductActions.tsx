
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, UploadCloud } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ProductActions: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex justify-between items-center mb-4">
      <Button 
        onClick={() => navigate('/vendor/product-new')}
        className="flex items-center gap-2"
      >
        <Plus size={16} />
        Novo Produto
      </Button>
      
      <Button 
        variant="outline"
        className="flex items-center gap-2"
        onClick={() => navigate('/vendor/product-import')}
      >
        <UploadCloud size={16} />
        Importar
      </Button>
    </div>
  );
};

export default ProductActions;
