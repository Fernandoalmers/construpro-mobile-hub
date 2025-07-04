
// Validate barcode format (basic EAN/UPC validation)
export const validateBarcode = (barcode: string): boolean => {
  if (!barcode) return true; // Optional field
  // Remove spaces and check if it's numeric and has valid length
  const cleanBarcode = barcode.replace(/\s/g, '');
  return /^\d{8}$|^\d{12}$|^\d{13}$|^\d{14}$/.test(cleanBarcode);
};

// Format barcode input
export const formatBarcode = (value: string): string => {
  // Remove non-numeric characters
  const numeric = value.replace(/\D/g, '');
  // Limit to 14 digits (EAN-14 is the longest common format)
  return numeric.slice(0, 14);
};

// Get conversion field label based on unit type
export const getConversionFieldLabel = (unidadeVenda: string) => {
  switch(unidadeVenda) {
    case 'm2': return 'Área por caixa (m²)';
    case 'litro': return 'Volume por embalagem (litros)';
    case 'kg': return 'Peso por embalagem (kg)';
    case 'barra': return 'Comprimento por barra (metros)';
    case 'saco': return 'Peso por saco (kg)';
    case 'rolo': return 'Metragem por rolo (metros)';
    default: return 'Valor por embalagem';
  }
};

// Check if conversion value is required
export const isConversionRequired = (unidadeVenda: string) => {
  return ['m2', 'litro', 'kg', 'barra', 'saco', 'rolo'].includes(unidadeVenda);
};

// Get step value for quantity based on unit type
export const getQuantityStep = (unidadeVenda: string, valorConversao?: number) => {
  switch(unidadeVenda) {
    case 'barra': return 0.5; // Permite meia barra
    case 'rolo': return 0.1; // Permite décimos de rolo
    case 'm2': return valorConversao || 1; // Múltiplos da área por caixa
    default: return 1;
  }
};

// Check if fractional quantities are allowed
export const allowsFractionalQuantities = (unidadeVenda: string) => {
  return ['barra', 'rolo', 'm2', 'litro', 'kg'].includes(unidadeVenda);
};

// Get variant options based on variant type
export const getVariantOptions = (tipoVariante: string) => {
  switch(tipoVariante) {
    case 'cor': 
      return ['Branco', 'Preto', 'Cinza', 'Bege', 'Marrom', 'Azul', 'Verde', 'Amarelo', 'Vermelho'];
    case 'tamanho': 
      return ['PP', 'P', 'M', 'G', 'GG', 'XG'];
    case 'volume': 
      return ['0.9L', '3.6L', '18L', '20L'];
    default: 
      return [];
  }
};

export const categorias = [
  'Porcelanatos', 'Pisos', 'Revestimentos', 'Tintas', 'Ferramentas',
  'Materiais Elétricos', 'Materiais Hidráulicos', 'EPIs', 'Iluminação',
  'Madeiras', 'Acabamentos', 'Decoração'
];

export const availableVariantTypes = [
  { value: 'cor', label: 'Cor' },
  { value: 'tamanho', label: 'Tamanho' },
  { value: 'volume', label: 'Volume' },
];

export const tagOptions = [
  { value: 'promocao', label: 'Promoção' },
  { value: 'lancamento', label: 'Lançamento' },
  { value: 'destaque', label: 'Destaque' },
  { value: 'limitado', label: 'Edição Limitada' },
];
