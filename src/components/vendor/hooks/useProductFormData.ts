
import { useState, useCallback } from 'react';

export interface ProductFormData {
  id?: string; // Added id field for product editing
  nome: string;
  descricao: string;
  categoria: string;
  segmento: string;
  preco: number;
  estoque: number;
  precoPromocional?: number | null;
  promocaoAtiva: boolean;
  promocaoInicio?: string;
  promocaoFim?: string;
  pontosConsumidor: number;
  pontosProfissional: number;
  sku?: string;
  codigoBarras?: string;
  imagens: string[];
}

interface UseProductFormDataProps {
  initialData?: any;
}

export const useProductFormData = (initialData?: any) => {
  const [formData, setFormData] = useState<ProductFormData>({
    nome: '',
    descricao: '',
    categoria: '',
    segmento: '',
    preco: 0,
    estoque: 0,
    precoPromocional: null,
    promocaoAtiva: false,
    promocaoInicio: '',
    promocaoFim: '',
    pontosConsumidor: 0,
    pontosProfissional: 0,
    sku: '',
    codigoBarras: '',
    imagens: []
  });

  const [currentSegmentId, setCurrentSegmentId] = useState<string | null>(null);

  const handleInputChange = useCallback((field: string, value: any) => {
    console.log('[useProductFormData] Input change:', { field, value });
    
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Clear promotional data when promotion is deactivated
      if (field === 'promocaoAtiva' && !value) {
        newData.precoPromocional = null;
        newData.promocaoInicio = '';
        newData.promocaoFim = '';
        console.log('[useProductFormData] Cleared promotional data');
      }
      
      console.log('[useProductFormData] Updated form data:', newData);
      return newData;
    });
  }, []);

  const handleSegmentIdChange = useCallback((segmentId: string) => {
    setCurrentSegmentId(segmentId);
  }, []);

  const handleSegmentNameChange = useCallback((segmentName: string) => {
    handleInputChange('segmento', segmentName);
  }, [handleInputChange]);

  const handleCategoryChange = useCallback((category: string) => {
    handleInputChange('categoria', category);
  }, [handleInputChange]);

  const initializeFormData = useCallback((data: any, processedImages: string[] = []) => {
    console.log('[useProductFormData] Initializing with data:', data);
    
    // Process promotion dates - handle both ISO strings and Date objects
    let promocaoInicio = '';
    let promocaoFim = '';
    
    if (data.promocao_inicio) {
      try {
        const startDate = new Date(data.promocao_inicio);
        promocaoInicio = startDate.toISOString().slice(0, 16);
      } catch (error) {
        console.warn('[useProductFormData] Error parsing promocao_inicio:', error);
      }
    }
    
    if (data.promocao_fim) {
      try {
        const endDate = new Date(data.promocao_fim);
        promocaoFim = endDate.toISOString().slice(0, 16);
      } catch (error) {
        console.warn('[useProductFormData] Error parsing promocao_fim:', error);
      }
    }
    
    const initialFormData: ProductFormData = {
      id: data.id || undefined, // Include the product ID for editing
      nome: data.nome || '',
      descricao: data.descricao || '',
      categoria: data.categoria || '',
      segmento: data.segmento || '',
      preco: data.preco_normal || data.preco || 0,
      estoque: data.estoque || 0,
      precoPromocional: data.preco_promocional || null,
      promocaoAtiva: data.promocao_ativa || false,
      promocaoInicio,
      promocaoFim,
      pontosConsumidor: data.pontos_consumidor || 0,
      pontosProfissional: data.pontos_profissional || 0,
      sku: data.sku || '',
      codigoBarras: data.codigo_barras || '',
      imagens: processedImages
    };
    
    console.log('[useProductFormData] Initialized form data:', initialFormData);
    setFormData(initialFormData);
    setCurrentSegmentId(data.segmento_id || null);
  }, []);

  return {
    formData,
    setFormData,
    currentSegmentId,
    handleInputChange,
    handleSegmentIdChange,
    handleSegmentNameChange,
    handleCategoryChange,
    initializeFormData
  };
};
