import { CartItem } from '@/types/cart';

export function useCartQuantityLogic(item: CartItem) {
  const produto = item.produto;
  
  // Check if product is sold by multiples of packaging
  const isMultiplePackaging = produto?.controle_quantidade === 'multiplo';
  
  // Get unit type
  const unidadeMedida = produto?.unidade_medida?.toLowerCase() || '';
  
  // Determine if this is a special unit that allows fractions
  const isM2Product = unidadeMedida.includes('m²') || unidadeMedida.includes('m2');
  const isBarraProduct = unidadeMedida.includes('barra');
  const isRoloProduct = unidadeMedida.includes('rolo');
  const isFractionalProduct = isM2Product || isBarraProduct || isRoloProduct || 
                             unidadeMedida.includes('litro') || unidadeMedida.includes('kg');
  
  // Get the step value based on unit type and packaging control
  const getStepValue = () => {
    if (!produto) return 1;
    
    // For products with multiple packaging control, step is valor_conversao (m² per box)
    if (isMultiplePackaging && produto.valor_conversao && produto.valor_conversao > 0) {
      return produto.valor_conversao;
    }
    
    // Use valor_conversao when available (for m², kg, litro, etc.)
    if (produto.valor_conversao && produto.valor_conversao > 0) {
      return produto.valor_conversao;
    }
    
    if (isBarraProduct) return 0.5; // Permite meia barra
    if (isRoloProduct) return 0.1; // Permite décimos de rolo
    
    if (unidadeMedida.includes('litro') || unidadeMedida.includes('kg')) {
      return 0.1; // Permite décimos
    }
    
    return 1; // Default para unidade, caixa, pacote, saco
  };
  
  const step = getStepValue();
  
  // Calculate boxes/m² info for products
  const getPackagingInfo = () => {
    if (isM2Product && produto?.valor_conversao && produto.valor_conversao > 0) {
      const quantidade = item.quantidade;
      
      if (isMultiplePackaging) {
        // For multiple packaging, quantidade represents m² (not boxes)
        const boxes = quantidade / produto.valor_conversao;
        return {
          boxes: Math.round(boxes * 10) / 10,
          m2: quantidade,
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
  const getQuantityDisplay = () => {
    const quantidade = item.quantidade;
    const unitLabel = produto?.unidade_medida || 'unidade';
    
    if (packagingInfo) {
      if (isMultiplePackaging) {
        // Show m² for multiple packaging
        return `${packagingInfo.m2} m²`;
      } else {
        // Show m² for free quantity
        return `${packagingInfo.m2} m²`;
      }
    }
    
    if (isFractionalProduct) {
      return `${quantidade} ${unitLabel}`;
    }
    
    // For regular products, show quantity
    if (quantidade % 1 === 0) {
      return `${quantidade}`;
    } else {
      return `${quantidade}`;
    }
  };
  
  // Calculate max quantity based on stock
  const getMaxQuantity = () => {
    if (!produto) return 1;
    
    if (isMultiplePackaging && produto.valor_conversao) {
      // For multiple packaging, stock is in m² (quantidade represents m²)
      return produto.estoque;
    }
    
    return produto.estoque || 1;
  };
  
  // Calculate minimum quantity
  const getMinQuantity = () => {
    return isMultiplePackaging && produto?.valor_conversao ? produto.valor_conversao : step;
  };
  
  return {
    step,
    isMultiplePackaging,
    isFractionalProduct,
    packagingInfo,
    quantityDisplay: getQuantityDisplay(),
    maxQuantity: getMaxQuantity(),
    minQuantity: getMinQuantity(),
    unidadeMedida: produto?.unidade_medida || 'unidade'
  };
}