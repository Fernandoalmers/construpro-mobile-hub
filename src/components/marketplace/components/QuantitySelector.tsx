
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
  // Get unit type
  const unidadeMedida = produto?.unidade_medida?.toLowerCase();
  
  // Determine if this is a special unit that allows fractions
  const isM2Product = unidadeMedida?.includes('m²') || unidadeMedida?.includes('m2');
  const isBarraProduct = unidadeMedida?.includes('barra');
  const isRoloProduct = unidadeMedida?.includes('rolo');
  const isFractionalProduct = isM2Product || isBarraProduct || isRoloProduct || 
                             unidadeMedida?.includes('litro') || unidadeMedida?.includes('kg');
  
  // Get the step value based on unit type
  const getStepValue = () => {
    if (isBarraProduct) return 0.5; // Permite meia barra
    if (isRoloProduct) return 0.1; // Permite décimos de rolo
    
    if (isM2Product && produto?.unidade_medida) {
      // Extract numeric value from unit measure if present
      const match = produto.unidade_medida.match(/(\d+(\.\d+)?)/);
      return match ? parseFloat(match[0]) : 1;
    }
    
    if (unidadeMedida?.includes('litro') || unidadeMedida?.includes('kg')) {
      return 0.1; // Permite décimos
    }
    
    return 1; // Default para unidade, caixa, pacote, saco
  };
  
  const step = getStepValue();
  const unitLabel = produto?.unidade_medida || 'unidade';
  
  // Format the quantity display
  const displayQuantity = isFractionalProduct 
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
      
      {/* Add explanation for fractional products */}
      {isFractionalProduct && step !== 1 && (
        <div className="text-xs text-gray-500 ml-1">
          {isBarraProduct && 'Pode ser vendido em meias barras (0.5)'}
          {isRoloProduct && 'Vendido por metragem fracionada'}
          {isM2Product && `Incrementos de ${step} ${unitLabel}`}
          {(unidadeMedida?.includes('litro') || unidadeMedida?.includes('kg')) && 'Permite quantidades decimais'}
        </div>
      )}
    </div>
  );
};

export default QuantitySelector;
