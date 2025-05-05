
import React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PriceDisplayProps {
  preco: number;
  preco_promocional?: number | null;
}

const PriceDisplay: React.FC<PriceDisplayProps> = ({ preco, preco_promocional }) => {
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  
  // Verifica se existe um preço promocional válido (menor que o preço regular)
  const hasValidPromotion = preco_promocional !== undefined && 
                           preco_promocional !== null && 
                           preco_promocional > 0 &&
                           preco_promocional < preco;
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div className="flex flex-col">
            <div className="font-medium text-green-700">
              {hasValidPromotion ? formatCurrency(preco_promocional) : formatCurrency(preco)}
            </div>
            {hasValidPromotion && (
              <div className="text-xs line-through text-gray-500">
                {formatCurrency(preco)}
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Preço regular: {formatCurrency(preco)}</p>
          {hasValidPromotion && (
            <p>Preço promocional: {formatCurrency(preco_promocional)}</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default PriceDisplay;
