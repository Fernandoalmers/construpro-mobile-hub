
import { useState, useEffect } from 'react';
import { Product } from '@/services/productService';

interface UseQuantityStateProps {
  produto: Product | null;
  defaultValue?: number;
}

export function useQuantityState({ produto, defaultValue = 1 }: UseQuantityStateProps) {
  const [quantidade, setQuantidade] = useState(defaultValue);

  // Calculate the step value based on unit type
  const getStepValue = () => {
    if (!produto) return 1;
    
    const isM2Product = produto.unidade_medida?.toLowerCase().includes('m²') || 
                        produto.unidade_medida?.toLowerCase().includes('m2');
    
    if (isM2Product && produto.unidade_medida) {
      // Extract numeric value from unit measure if present
      const match = produto.unidade_medida.match(/(\d+(\.\d+)?)/);
      return match ? parseFloat(match[0]) : 1;
    }
    
    return 1;
  };

  // Enforce stock limits on quantity
  useEffect(() => {
    if (produto && quantidade > (produto.estoque || 0)) {
      setQuantidade(Math.max(1, produto.estoque || 0));
    }
  }, [produto, quantidade]);

  const handleQuantityChange = (delta: number) => {
    const step = getStepValue();
    
    const newValue = quantidade + (delta * step);
    if (newValue >= step && (!produto || newValue <= (produto.estoque || step))) {
      setQuantidade(newValue);
    }
  };

  const validateQuantity = () => {
    const step = getStepValue();
    
    if (step > 1) {
      // Round to the nearest multiple of step
      const roundedValue = Math.round(quantidade / step) * step;
      if (roundedValue !== quantidade) {
        setQuantidade(roundedValue);
      }
    }
    
    // Ensure quantity doesn't exceed stock
    if (produto && quantidade > produto.estoque) {
      setQuantidade(Math.max(1, produto.estoque));
    }
  };

  return {
    quantidade,
    setQuantidade,
    handleQuantityChange,
    validateQuantity,
  };
}
