
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Minus } from 'lucide-react';
import { Product } from '@/services/productService';

interface QuantitySelectorProps {
  produto: Product;
  quantidade: number;
  onQuantityChange: (delta: number) => void;
}

const QuantitySelector: React.FC<QuantitySelectorProps> = ({
  produto,
  quantidade,
  onQuantityChange
}) => {
  // Determine if this is a product sold by area (m²)
  const isM2Product = produto?.unidade_medida?.toLowerCase().includes('m²') || 
                    produto?.unidade_medida?.toLowerCase().includes('m2');
  
  const unitLabel = produto?.unidade_medida || 'unidade';

  return (
    <div className="flex items-center mb-4">
      <span className="text-sm font-medium mr-3">Quantidade:</span>
      <div className="flex items-center border rounded-md">
        <Button
          variant="ghost"
          size="sm"
          className="h-9 px-3"
          onClick={() => onQuantityChange(-1)}
          disabled={quantidade <= (isM2Product ? parseFloat(produto.unidade_medida || '1') : 1)}
        >
          <Minus size={16} />
        </Button>
        <div className="px-3 py-1 min-w-[3rem] text-center">
          {quantidade} {unitLabel}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-9 px-3"
          onClick={() => onQuantityChange(1)}
          disabled={quantidade >= (produto?.estoque || 1)}
        >
          <Plus size={16} />
        </Button>
      </div>
    </div>
  );
};

export default QuantitySelector;
