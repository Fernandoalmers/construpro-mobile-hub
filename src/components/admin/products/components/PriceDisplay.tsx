
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
  
  // Check if there's a valid promotional price that's different from the regular price
  const hasValidPromotion = preco_promocional && preco_promocional < preco;
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div className="font-medium">
            {hasValidPromotion ? formatCurrency(preco_promocional) : formatCurrency(preco)}
          </div>
          {hasValidPromotion && (
            <div className="text-xs line-through text-gray-500">
              {formatCurrency(preco)}
            </div>
          )}
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
