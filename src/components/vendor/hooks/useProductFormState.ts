
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/sonner';
import { saveVendorProduct } from '@/services/vendor/products/productOperations';
import { uploadProductImage } from '@/services/products/images/imageUpload';

interface UseProductFormStateProps {
  isEditing?: boolean;
  productId?: string;
  initialData?: any;
}

export const useProductFormState = ({ isEditing = false, productId, initialData }: UseProductFormStateProps) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [currentSegmentId, setCurrentSegmentId] = useState<string>('');
  
  // Form state
  const [formData, setFormData] = useState({
    id: '',
    nome: '',
    descricao: '',
    categoria: '',
    segmento: '',
    segmento_id: '',
    preco_normal: 0,
    preco_promocional: null as number | null,
    pontos_consumidor: 0,
    pontos_profissional: 0,
    estoque: 0,
    sku: '',
    codigo_barras: '',
    imagens: [] as string[]
  });

  // Image states
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);

  // Initialize form data
  useEffect(() => {
    if (initialData) {
      console.log('[useProductFormState] Initializing with data:', initialData);
      
      // Process existing images correctly
      let processedImages: string[] = [];
      
      if (initialData.imagens) {
        if (Array.isArray(initialData.imagens)) {
          processedImages = initialData.imagens;
        } else if (typeof initialData.imagens === 'string') {
          try {
            const parsed = JSON.parse(initialData.imagens);
            if (Array.isArray(parsed)) {
              processedImages = parsed;
            } else {
              processedImages = [initialData.imagens];
            }
          } catch (e) {
            processedImages = [initialData.imagens];
          }
        }
      }
      
      // Filter valid images
      const validImages = processedImages.filter(img => 
        img && 
        typeof img === 'string' && 
        img.trim() !== '' && 
        img !== 'null' && 
        img !== 'undefined'
      );
      
      const newFormData = {
        id: initialData.id || '',
        nome: initialData.nome || '',
        descricao: initialData.descricao || '',
        categoria: initialData.categoria || '',
        segmento: initialData.segmento || '',
        segmento_id: initialData.segmento_id || '',
        preco_normal: initialData.preco_normal || 0,
        preco_promocional: initialData.preco_promocional || null,
        pontos_consumidor: initialData.pontos_consumidor || 0,
        pontos_profissional: initialData.pontos_profissional || 0,
        estoque: initialData.estoque || 0,
        sku: initialData.sku || '',
        codigo_barras: initialData.codigo_barras || '',
        imagens: validImages
      };
      
      setFormData(newFormData);
      setCurrentSegmentId(initialData.segmento_id || '');
      setExistingImages(validImages);
      setImagePreviews(validImages);
    }
  }, [initialData]);

  const handleInputChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleSegmentIdChange = useCallback((segmentId: string) => {
    if (segmentId !== currentSegmentId) {
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

  return {
    loading,
    setLoading,
    uploadingImages,
    setUploadingImages,
    currentSegmentId,
    formData,
    imageFiles,
    setImageFiles,
    imagePreviews,
    setImagePreviews,
    existingImages,
    setExistingImages,
    handleInputChange,
    handleSegmentIdChange,
    handleSegmentNameChange,
    handleCategoryChange,
    navigate,
    isEditing,
    productId
  };
};
