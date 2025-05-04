
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
  
  // Get the step value based on unit type
  const getStepValue = () => {
    if (isM2Product) {
      if (produto?.unidade_medida) {
        // Extract numeric value from unit measure if present
        const match = produto.unidade_medida.match(/(\d+(\.\d+)?)/);
        return match ? parseFloat(match[0]) : 1;
      }
      return 1;
    }
    return 1;
  };
  
  const step = getStepValue();
  const unitLabel = produto?.unidade_medida || 'unidade';
  
  // Format the quantity display
  const displayQuantity = isM2Product 
    ? `${quantidade} ${unitLabel}`
    : `${quantidade} ${quantidade === 1 ? 'unidade' : 'unidades'}`;

  return (
    <div className="flex flex-col mb-4">
      <div className="flex items-center mb-1">
        <span className="text-sm font-medium mr-3">Quantidade:</span>
        <div className="flex items-center border rounded-md">
          <Button
            variant="ghost"
            size="sm"
            className="h-9 px-3"
            onClick={() => onQuantityChange(-1)}
            disabled={quantidade <= step}
            aria-label="Diminuir quantidade"
          >
            <Minus size={16} />
          </Button>
          <div className="px-3 py-1 min-w-[4.5rem] text-center">
            {displayQuantity}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 px-3"
            onClick={() => onQuantityChange(1)}
            disabled={quantidade >= (produto?.estoque || step)}
            aria-label="Aumentar quantidade"
          >
            <Plus size={16} />
          </Button>
        </div>
      </div>
      
      {/* Add explanation for m² products */}
      {isM2Product && (
        <div className="text-xs text-gray-500 ml-1">
          Incrementos de {step} {unitLabel}
        </div>
      )}
    </div>
  );
};

export default QuantitySelector;
