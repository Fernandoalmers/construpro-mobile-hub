
import React, { useState, useEffect } from 'react';
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

  // Separate state for image files and previews
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  // Initialize form data
  useEffect(() => {
    if (initialData) {
      console.log('Setting form data from initialData:', initialData);
      
      // Parse existing images
      let existingImages: string[] = [];
      if (initialData.imagens) {
        if (typeof initialData.imagens === 'string') {
          try {
            existingImages = JSON.parse(initialData.imagens);
          } catch (e) {
            console.warn('Failed to parse imagens string:', initialData.imagens);
            existingImages = [initialData.imagens]; // Treat as single image
          }
        } else if (Array.isArray(initialData.imagens)) {
          existingImages = initialData.imagens;
        }
      }
      
      setFormData({
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
        imagens: existingImages
      });

      // Set existing images as previews (filter out blob URLs)
      const validImages = existingImages.filter(img => 
        img && !img.startsWith('blob:') && img.trim() !== ''
      );
      setImagePreviews(validImages);
      
      console.log('Setting initial segment ID:', initialData.segmento_id);
    }
  }, [initialData]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

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

    console.log('[ProductForm] Starting image upload for files:', files.map(f => f.name));
    
    setUploadingImages(true);
    
    try {
      const newImageFiles = [...imageFiles, ...files];
      const newPreviews = [...imagePreviews];
      
      // Create blob URLs for immediate preview
      for (const file of files) {
        const previewUrl = URL.createObjectURL(file);
        newPreviews.push(previewUrl);
        console.log('[ProductForm] Created preview URL:', previewUrl);
      }
      
      setImageFiles(newImageFiles);
      setImagePreviews(newPreviews);
      
      toast.success(`${files.length} imagem(ns) adicionada(s). Salve o produto para fazer upload permanente.`);
    } catch (error) {
      console.error('[ProductForm] Error handling image upload:', error);
      toast.error('Erro ao processar imagens');
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (index: number) => {
    console.log('[ProductForm] Removing image at index:', index);
    
    const newPreviews = [...imagePreviews];
    const newFiles = [...imageFiles];
    const newFormImages = [...formData.imagens];
    
    // If it's a blob URL, revoke it
    if (newPreviews[index]?.startsWith('blob:')) {
      URL.revokeObjectURL(newPreviews[index]);
    }
    
    newPreviews.splice(index, 1);
    
    // Remove corresponding file if it exists
    if (newFiles[index]) {
      newFiles.splice(index, 1);
    }
    
    // Remove from form data images if it exists
    if (newFormImages[index]) {
      newFormImages.splice(index, 1);
    }
    
    setImagePreviews(newPreviews);
    setImageFiles(newFiles);
    setFormData(prev => ({
      ...prev,
      imagens: newFormImages
    }));
  };

  const handleSave = async () => {
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

    // Validate barcode if provided
    if (formData.codigo_barras && !validateBarcode(formData.codigo_barras)) {
      toast.error('Código de barras inválido. Use formato EAN-8, EAN-13, UPC-12 ou EAN-14');
      return;
    }

    setLoading(true);
    
    try {
      console.log('[ProductForm] Starting save process');
      console.log('[ProductForm] Form data:', formData);
      console.log('[ProductForm] Image files to upload:', imageFiles.length);
      
      // First, save the product to get an ID if creating new
      let productToSave = { ...formData };
      
      // Prepare images array - start with existing valid images
      let finalImages: string[] = [];
      
      // Add existing valid images (non-blob URLs)
      const existingValidImages = formData.imagens.filter(img => 
        img && !img.startsWith('blob:') && img.trim() !== ''
      );
      finalImages = [...existingValidImages];
      
      console.log('[ProductForm] Existing valid images:', existingValidImages);
      
      // Save product first (with existing images only)
      productToSave.imagens = finalImages;
      const savedProduct = await saveVendorProduct(productToSave);
      
      if (!savedProduct) {
        throw new Error('Falha ao salvar produto');
      }
      
      console.log('[ProductForm] Product saved successfully:', savedProduct.id);
      
      // Now upload new image files
      if (imageFiles.length > 0) {
        console.log('[ProductForm] Uploading', imageFiles.length, 'new images');
        
        for (let i = 0; i < imageFiles.length; i++) {
          const file = imageFiles[i];
          console.log('[ProductForm] Uploading image', i + 1, ':', file.name);
          
          try {
            const uploadedUrl = await uploadProductImage(savedProduct.id, file, finalImages.length + i);
            
            if (uploadedUrl) {
              finalImages.push(uploadedUrl);
              console.log('[ProductForm] Successfully uploaded image:', uploadedUrl);
            } else {
              console.warn('[ProductForm] Failed to upload image:', file.name);
            }
          } catch (uploadError) {
            console.error('[ProductForm] Error uploading image:', file.name, uploadError);
            // Continue with other images even if one fails
          }
        }
        
        // Update product with all images
        if (finalImages.length > existingValidImages.length) {
          console.log('[ProductForm] Updating product with all images:', finalImages);
          
          const updatedProduct = await saveVendorProduct({
            ...productToSave,
            id: savedProduct.id,
            imagens: finalImages
          });
          
          if (updatedProduct) {
            console.log('[ProductForm] Product updated with new images');
          }
        }
      }
      
      toast.success(isEditing ? 'Produto atualizado com sucesso!' : 'Produto criado com sucesso!');
      
      // Clear uploaded files and blob URLs
      imageFiles.forEach((_, index) => {
        const preview = imagePreviews[index];
        if (preview?.startsWith('blob:')) {
          URL.revokeObjectURL(preview);
        }
      });
      
      setImageFiles([]);
      
      // Update previews with final images
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
      console.error('[ProductForm] Error saving product:', error);
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
                onChange={(value) => handleInputChange('categoria', value)}
                segmentId={formData.segmento_id}
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
              onChange={(segmentName) => handleInputChange('segmento', segmentName)}
              onSegmentIdChange={(segmentId) => {
                handleInputChange('segmento_id', segmentId);
                // Clear category when segment changes
                if (formData.categoria) {
                  handleInputChange('categoria', '');
                }
              }}
              initialSegmentId={formData.segmento_id}
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

        {/* Images */}
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
              <h3 className="text-md font-medium mb-2">Imagens ({imagePreviews.length}/5)</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {imagePreviews.map((imageUrl, index) => (
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
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {imagePreviews.length === 0 && (
            <p className="text-red-500 text-sm mt-2">É obrigatório adicionar pelo menos uma imagem.</p>
          )}
        </div>

        {/* Points */}
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
