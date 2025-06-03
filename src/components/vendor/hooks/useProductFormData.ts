
import { useState, useCallback } from 'react';

export interface ProductFormData {
  id: string;
  nome: string;
  descricao: string;
  categoria: string;
  segmento: string;
  segmento_id: string;
  preco_normal: number;
  preco_promocional: number | null;
  pontos_consumidor: number;
  pontos_profissional: number;
  estoque: number;
  sku: string;
  codigo_barras: string;
  imagens: string[];
}

export const useProductFormData = (initialData?: any) => {
  const [currentSegmentId, setCurrentSegmentId] = useState<string>('');
  
  const [formData, setFormData] = useState<ProductFormData>({
    id: '',
    nome: '',
    descricao: '',
    categoria: '',
    segmento: '',
    segmento_id: '',
    preco_normal: 0,
    preco_promocional: null,
    pontos_consumidor: 0,
    pontos_profissional: 0,
    estoque: 0,
    sku: '',
    codigo_barras: '',
    imagens: []
  });

  const handleInputChange = useCallback((field: string, value: any) => {
    console.log(`[useProductFormData] Changing ${field} to:`, value);
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleSegmentIdChange = useCallback((segmentId: string) => {
    if (segmentId !== currentSegmentId) {
      console.log('[useProductFormData] Segment changed, clearing category');
      setCurrentSegmentId(segmentId);
      setFormData(prev => ({
        ...prev,
        segmento_id: segmentId,
        categoria: ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        segmento_id: segmentId
      }));
    }
  }, [currentSegmentId]);

  const handleSegmentNameChange = useCallback((segmentName: string) => {
    handleInputChange('segmento', segmentName);
  }, [handleInputChange]);

  const handleCategoryChange = useCallback((categoryName: string) => {
    handleInputChange('categoria', categoryName);
  }, [handleInputChange]);

  const initializeFormData = useCallback((data: any, processedImages: string[]) => {
    console.log('[useProductFormData] Initializing with data:', data);
    
    const newFormData = {
      id: data.id || '',
      nome: data.nome || '',
      descricao: data.descricao || '',
      categoria: data.categoria || '',
      segmento: data.segmento || '',
      segmento_id: data.segmento_id || '',
      preco_normal: data.preco_normal || 0,
      preco_promocional: data.preco_promocional || null,
      pontos_consumidor: data.pontos_consumidor || 0,
      pontos_profissional: data.pontos_profissional || 0,
      estoque: data.estoque || 0,
      sku: data.sku || '',
      codigo_barras: data.codigo_barras || '',
      imagens: [...processedImages]
    };
    
    console.log('[useProductFormData] Setting form data with images:', newFormData.imagens);
    setFormData(newFormData);
    setCurrentSegmentId(data.segmento_id || '');
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
