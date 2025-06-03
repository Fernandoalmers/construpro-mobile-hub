
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

  // Image states - initialize as separate arrays to avoid circular references
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);

  // Improved image processing with better validation and logging
  const processImages = useCallback((rawImages: any): string[] => {
    console.log('[useProductFormState] Processing raw images:', rawImages);
    
    if (!rawImages) {
      console.log('[useProductFormState] No images provided - returning empty array');
      return [];
    }

    let processedImages: string[] = [];
    
    try {
      // Handle different types of image data
      if (Array.isArray(rawImages)) {
        processedImages = [...rawImages]; // Create a new array to avoid references
        console.log('[useProductFormState] Raw images is already an array:', processedImages);
      } else if (typeof rawImages === 'string') {
        if (rawImages.trim() === '' || rawImages === 'null' || rawImages === 'undefined') {
          console.log('[useProductFormState] Empty or invalid image string');
          return [];
        }
        
        // Try to parse as JSON first
        try {
          const parsed = JSON.parse(rawImages);
          if (Array.isArray(parsed)) {
            processedImages = [...parsed]; // Create a new array
          } else {
            processedImages = [rawImages];
          }
        } catch (e) {
          // If not JSON, treat as single URL
          processedImages = [rawImages];
        }
      }
      
      // Simplified validation - just check if URL looks valid
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
        
        // More permissive URL validation - accept any string that looks like a URL
        const isValidUrl = trimmed.includes('http') || trimmed.startsWith('/') || trimmed.startsWith('blob:');
        
        if (!isValidUrl) {
          console.log('[useProductFormState] Invalid URL format:', trimmed);
          return false;
        }
        
        console.log('[useProductFormState] Valid image URL:', trimmed);
        return true;
      });
      
      console.log('[useProductFormState] Final valid images:', validImages);
      return validImages;
      
    } catch (error) {
      console.error('[useProductFormState] Error processing images:', error);
      return [];
    }
  }, []);

  // Initialize form data with improved image handling
  useEffect(() => {
    if (initialData) {
      console.log('[useProductFormState] Initializing with data:', initialData);
      console.log('[useProductFormState] Raw images from initialData:', initialData.imagens);
      
      // Process images first
      const processedImages = processImages(initialData.imagens);
      console.log('[useProductFormState] Processed images result:', processedImages);
      
      // Create form data
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
        imagens: [...processedImages] // Create new array
      };
      
      console.log('[useProductFormState] Setting form data:', newFormData);
      setFormData(newFormData);
      setCurrentSegmentId(initialData.segmento_id || '');
      
      // Initialize image states with separate arrays to avoid circular references
      const imagesCopy = [...processedImages];
      console.log('[useProductFormState] Setting image states with:', imagesCopy);
      
      setExistingImages(imagesCopy);
      setImagePreviews([...imagesCopy]); // Create separate copy for previews
      setImageFiles([]); // No new files when editing existing product
      
      console.log('[useProductFormState] Image states initialized successfully');
      console.log('[useProductFormState] - existingImages length:', imagesCopy.length);
      console.log('[useProductFormState] - imagePreviews will be set to length:', imagesCopy.length);
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
    setFormData,
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
