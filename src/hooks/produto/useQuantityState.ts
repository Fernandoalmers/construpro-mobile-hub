
import { useState, useEffect } from 'react';
import { Product } from '@/services/productService';

interface UseQuantityStateProps {
  produto: Product | null;
  defaultValue?: number;
}

export function useQuantityState({ produto, defaultValue = 1 }: UseQuantityStateProps) {
  // Check if product is sold by multiples of packaging
  const isMultiplePackaging = produto?.controle_quantidade === 'multiplo';
  
  const [quantidade, setQuantidade] = useState(defaultValue);

  // Calculate the step value based on unit type and packaging control
  const getStepValue = () => {
    if (!produto) return 1;
    
    // For products with multiple packaging control, step is always 1 (representing 1 box/package)
    if (isMultiplePackaging) {
      return 1;
    }
    
    const unidadeMedida = produto.unidade_medida?.toLowerCase();
    
    // Use valor_conversao when available (for m², kg, litro, etc.)
    if (produto.valor_conversao && produto.valor_conversao > 0) {
      return produto.valor_conversao;
    }
    
    // Handle different unit types
    if (unidadeMedida?.includes('barra')) {
      return 0.5; // Permite meia barra
    }
    
    if (unidadeMedida?.includes('rolo')) {
      return 0.1; // Permite décimos de rolo
    }
    
    if (unidadeMedida?.includes('litro') || unidadeMedida?.includes('kg')) {
      return 0.1; // Permite décimos para líquidos e peso
    }
    
    return 1; // Default para unidade, caixa, pacote, saco
  };

  // Enforce stock limits on quantity
  useEffect(() => {
    if (produto && isMultiplePackaging) {
      // For multiple packaging, calculate available boxes based on stock and valor_conversao
      const availableBoxes = produto.valor_conversao ? Math.floor(produto.estoque / produto.valor_conversao) : produto.estoque;
      if (quantidade > availableBoxes) {
        setQuantidade(Math.max(1, availableBoxes));
      }
    } else if (produto && quantidade > (produto.estoque || 0)) {
      setQuantidade(Math.max(1, produto.estoque || 0));
    }
  }, [produto, quantidade, isMultiplePackaging]);

  const handleQuantityChange = (delta: number) => {
    const step = getStepValue();
    const newValue = quantidade + (delta * step);
    
    if (isMultiplePackaging && produto) {
      // For multiple packaging, check against available boxes
      const availableBoxes = produto.valor_conversao ? Math.floor(produto.estoque / produto.valor_conversao) : produto.estoque;
      if (newValue >= 1 && newValue <= availableBoxes) {
        setQuantidade(newValue);
      }
    } else if (newValue >= step && (!produto || newValue <= (produto.estoque || step))) {
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
