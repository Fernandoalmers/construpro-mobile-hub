
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
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div className="font-medium">{formatCurrency(preco)}</div>
          {preco_promocional && (
            <div className="text-xs line-through text-gray-500">
              {formatCurrency(preco_promocional)}
            </div>
          )}
        </TooltipTrigger>
        <TooltipContent>
          <p>Preço regular: {formatCurrency(preco)}</p>
          {preco_promocional && (
            <p>Preço promocional: {formatCurrency(preco_promocional)}</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default PriceDisplay;
