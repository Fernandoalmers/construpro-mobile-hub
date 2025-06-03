
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/sonner';

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

  // Process images with improved validation and logging
  const processImages = useCallback((rawImages: any): string[] => {
    console.log('[useProductFormState] Processing raw images:', rawImages);
    
    if (!rawImages) {
      console.log('[useProductFormState] No images provided');
      return [];
    }

    let processedImages: string[] = [];
    
    try {
      // Handle different types of image data
      if (Array.isArray(rawImages)) {
        processedImages = rawImages;
      } else if (typeof rawImages === 'string') {
        if (rawImages.trim() === '' || rawImages === 'null' || rawImages === 'undefined') {
          console.log('[useProductFormState] Empty or invalid image string');
          return [];
        }
        
        // Try to parse as JSON first
        try {
          const parsed = JSON.parse(rawImages);
          if (Array.isArray(parsed)) {
            processedImages = parsed;
          } else {
            processedImages = [rawImages];
          }
        } catch (e) {
          // If not JSON, treat as single URL
          processedImages = [rawImages];
        }
      }
      
      // Filter and validate URLs - simplified validation
      const validImages = processedImages.filter(img => {
        if (!img || typeof img !== 'string') {
          console.log('[useProductFormState] Invalid image (not string):', img);
          return false;
        }
        
        const trimmed = img.trim();
        if (trimmed === '' || trimmed === 'null' || trimmed === 'undefined') {
          console.log('[useProductFormState] Empty or null image string:', trimmed);
          return false;
        }
        
        // Accept any URL that looks like it could be an image
        const isValidUrl = trimmed.startsWith('http') || trimmed.startsWith('/') || trimmed.startsWith('blob:');
        
        if (!isValidUrl) {
          console.log('[useProductFormState] Invalid URL format:', trimmed);
          return false;
        }
        
        return true;
      });
      
      console.log('[useProductFormState] Valid images after filtering:', validImages);
      return validImages;
      
    } catch (error) {
      console.error('[useProductFormState] Error processing images:', error);
      return [];
    }
  }, []);

  // Initialize form data
  useEffect(() => {
    if (initialData) {
      console.log('[useProductFormState] Initializing with data:', initialData);
      
      // Process images with improved handling
      const processedImages = processImages(initialData.imagens);
      console.log('[useProductFormState] Processed images:', processedImages);
      
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
        imagens: processedImages
      };
      
      console.log('[useProductFormState] Setting form data:', newFormData);
      setFormData(newFormData);
      setCurrentSegmentId(initialData.segmento_id || '');
      
      // Initialize image states with processed images
      setExistingImages(processedImages);
      setImagePreviews(processedImages);
      
      console.log('[useProductFormState] Image states initialized:', {
        existingImages: processedImages,
        imagePreviews: processedImages
      });
    }
  }, [initialData, processImages]);

  const handleInputChange = useCallback((field: string, value: any) => {
    console.log(`[useProductFormState] Changing ${field} to:`, value);
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleSegmentIdChange = useCallback((segmentId: string) => {
    if (segmentId !== currentSegmentId) {
      console.log('[useProductFormState] Segment changed, clearing category');
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
