
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
  // Debug logs - REMOVE AFTER FIXING
  console.log('🔍 [QuantitySelector] Produto recebido:', {
    id: produto?.id,
    nome: produto?.nome,
    controle_quantidade: produto?.controle_quantidade,
    valor_conversao: produto?.valor_conversao,
    unidade_medida: produto?.unidade_medida,
    produto_completo: produto
  });

  // Get unit type
  const unidadeMedida = produto?.unidade_medida?.toLowerCase();
  
  // Check if product is sold by multiples of packaging
  const isMultiplePackaging = produto?.controle_quantidade === 'multiplo';
  
  // Determine if this is a special unit that allows fractions
  const isM2Product = unidadeMedida?.includes('m²') || unidadeMedida?.includes('m2');
  const isBarraProduct = unidadeMedida?.includes('barra');
  const isRoloProduct = unidadeMedida?.includes('rolo');
  const isFractionalProduct = isM2Product || isBarraProduct || isRoloProduct || 
                             unidadeMedida?.includes('litro') || unidadeMedida?.includes('kg');
  
  // Debug logs for conditions - REMOVE AFTER FIXING
  console.log('🔍 [QuantitySelector] Condições calculadas:', {
    unidadeMedida,
    isMultiplePackaging,
    isM2Product,
    isFractionalProduct
  });
  
  // Get the step value based on unit type and packaging control
  const getStepValue = () => {
    // For products with multiple packaging control, step is always 1 (representing 1 box/package)
    if (isMultiplePackaging) {
      return 1;
    }
    
    // Use valor_conversao when available (for m², kg, litro, etc.)
    if (produto?.valor_conversao && produto.valor_conversao > 0) {
      return produto.valor_conversao;
    }
    
    if (isBarraProduct) return 0.5; // Permite meia barra
    if (isRoloProduct) return 0.1; // Permite décimos de rolo
    
    if (unidadeMedida?.includes('litro') || unidadeMedida?.includes('kg')) {
      return 0.1; // Permite décimos
    }
    
    return 1; // Default para unidade, caixa, pacote, saco
  };
  
  const step = getStepValue();
  const unitLabel = produto?.unidade_medida || 'unidade';
  
  // Calculate boxes/m² info for products
  const getPackagingInfo = () => {
    if (isM2Product && produto?.valor_conversao && produto.valor_conversao > 0) {
      if (isMultiplePackaging) {
        // For multiple packaging, quantidade represents number of boxes
        return {
          boxes: quantidade,
          m2: quantidade * produto.valor_conversao,
          m2PerBox: produto.valor_conversao
        };
      } else {
        // For free quantity, quantidade represents m²
        const boxes = quantidade / produto.valor_conversao;
        return {
          m2: quantidade,
          boxes: Math.round(boxes * 10) / 10, // Round to 1 decimal place
          m2PerBox: produto.valor_conversao
        };
      }
    }
    return null;
  };
  
  const packagingInfo = getPackagingInfo();
  
  // Format the quantity display
  const displayQuantity = (() => {
    if (packagingInfo) {
      const boxesText = packagingInfo.boxes === 1 ? 'caixa' : 'caixas';
      if (isMultiplePackaging) {
        // Show boxes first for multiple packaging
        return `${packagingInfo.boxes} ${boxesText} (${packagingInfo.m2} m²)`;
      } else {
        // Show m² first for free quantity
        return `${packagingInfo.m2} m² (${packagingInfo.boxes} ${boxesText})`;
      }
    }
    
    if (isFractionalProduct) {
      return `${quantidade} ${unitLabel}`;
    }
    
    return `${quantidade} ${quantidade === 1 ? 'unidade' : 'unidades'}`;
  })();

  // Debug logs for final calculations - REMOVE AFTER FIXING
  console.log('🔍 [QuantitySelector] Cálculos finais:', {
    step,
    unitLabel,
    packagingInfo,
    displayQuantity,
    quantidade
  });

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
            disabled={isMultiplePackaging ? quantidade <= 1 : quantidade <= step}
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
            disabled={isMultiplePackaging && produto ? 
              quantidade >= Math.floor(produto.estoque / (produto.valor_conversao || 1)) :
              quantidade >= (produto?.estoque || step)}
            aria-label="Aumentar quantidade"
          >
            <Plus size={16} />
          </Button>
        </div>
      </div>
      
      {/* Add explanation for products */}
      {(isFractionalProduct || isMultiplePackaging) && (
        <div className="text-xs text-gray-500 ml-1">
          {isMultiplePackaging && packagingInfo && 
            `Vendido apenas em caixas de ${packagingInfo.m2PerBox} m² cada`}
          {!isMultiplePackaging && isBarraProduct && 'Pode ser vendido em meias barras (0.5)'}
          {!isMultiplePackaging && isRoloProduct && 'Vendido por metragem fracionada'}
          {!isMultiplePackaging && packagingInfo && !isMultiplePackaging && 
            `Cada caixa contém ${packagingInfo.m2PerBox} m² - Incrementos de ${step} m²`}
          {!isMultiplePackaging && !packagingInfo && isM2Product && `Incrementos de ${step} m²`}
          {!isMultiplePackaging && (unidadeMedida?.includes('litro') || unidadeMedida?.includes('kg')) && 
            'Permite quantidades decimais'}
        </div>
      )}
    </div>
  );
};

export default QuantitySelector;
