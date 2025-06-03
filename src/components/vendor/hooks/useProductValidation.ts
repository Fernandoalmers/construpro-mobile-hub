
export const useProductValidation = () => {
  const validateBarcode = (barcode: string): boolean => {
    if (!barcode) return true;
    const cleanBarcode = barcode.replace(/\s/g, '');
    return /^\d{8}$|^\d{12}$|^\d{13}$|^\d{14}$/.test(cleanBarcode);
  };

  const formatBarcode = (value: string): string => {
    const numeric = value.replace(/\D/g, '');
    return numeric.slice(0, 14);
  };

  const validateForm = (formData: any, existingImages: string[], imageFiles: File[]): string | null => {
    if (!formData.nome.trim()) {
      return 'Nome do produto é obrigatório';
    }

    if (!formData.categoria.trim()) {
      return 'Categoria é obrigatória';
    }

    if (formData.preco_normal <= 0) {
      return 'Preço deve ser maior que zero';
    }

    const totalImages = existingImages.length + imageFiles.length;
    if (totalImages === 0) {
      return 'É obrigatório ter pelo menos uma imagem do produto';
    }

    if (formData.codigo_barras && !validateBarcode(formData.codigo_barras)) {
      return 'Código de barras inválido. Use formato EAN-8, EAN-13, UPC-12 ou EAN-14';
    }

    return null;
  };

  return {
    validateBarcode,
    formatBarcode,
    validateForm
  };
};
