
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Image as ImageIcon, Save, Trash } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getVendorProduct, 
  saveVendorProduct,
  uploadProductImage,
  updateProductImages,
  VendorProduct 
} from '@/services/vendorService';
import LoadingState from '../common/LoadingState';

interface ProductFormScreenProps {
  isEditing?: boolean;
  productId?: string;
}

const ProductFormScreen: React.FC<ProductFormScreenProps> = ({ isEditing, productId }) => {
  const params = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  
  // Get product ID from props or URL params
  const id = productId || params.id;
  
  // Check if this is a clone operation
  const isCloning = location.pathname.includes('/vendor/product-clone');
  
  const [formData, setFormData] = useState<Partial<VendorProduct>>({
    nome: '',
    descricao: '',
    preco_normal: 0,
    preco_promocional: undefined,
    estoque: 0,
    codigo_barras: '',
    sku: '',
    categoria: '',
    pontos_consumidor: 0,
    pontos_profissional: 0,
    imagens: []
  });
  const [activeTab, setActiveTab] = useState('basic');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  // Categories (could be fetched from an API in the future)
  const categories = [
    'Ferramentas',
    'Material de Construção',
    'Tintas',
    'Elétrica',
    'Hidráulica',
    'Acabamento',
    'Decoração',
    'Jardinagem',
    'Segurança',
    'Outro'
  ];
  
  // Fetch product data if in edit mode
  const { data: productData, isLoading } = useQuery({
    queryKey: ['vendorProduct', id],
    queryFn: () => getVendorProduct(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Save product mutation
  const saveProductMutation = useMutation({
    mutationFn: (data: Partial<VendorProduct>) => saveVendorProduct(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['vendorProducts'] });
      if (data?.id) {
        queryClient.invalidateQueries({ queryKey: ['vendorProduct', data.id] });
      }
      toast.success(isEditing ? 'Produto atualizado com sucesso!' : 'Produto criado com sucesso!');
      navigate('/vendor/products');
    },
    onError: (error: any) => {
      toast.error(`Erro ao salvar produto: ${error.message || 'Verifique os campos e tente novamente'}`);
      console.error('Error saving product:', error);
    }
  });
  
  // Load product data into form when available
  useEffect(() => {
    if (productData && (isEditing || isCloning)) {
      // For cloning, we keep all data except id
      if (isCloning) {
        const { id, ...cloneData } = productData;
        setFormData(cloneData);
        
        // Set preview images from existing product
        if (cloneData.imagens && Array.isArray(cloneData.imagens)) {
          setPreviewImages(cloneData.imagens);
        }
      } else {
        setFormData(productData);
        
        // Set preview images from existing product
        if (productData.imagens && Array.isArray(productData.imagens)) {
          setPreviewImages(productData.imagens);
        }
      }
    }
  }, [productData, isEditing, isCloning]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when field is being edited
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  const handleNumberInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Allow empty values in input (will be handled during validation before submit)
    if (value === '') {
      setFormData(prev => ({ ...prev, [name]: undefined }));
    } else {
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        setFormData(prev => ({ ...prev, [name]: numValue }));
      }
    }
    
    // Clear error when field is being edited
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedImages(prev => [...prev, ...filesArray]);
      
      // Create preview URLs
      const newPreviewUrls = filesArray.map(file => URL.createObjectURL(file));
      setPreviewImages(prev => [...prev, ...newPreviewUrls]);
      
      // Clear any image-related errors
      if (formErrors.imagens) {
        setFormErrors(prev => ({ ...prev, imagens: '' }));
      }
    }
  };
  
  const handleRemoveImage = (index: number) => {
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
    
    // Also remove from selectedImages if it's a new image
    if (index < selectedImages.length) {
      setSelectedImages(prev => prev.filter((_, i) => i !== index));
    }
    
    // Update formData.imagens if it exists
    if (formData.imagens && Array.isArray(formData.imagens)) {
      const updatedImages = [...formData.imagens];
      updatedImages.splice(index, 1);
      setFormData(prev => ({
        ...prev,
        imagens: updatedImages
      }));
    }
  };
  
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    // Basic required fields
    if (!formData.nome?.trim()) {
      errors.nome = 'Nome do produto é obrigatório';
    }
    
    if (!formData.descricao?.trim()) {
      errors.descricao = 'Descrição do produto é obrigatória';
    }
    
    if (!formData.categoria) {
      errors.categoria = 'Categoria do produto é obrigatória';
    }
    
    // Numeric fields validation
    if (formData.preco_normal === undefined || formData.preco_normal <= 0) {
      errors.preco_normal = 'Preço deve ser maior que zero';
    }
    
    if (formData.preco_promocional !== undefined && formData.preco_promocional <= 0) {
      errors.preco_promocional = 'Preço promocional deve ser maior que zero';
    }
    
    // If promotional price is higher than regular price
    if (formData.preco_promocional !== undefined && 
        formData.preco_normal !== undefined && 
        formData.preco_promocional >= formData.preco_normal) {
      errors.preco_promocional = 'Preço promocional deve ser menor que o preço regular';
    }
    
    // Image validation - only when there are no images
    if ((!formData.imagens || formData.imagens.length === 0) && previewImages.length === 0) {
      errors.imagens = 'Pelo menos uma imagem é obrigatória';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form before submission
    if (!validateForm()) {
      // Show toast with first error
      const firstError = Object.values(formErrors)[0];
      toast.error(firstError || 'Verifique os campos obrigatórios');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Create or update the product first to get an ID
      let productToSave: Partial<VendorProduct> = { ...formData };
      
      // If cloning, make sure we don't include the original product's ID
      if (isCloning) {
        delete productToSave.id;
      }
      
      // If editing, keep the ID
      if (isEditing && id) {
        productToSave.id = id;
      }
      
      // Force numeric fields to be numbers, not undefined
      productToSave.preco_normal = productToSave.preco_normal || 0;
      productToSave.estoque = productToSave.estoque || 0;
      productToSave.pontos_consumidor = productToSave.pontos_consumidor || 0;
      productToSave.pontos_profissional = productToSave.pontos_profissional || 0;
      
      // Save the product
      const savedProduct = await saveProductMutation.mutateAsync(productToSave);
      
      if (!savedProduct) {
        throw new Error('Erro ao salvar produto');
      }
      
      // If there are new images to upload
      if (selectedImages.length > 0 && savedProduct.id) {
        const imageUrls: string[] = [];
        let uploadFailed = false;
        
        // Upload each image
        for (let i = 0; i < selectedImages.length; i++) {
          const file = selectedImages[i];
          const imageUrl = await uploadProductImage(savedProduct.id, file, i);
          if (imageUrl) {
            imageUrls.push(imageUrl);
          } else {
            uploadFailed = true;
          }
        }
        
        if (uploadFailed) {
          toast.warning('Algumas imagens não puderam ser enviadas. Verifique e tente novamente.');
        }
        
        // Combine existing images with new ones
        const existingImages = (savedProduct.imagens || []).filter(url => 
          typeof url === 'string' && !url.startsWith('blob:')
        );
        
        const allImages = [...existingImages, ...imageUrls];
        
        // Update the product with the new image URLs
        if (imageUrls.length > 0) {
          await updateProductImages(savedProduct.id, allImages);
        }
      }
      
      toast.success(isEditing ? 'Produto atualizado com sucesso!' : 'Produto criado com sucesso!');
      navigate('/vendor/products');
    } catch (error: any) {
      console.error('Error in handleSubmit:', error);
      toast.error(`Erro ao salvar produto: ${error.message || 'Tente novamente'}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isLoading && (isEditing || isCloning)) {
    return <LoadingState text="Carregando dados do produto..." />;
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      <div className="bg-white p-4 shadow-sm flex items-center">
        <button onClick={() => navigate('/vendor/products')} className="mr-4">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold">
          {isEditing ? 'Editar Produto' : isCloning ? 'Clonar Produto' : 'Novo Produto'}
        </h1>
      </div>

      <div className="p-6">
        <form onSubmit={handleSubmit} noValidate>
          <Tabs defaultValue="basic" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 mb-6 sm:grid-cols-3">
              <TabsTrigger value="basic">Informações Básicas</TabsTrigger>
              <TabsTrigger value="details">Detalhes</TabsTrigger>
              <TabsTrigger value="images">Imagens</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic">
              <Card className="p-6 space-y-6">
                <div>
                  <Label htmlFor="nome" className="block mb-2">Nome do Produto *</Label>
                  <Input
                    id="nome"
                    name="nome"
                    value={formData.nome || ''}
                    onChange={handleInputChange}
                    placeholder="Ex: Furadeira de Impacto 650W"
                    className={formErrors.nome ? "border-red-500" : ""}
                  />
                  {formErrors.nome && (
                    <p className="text-sm text-red-500 mt-1">{formErrors.nome}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="descricao" className="block mb-2">Descrição *</Label>
                  <Textarea
                    id="descricao"
                    name="descricao"
                    value={formData.descricao || ''}
                    onChange={handleInputChange}
                    placeholder="Descreva detalhes do produto..."
                    rows={4}
                    className={formErrors.descricao ? "border-red-500" : ""}
                  />
                  {formErrors.descricao && (
                    <p className="text-sm text-red-500 mt-1">{formErrors.descricao}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="categoria" className="block mb-2">Categoria *</Label>
                  <Select
                    value={formData.categoria || ''}
                    onValueChange={(value) => {
                      setFormData(prev => ({ ...prev, categoria: value }));
                      if (formErrors.categoria) {
                        setFormErrors(prev => ({ ...prev, categoria: '' }));
                      }
                    }}
                  >
                    <SelectTrigger className={formErrors.categoria ? "border-red-500" : ""}>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formErrors.categoria && (
                    <p className="text-sm text-red-500 mt-1">{formErrors.categoria}</p>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="preco_normal" className="block mb-2">Preço Regular (R$) *</Label>
                    <Input
                      id="preco_normal"
                      name="preco_normal"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.preco_normal === undefined ? '' : formData.preco_normal}
                      onChange={handleNumberInputChange}
                      placeholder="0.00"
                      className={formErrors.preco_normal ? "border-red-500" : ""}
                      inputMode="decimal"
                    />
                    {formErrors.preco_normal && (
                      <p className="text-sm text-red-500 mt-1">{formErrors.preco_normal}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="preco_promocional" className="block mb-2">Preço Promocional (R$)</Label>
                    <Input
                      id="preco_promocional"
                      name="preco_promocional"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.preco_promocional === undefined ? '' : formData.preco_promocional}
                      onChange={handleNumberInputChange}
                      placeholder="0.00"
                      className={formErrors.preco_promocional ? "border-red-500" : ""}
                      inputMode="decimal"
                    />
                    {formErrors.preco_promocional && (
                      <p className="text-sm text-red-500 mt-1">{formErrors.preco_promocional}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button 
                    type="button" 
                    variant="outline"
                    className="mr-2"
                    onClick={() => navigate('/vendor/products')}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="button"
                    onClick={() => setActiveTab('details')}
                  >
                    Próximo
                  </Button>
                </div>
              </Card>
            </TabsContent>
            
            <TabsContent value="details">
              <Card className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="estoque" className="block mb-2">Estoque</Label>
                    <Input
                      id="estoque"
                      name="estoque"
                      type="number"
                      min="0"
                      value={formData.estoque === undefined ? '' : formData.estoque}
                      onChange={handleNumberInputChange}
                      placeholder="0"
                      inputMode="numeric"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="sku" className="block mb-2">SKU / Código</Label>
                    <Input
                      id="sku"
                      name="sku"
                      value={formData.sku || ''}
                      onChange={handleInputChange}
                      placeholder="Ex: PROD-12345"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="codigo_barras" className="block mb-2">Código de Barras</Label>
                  <Input
                    id="codigo_barras"
                    name="codigo_barras"
                    value={formData.codigo_barras || ''}
                    onChange={handleInputChange}
                    placeholder="Ex: 7891234567890"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="pontos_consumidor" className="block mb-2">Pontos para Consumidores</Label>
                    <Input
                      id="pontos_consumidor"
                      name="pontos_consumidor"
                      type="number"
                      min="0"
                      value={formData.pontos_consumidor === undefined ? '' : formData.pontos_consumidor}
                      onChange={handleNumberInputChange}
                      placeholder="0"
                      inputMode="numeric"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="pontos_profissional" className="block mb-2">Pontos para Profissionais</Label>
                    <Input
                      id="pontos_profissional"
                      name="pontos_profissional"
                      type="number"
                      min="0"
                      value={formData.pontos_profissional === undefined ? '' : formData.pontos_profissional}
                      onChange={handleNumberInputChange}
                      placeholder="0"
                      inputMode="numeric"
                    />
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={() => setActiveTab('basic')}
                  >
                    Voltar
                  </Button>
                  <Button 
                    type="button"
                    onClick={() => setActiveTab('images')}
                  >
                    Próximo
                  </Button>
                </div>
              </Card>
            </TabsContent>
            
            <TabsContent value="images">
              <Card className="p-6 space-y-6">
                <div>
                  <Label htmlFor="images" className="block mb-2">Imagens do Produto *</Label>
                  <div className={`border-2 border-dashed rounded-md p-6 text-center ${
                    formErrors.imagens ? "border-red-500" : "border-gray-300"
                  }`}>
                    <ImageIcon className="h-12 w-12 mx-auto text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">Arraste e solte suas imagens aqui, ou clique para selecionar</p>
                    <Input
                      id="images"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="mt-4"
                    />
                    {formErrors.imagens && (
                      <p className="text-sm text-red-500 mt-1">{formErrors.imagens}</p>
                    )}
                  </div>
                </div>
                
                {previewImages.length > 0 && (
                  <div>
                    <Label className="block mb-2">Imagens selecionadas</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {previewImages.map((src, index) => (
                        <div key={index} className="relative">
                          <img 
                            src={src} 
                            alt={`Preview ${index}`}
                            className="h-32 w-full object-cover rounded-md"
                          />
                          <button
                            type="button"
                            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                            onClick={() => handleRemoveImage(index)}
                          >
                            <Trash size={16} />
                          </button>
                          {index === 0 && (
                            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs py-1 px-2 text-center">
                              Imagem Principal
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={() => setActiveTab('details')}
                  >
                    Voltar
                  </Button>
                  <Button 
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-construPro-blue hover:bg-blue-700"
                  >
                    <Save size={18} className="mr-2" />
                    {isSubmitting ? 'Salvando...' : 'Salvar Produto'}
                  </Button>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </form>
      </div>
    </div>
  );
};

export default ProductFormScreen;
