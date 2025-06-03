import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, X, Save } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { saveVendorProduct } from '@/services/vendor/products/productOperations';
import { uploadProductImage } from '@/services/products/images/imageUpload';
import ProductSegmentSelect from './ProductSegmentSelect';
import ProductCategorySelect from './ProductCategorySelect';

interface ProductFormScreenProps {
  isEditing?: boolean;
  productId?: string;
  initialData?: any;
}

const ProductFormScreen: React.FC<ProductFormScreenProps> = ({ 
  isEditing = false, 
  productId, 
  initialData 
}) => {
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

  // Separate state for new image files and all image previews
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);

  // Initialize form data
  useEffect(() => {
    if (initialData) {
      console.log('[ProductFormScreen] Setting form data from initialData:', initialData);
      
      // Parse existing images
      let parsedExistingImages: string[] = [];
      if (initialData.imagens) {
        if (typeof initialData.imagens === 'string') {
          try {
            parsedExistingImages = JSON.parse(initialData.imagens);
          } catch (e) {
            console.warn('Failed to parse imagens string:', initialData.imagens);
            parsedExistingImages = [initialData.imagens]; // Treat as single image
          }
        } else if (Array.isArray(initialData.imagens)) {
          parsedExistingImages = initialData.imagens;
        }
      }
      
      // Filter out invalid images (empty strings, blob URLs)
      const validExistingImages = parsedExistingImages.filter(img => 
        img && typeof img === 'string' && img.trim() !== '' && !img.startsWith('blob:')
      );
      
      console.log('[ProductFormScreen] Valid existing images:', validExistingImages);
      
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
        imagens: validExistingImages
      };
      
      setFormData(newFormData);
      setCurrentSegmentId(initialData.segmento_id || '');

      // Set existing images state and previews
      setExistingImages(validExistingImages);
      setImagePreviews(validExistingImages);
      
      console.log('[ProductFormScreen] Form initialized with existing images:', validExistingImages);
    }
  }, [initialData]);

  const handleInputChange = useCallback((field: string, value: any) => {
    console.log(`[ProductFormScreen] Updating field ${field} with value:`, value);
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // Stable callback for segment ID changes
  const handleSegmentIdChange = useCallback((segmentId: string) => {
    console.log('[ProductFormScreen] Segment ID change requested:', segmentId);
    console.log('[ProductFormScreen] Current segment ID:', currentSegmentId);
    console.log('[ProductFormScreen] Current category:', formData.categoria);
    
    // Only process if the segment ID actually changed
    if (segmentId !== currentSegmentId) {
      console.log('[ProductFormScreen] Segment ID actually changed, updating and clearing category');
      setCurrentSegmentId(segmentId);
      
      setFormData(prev => ({
        ...prev,
        segmento_id: segmentId,
        categoria: '' // Clear category only when segment actually changes
      }));
      
      console.log('[ProductFormScreen] Category cleared due to segment change');
    } else {
      console.log('[ProductFormScreen] Segment ID unchanged, preserving category');
      // Just update the segment_id in form data without clearing category
      setFormData(prev => ({
        ...prev,
        segmento_id: segmentId
      }));
    }
  }, [currentSegmentId, formData.categoria]);

  // Stable callback for segment name changes
  const handleSegmentNameChange = useCallback((segmentName: string) => {
    console.log('[ProductFormScreen] Segment name changed to:', segmentName);
    handleInputChange('segmento', segmentName);
  }, [handleInputChange]);

  // Stable callback for category changes
  const handleCategoryChange = useCallback((categoryName: string) => {
    console.log('[ProductFormScreen] Category changed to:', categoryName);
    handleInputChange('categoria', categoryName);
  }, [handleInputChange]);

  // Validate barcode format (basic EAN/UPC validation)
  const validateBarcode = (barcode: string): boolean => {
    if (!barcode) return true; // Optional field
    // Remove spaces and check if it's numeric and has valid length
    const cleanBarcode = barcode.replace(/\s/g, '');
    return /^\d{8}$|^\d{12}$|^\d{13}$|^\d{14}$/.test(cleanBarcode);
  };

  // Format barcode input
  const formatBarcode = (value: string): string => {
    // Remove non-numeric characters
    const numeric = value.replace(/\D/g, '');
    // Limit to 14 digits (EAN-14 is the longest common format)
    return numeric.slice(0, 14);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    // Check if adding new files would exceed the limit
    const totalImages = imagePreviews.length + files.length;
    if (totalImages > 5) {
      toast.error(`Máximo de 5 imagens permitidas. Você pode adicionar apenas ${5 - imagePreviews.length} imagem(ns) a mais.`);
      return;
    }

    console.log('[ProductFormScreen] Starting image upload for files:', files.map(f => f.name));
    console.log('[ProductFormScreen] Current previews count:', imagePreviews.length);
    console.log('[ProductFormScreen] Current existing images:', existingImages.length);
    
    setUploadingImages(true);
    
    try {
      const newImageFiles = [...imageFiles, ...files];
      const newPreviews = [...imagePreviews];
      
      // Create blob URLs for immediate preview of new files
      for (const file of files) {
        const previewUrl = URL.createObjectURL(file);
        newPreviews.push(previewUrl);
        console.log('[ProductFormScreen] Created preview URL for new file:', previewUrl);
      }
      
      setImageFiles(newImageFiles);
      setImagePreviews(newPreviews);
      
      toast.success(`${files.length} imagem(ns) adicionada(s). Salve o produto para fazer upload permanente.`);
    } catch (error) {
      console.error('[ProductFormScreen] Error handling image upload:', error);
      toast.error('Erro ao processar imagens');
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (index: number) => {
    console.log('[ProductFormScreen] Removing image at index:', index);
    console.log('[ProductFormScreen] Current previews:', imagePreviews);
    console.log('[ProductFormScreen] Current existing images:', existingImages);
    console.log('[ProductFormScreen] Current form images:', formData.imagens);
    
    const imageToRemove = imagePreviews[index];
    const isExistingImage = existingImages.includes(imageToRemove);
    const isBlobUrl = imageToRemove?.startsWith('blob:');
    
    console.log('[ProductFormScreen] Image to remove:', imageToRemove);
    console.log('[ProductFormScreen] Is existing image:', isExistingImage);
    console.log('[ProductFormScreen] Is blob URL:', isBlobUrl);
    
    // Create new arrays
    const newPreviews = [...imagePreviews];
    const newFiles = [...imageFiles];
    const newExistingImages = [...existingImages];
    const newFormImages = [...formData.imagens];
    
    // Remove from previews
    newPreviews.splice(index, 1);
    
    if (isExistingImage) {
      // Removing an existing image
      const existingIndex = existingImages.indexOf(imageToRemove);
      if (existingIndex !== -1) {
        newExistingImages.splice(existingIndex, 1);
      }
      
      // Remove from form data images
      const formImageIndex = formData.imagens.indexOf(imageToRemove);
      if (formImageIndex !== -1) {
        newFormImages.splice(formImageIndex, 1);
      }
      
      console.log('[ProductFormScreen] Removed existing image from all arrays');
    } else if (isBlobUrl) {
      // Removing a new image (blob URL)
      // Find the corresponding file and remove it
      const blobUrls = imagePreviews.filter(img => img.startsWith('blob:'));
      const blobIndex = blobUrls.indexOf(imageToRemove);
      
      if (blobIndex !== -1) {
        // Remove the corresponding file
        const newImageStartIndex = existingImages.length;
        const fileIndex = newImageStartIndex + blobIndex - blobUrls.slice(0, blobIndex).length;
        
        if (fileIndex >= 0 && fileIndex < newFiles.length) {
          newFiles.splice(fileIndex, 1);
        }
      }
      
      // Revoke the blob URL to free memory
      URL.revokeObjectURL(imageToRemove);
      console.log('[ProductFormScreen] Removed new image and revoked blob URL');
    }
    
    // Update all states
    setImagePreviews(newPreviews);
    setImageFiles(newFiles);
    setExistingImages(newExistingImages);
    setFormData(prev => ({
      ...prev,
      imagens: newFormImages
    }));
    
    console.log('[ProductFormScreen] Updated states after removal');
    console.log('[ProductFormScreen] New previews count:', newPreviews.length);
    console.log('[ProductFormScreen] New existing images count:', newExistingImages.length);
    console.log('[ProductFormScreen] New files count:', newFiles.length);
  };

  const handleSave = async () => {
    console.log('[ProductFormScreen] Starting save process');
    console.log('[ProductFormScreen] Form data images:', formData.imagens);
    console.log('[ProductFormScreen] Existing images:', existingImages);
    console.log('[ProductFormScreen] New image files:', imageFiles.length);
    
    if (!formData.nome.trim()) {
      toast.error('Nome do produto é obrigatório');
      return;
    }

    if (!formData.categoria.trim()) {
      toast.error('Categoria é obrigatória');
      return;
    }

    if (formData.preco_normal <= 0) {
      toast.error('Preço deve ser maior que zero');
      return;
    }

    // Check if we have at least one image (existing or new)
    const totalImages = existingImages.length + imageFiles.length;
    if (totalImages === 0) {
      toast.error('É obrigatório ter pelo menos uma imagem do produto');
      return;
    }

    // Validate barcode if provided
    if (formData.codigo_barras && !validateBarcode(formData.codigo_barras)) {
      toast.error('Código de barras inválido. Use formato EAN-8, EAN-13, UPC-12 ou EAN-14');
      return;
    }

    setLoading(true);
    
    try {
      // Prepare product data with existing images preserved
      let productToSave = {
        ...formData,
        imagens: [...existingImages] // Start with existing images preserved
      };
      
      console.log('[ProductFormScreen] Product data to save:', productToSave);
      
      // Save product first
      const savedProduct = await saveVendorProduct(productToSave);
      
      if (!savedProduct) {
        throw new Error('Falha ao salvar produto');
      }
      
      console.log('[ProductFormScreen] Product saved successfully:', savedProduct.id);
      
      // Now upload new image files if any
      let finalImages = [...existingImages];
      
      if (imageFiles.length > 0) {
        console.log('[ProductFormScreen] Uploading', imageFiles.length, 'new images');
        
        for (let i = 0; i < imageFiles.length; i++) {
          const file = imageFiles[i];
          console.log('[ProductFormScreen] Uploading image', i + 1, ':', file.name);
          
          try {
            const uploadedUrl = await uploadProductImage(savedProduct.id, file, finalImages.length + i);
            
            if (uploadedUrl) {
              finalImages.push(uploadedUrl);
              console.log('[ProductFormScreen] Successfully uploaded image:', uploadedUrl);
            } else {
              console.warn('[ProductFormScreen] Failed to upload image:', file.name);
            }
          } catch (uploadError) {
            console.error('[ProductFormScreen] Error uploading image:', file.name, uploadError);
            // Continue with other images even if one fails
          }
        }
        
        // Update product with all images if new ones were uploaded
        if (finalImages.length > existingImages.length) {
          console.log('[ProductFormScreen] Updating product with all images:', finalImages);
          
          const updatedProduct = await saveVendorProduct({
            ...productToSave,
            id: savedProduct.id,
            imagens: finalImages
          });
          
          if (updatedProduct) {
            console.log('[ProductFormScreen] Product updated with new images successfully');
          }
        }
      }
      
      toast.success(isEditing ? 'Produto atualizado com sucesso!' : 'Produto criado com sucesso!');
      
      // Clean up blob URLs for new files
      imagePreviews.forEach((preview) => {
        if (preview.startsWith('blob:')) {
          URL.revokeObjectURL(preview);
        }
      });
      
      // Update states with final results
      setImageFiles([]);
      setExistingImages(finalImages);
      setImagePreviews(finalImages);
      setFormData(prev => ({
        ...prev,
        id: savedProduct.id,
        imagens: finalImages
      }));
      
      // Navigate back to products list
      setTimeout(() => {
        navigate('/vendor/products');
      }, 1500);
      
    } catch (error) {
      console.error('[ProductFormScreen] Error saving product:', error);
      toast.error('Erro ao salvar produto: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white p-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center">
          <button onClick={() => navigate('/vendor/products')} className="mr-4">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold">
            {isEditing ? 'Editar Produto' : 'Novo Produto'}
          </h1>
        </div>
        <button
          onClick={handleSave}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50"
        >
          <Save size={16} />
          {loading ? 'Salvando...' : 'Salvar'}
        </button>
      </div>

      {/* Form Content */}
      <div className="flex-1 p-6 space-y-6">
        {/* Basic Information */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Informações Básicas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Nome do Produto *</label>
              <input
                type="text"
                value={formData.nome}
                onChange={(e) => handleInputChange('nome', e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Digite o nome do produto"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Categoria *</label>
              <ProductCategorySelect
                value={formData.categoria}
                onChange={handleCategoryChange}
                segmentId={currentSegmentId}
                required={true}
              />
            </div>
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium mb-2">Descrição</label>
            <textarea
              value={formData.descricao}
              onChange={(e) => handleInputChange('descricao', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 h-24"
              placeholder="Descrição detalhada do produto"
            />
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium mb-2">Segmento</label>
            <ProductSegmentSelect
              value={formData.segmento}
              onChange={handleSegmentNameChange}
              onSegmentIdChange={handleSegmentIdChange}
              initialSegmentId={currentSegmentId}
            />
          </div>
        </div>

        {/* Product Identification */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Identificação do Produto</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">SKU (Código do Produto)</label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => handleInputChange('sku', e.target.value.toUpperCase())}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Ex: PROD-001, ABC123"
                maxLength={50}
              />
              <p className="text-xs text-gray-500 mt-1">
                Código único para identificação interna do produto
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Código de Barras</label>
              <input
                type="text"
                value={formData.codigo_barras}
                onChange={(e) => handleInputChange('codigo_barras', formatBarcode(e.target.value))}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Ex: 1234567890123"
                maxLength={14}
              />
              <p className="text-xs text-gray-500 mt-1">
                Código de barras EAN-8, EAN-13, UPC-12 ou EAN-14
              </p>
              {formData.codigo_barras && !validateBarcode(formData.codigo_barras) && (
                <p className="text-xs text-red-500 mt-1">
                  Formato inválido. Use 8, 12, 13 ou 14 dígitos
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Estoque e Preço</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Preço por unidade *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.preco_normal}
                onChange={(e) => handleInputChange('preco_normal', parseFloat(e.target.value) || 0)}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Preço promocional</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.preco_promocional || ''}
                onChange={(e) => handleInputChange('preco_promocional', e.target.value ? parseFloat(e.target.value) : null)}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Estoque disponível *</label>
              <input
                type="number"
                min="0"
                value={formData.estoque}
                onChange={(e) => handleInputChange('estoque', parseInt(e.target.value) || 0)}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="0"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Imagens</h2>
          <p className="text-sm text-gray-600 mb-4">
            Adicione até 5 imagens do produto (primeira será a principal) *
          </p>
          
          {/* Image Upload Area */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
              id="image-upload"
              disabled={uploadingImages || imagePreviews.length >= 5}
            />
            <label
              htmlFor="image-upload"
              className={`cursor-pointer ${uploadingImages || imagePreviews.length >= 5 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600">
                {uploadingImages ? 'Processando imagens...' : 
                 imagePreviews.length >= 5 ? 'Máximo de 5 imagens atingido' :
                 'Clique para adicionar imagens ou arraste aqui'}
              </p>
            </label>
          </div>

          {/* Image Previews */}
          {imagePreviews.length > 0 && (
            <div className="mt-4">
              <h3 className="text-md font-medium mb-2">
                Imagens ({imagePreviews.length}/5)
                {existingImages.length > 0 && ` - ${existingImages.length} existente(s)`}
                {imageFiles.length > 0 && ` - ${imageFiles.length} nova(s)`}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {imagePreviews.map((imageUrl, index) => {
                  const isExisting = existingImages.includes(imageUrl);
                  const isBlob = imageUrl.startsWith('blob:');
                  
                  return (
                    <div key={index} className="relative group">
                      <img
                        src={imageUrl}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border"
                        onError={(e) => {
                          console.error(`Error loading preview image ${index}:`, imageUrl);
                          e.currentTarget.src = 'https://via.placeholder.com/150x150?text=Erro';
                        }}
                      />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={12} />
                      </button>
                      {index === 0 && (
                        <div className="absolute bottom-1 left-1 bg-blue-500 text-white text-xs px-1 rounded">
                          Principal
                        </div>
                      )}
                      {isExisting && (
                        <div className="absolute top-1 left-1 bg-green-500 text-white text-xs px-1 rounded">
                          Existente
                        </div>
                      )}
                      {isBlob && (
                        <div className="absolute top-1 left-1 bg-orange-500 text-white text-xs px-1 rounded">
                          Nova
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {imagePreviews.length === 0 && (
            <p className="text-red-500 text-sm mt-2">É obrigatório adicionar pelo menos uma imagem.</p>
          )}
          
          {imageFiles.length > 0 && (
            <p className="text-blue-600 text-sm mt-2">
              {imageFiles.length} nova(s) imagem(ns) será(ão) enviada(s) quando você salvar o produto.
            </p>
          )}
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Pontos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Pontos para consumidor</label>
              <input
                type="number"
                min="0"
                value={formData.pontos_consumidor}
                onChange={(e) => handleInputChange('pontos_consumidor', parseInt(e.target.value) || 0)}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Pontos para profissional</label>
              <input
                type="number"
                min="0"
                value={formData.pontos_profissional}
                onChange={(e) => handleInputChange('pontos_profissional', parseInt(e.target.value) || 0)}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="0"
              />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            A pontuação é concedida com base no perfil do cliente. Consumidores e profissionais ganham pontos diferentes que podem ser resgatados posteriormente.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProductFormScreen;
