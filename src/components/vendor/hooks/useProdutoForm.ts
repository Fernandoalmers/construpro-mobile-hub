
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/sonner';
import { saveVendorProduct } from '@/services/vendorProductsService';
import { uploadProductImage } from '@/services/vendor/products/productImages';

// Define product form schema with promotion fields
const productFormSchema = z.object({
  // General Information
  nome: z.string().min(3, { message: 'O nome deve ter pelo menos 3 caracteres' }),
  descricao: z.string().min(10, { message: 'A descrição deve ter pelo menos 10 caracteres' }),
  categoria: z.string().min(1, { message: 'Selecione uma categoria' }),
  segmento: z.string().min(1, { message: 'Selecione um segmento' }),
  marca: z.string().optional(),
  tags: z.array(z.string()).optional(),
  
  // Product Identification
  sku: z.string().optional(),
  codigo_barras: z.string().optional(),
  
  // Unit and Packaging
  unidadeVenda: z.enum(['unidade', 'm2', 'litro', 'kg', 'caixa', 'pacote', 'barra', 'saco', 'rolo']),
  valorConversao: z.number().optional().nullable(),
  controleQuantidade: z.enum(['multiplo', 'livre']),
  
  // Stock and Price
  preco: z.number().min(0.01, { message: 'O preço deve ser maior que zero' }),
  estoque: z.number().min(0, { message: 'O estoque não pode ser negativo' }),
  precoPromocional: z.number().optional().nullable(),
  
  // Promotion Fields
  promocaoAtiva: z.boolean().default(false),
  promocaoInicio: z.string().optional(),
  promocaoFim: z.string().optional(),
  
  // Points
  pontosConsumidor: z.number().int().min(0),
  pontosProfissional: z.number().int().min(0),
  
  // Variants
  temVariantes: z.boolean().default(false),
  tipoVariante: z.string().optional(),
  variantes: z.array(z.string()).optional(),
}).refine((data) => {
  // Validate promotion dates if promotion is active
  if (data.promocaoAtiva) {
    if (!data.precoPromocional) {
      return false;
    }
    if (data.precoPromocional >= data.preco) {
      return false;
    }
    if (!data.promocaoInicio || !data.promocaoFim) {
      return false;
    }
    if (new Date(data.promocaoInicio) >= new Date(data.promocaoFim)) {
      return false;
    }
    if (new Date(data.promocaoInicio) <= new Date()) {
      return false;
    }
  }
  return true;
}, {
  message: "Configuração de promoção inválida",
  path: ["promocaoAtiva"]
});

export type ProductFormValues = z.infer<typeof productFormSchema>;

interface UseProdutoFormProps {
  isEditing?: boolean;
  productId?: string;
  initialData?: any;
}

export const useProdutoForm = ({ isEditing = false, productId, initialData }: UseProdutoFormProps) => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(isEditing);
  const [segmentId, setSegmentId] = useState<string | null>(null);

  // Form definition
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      nome: '',
      descricao: '',
      categoria: '',
      segmento: '',
      marca: '',
      tags: [],
      sku: '',
      codigo_barras: '',
      unidadeVenda: 'unidade',
      valorConversao: null,
      controleQuantidade: 'livre',
      preco: 0,
      estoque: 0,
      precoPromocional: null,
      promocaoAtiva: false,
      promocaoInicio: '',
      promocaoFim: '',
      pontosConsumidor: 0,
      pontosProfissional: 0,
      temVariantes: false,
      tipoVariante: '',
      variantes: [],
    }
  });

  // Load product data if in edit mode
  useEffect(() => {
    if (isEditing && initialData) {
      console.log("Setting form data from initialData:", initialData);
      
      setIsLoading(true);
      
      // Initialize form with product data
      form.reset({
        nome: initialData.nome || '',
        descricao: initialData.descricao || '',
        categoria: initialData.categoria || '',
        segmento: initialData.segmento || '',
        marca: initialData.marca || '',
        tags: initialData.tags || [],
        sku: initialData.sku || '',
        codigo_barras: initialData.codigo_barras || '',
        unidadeVenda: initialData.unidade_medida || 'unidade',
        valorConversao: initialData.valor_conversao || null,
        controleQuantidade: initialData.controle_quantidade || 'livre',
        preco: initialData.preco_normal || 0,
        estoque: initialData.estoque || 0,
        precoPromocional: initialData.preco_promocional || null,
        promocaoAtiva: initialData.promocao_ativa || false,
        promocaoInicio: initialData.promocao_inicio ? new Date(initialData.promocao_inicio).toISOString().slice(0, 16) : '',
        promocaoFim: initialData.promocao_fim ? new Date(initialData.promocao_fim).toISOString().slice(0, 16) : '',
        pontosConsumidor: initialData.pontos_consumidor || 0,
        pontosProfissional: initialData.pontos_profissional || 0,
        temVariantes: false,
        tipoVariante: '',
        variantes: [],
      });
      
      // Set selected tags
      if (initialData.tags && Array.isArray(initialData.tags)) {
        setSelectedTags(initialData.tags);
      }
      
      // Load images
      if (initialData.imagens && Array.isArray(initialData.imagens)) {
        setImages(initialData.imagens);
      }
      
      setIsLoading(false);
    }
  }, [isEditing, initialData, form]);

  // Helper function to upload new image files
  const uploadNewImages = async (productId: string, files: File[]): Promise<string[]> => {
    const uploadedUrls: string[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      console.log(`Uploading image ${i + 1}/${files.length}:`, file.name);
      
      try {
        const uploadedUrl = await uploadProductImage(productId, file, i);
        if (uploadedUrl) {
          uploadedUrls.push(uploadedUrl);
          console.log(`Successfully uploaded image ${i + 1}:`, uploadedUrl);
        } else {
          console.warn(`Failed to upload image ${i + 1}:`, file.name);
        }
      } catch (error) {
        console.error(`Error uploading image ${i + 1}:`, error);
      }
    }
    
    return uploadedUrls;
  };

  const onSubmit = async (values: ProductFormValues) => {
    // Separate existing images from new files
    const existingImages = images.filter(img => !img.startsWith('blob:'));
    const newImageFiles = imageFiles;

    // Check if we have at least one image (existing or new)
    if (existingImages.length === 0 && newImageFiles.length === 0) {
      toast.error("É necessário adicionar pelo menos uma imagem do produto.");
      return;
    }

    // Additional validation for promotions
    if (values.promocaoAtiva) {
      if (!values.precoPromocional || values.precoPromocional >= values.preco) {
        toast.error("O preço promocional deve ser menor que o preço normal.");
        return;
      }
      if (!values.promocaoInicio || !values.promocaoFim) {
        toast.error("Defina as datas de início e fim da promoção.");
        return;
      }
      if (new Date(values.promocaoInicio) >= new Date(values.promocaoFim)) {
        toast.error("A data de fim deve ser posterior à data de início.");
        return;
      }
      if (new Date(values.promocaoInicio) <= new Date()) {
        toast.error("A data de início deve ser futura.");
        return;
      }
    }

    setIsSubmitting(true);
    
    try {
      // Prepare data for API - initially with existing images only
      const productData = {
        id: productId,
        nome: values.nome,
        descricao: values.descricao,
        categoria: values.categoria,
        segmento: values.segmento,
        segmento_id: segmentId,
        sku: values.sku?.trim() || undefined,
        codigo_barras: values.codigo_barras?.trim() || undefined,
        preco_normal: values.preco,
        preco_promocional: values.promocaoAtiva ? values.precoPromocional : null,
        promocao_ativa: values.promocaoAtiva,
        promocao_inicio: values.promocaoAtiva ? values.promocaoInicio : null,
        promocao_fim: values.promocaoAtiva ? values.promocaoFim : null,
        estoque: values.estoque,
        unidade_medida: values.unidadeVenda,
        valor_conversao: values.valorConversao,
        controle_quantidade: values.controleQuantidade,
        pontos_consumidor: values.pontosConsumidor,
        pontos_profissional: values.pontosProfissional,
        imagens: existingImages, // Start with existing images only
        status: 'pendente' as const,
      };
      
      console.log("Saving product data:", productData);
      console.log("New image files to upload:", newImageFiles.length);
      
      // Save the product first
      const savedProduct = await saveVendorProduct(productData);
      
      if (!savedProduct) {
        toast.error("Erro ao salvar produto", { 
          description: "Ocorreu um erro ao salvar os dados do produto."
        });
        return;
      }

      console.log("Product saved successfully:", savedProduct.id);
      
      // Now upload new images if there are any
      let finalImages = [...existingImages];
      
      if (newImageFiles.length > 0) {
        console.log("Uploading new images...");
        
        try {
          const uploadedUrls = await uploadNewImages(savedProduct.id, newImageFiles);
          finalImages = [...finalImages, ...uploadedUrls];
          
          console.log("Final images array:", finalImages);
          
          // Update product with all images if new ones were uploaded
          if (uploadedUrls.length > 0) {
            const updatedProductData = {
              ...productData,
              id: savedProduct.id,
              imagens: finalImages
            };
            
            console.log("Updating product with new images:", updatedProductData);
            
            const updatedProduct = await saveVendorProduct(updatedProductData);
            
            if (updatedProduct) {
              console.log("Product updated with new images successfully");
            }
          }
        } catch (uploadError) {
          console.error("Error uploading images:", uploadError);
          toast.error("Produto salvo, mas houve erro no upload de algumas imagens");
        }
      }
      
      const successMessage = values.promocaoAtiva 
        ? "Produto cadastrado com promoção ativa!"
        : isEditing ? "Produto atualizado" : "Produto cadastrado";
      
      toast.success(successMessage, {
        description: isEditing 
          ? "As alterações foram salvas com sucesso." 
          : "O produto foi cadastrado com sucesso."
      });
      
      // Clear blob URLs to prevent memory leaks
      images.forEach(img => {
        if (img.startsWith('blob:')) {
          URL.revokeObjectURL(img);
        }
      });
      
      // Update state with final images
      setImages(finalImages);
      setImageFiles([]);
      
      navigate('/vendor/products');
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error("Erro ao salvar produto", {
        description: "Ocorreu um erro ao salvar os dados do produto."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Enhanced function to handle adding new images
  const addImages = (files: File[]) => {
    const newFiles = [...imageFiles];
    const newPreviews = [...images];
    
    // Process each file
    for (const file of files) {
      if (newFiles.length + newPreviews.length >= 5) {
        toast.error("Máximo de 5 imagens permitidas");
        break;
      }
      
      // Add to files array
      newFiles.push(file);
      
      // Create blob URL for preview
      const blobUrl = URL.createObjectURL(file);
      newPreviews.push(blobUrl);
    }
    
    setImageFiles(newFiles);
    setImages(newPreviews);
  };

  const removeImage = (index: number) => {
    const imageToRemove = images[index];
    const isNewImage = imageToRemove?.startsWith('blob:');
    
    // Create new arrays
    const newImages = [...images];
    const newFiles = [...imageFiles];
    
    // Remove from previews
    newImages.splice(index, 1);
    
    // If it's a blob URL, find and remove corresponding file
    if (isNewImage) {
      // Find the corresponding file index
      const blobUrls = images.filter(img => img.startsWith('blob:'));
      const blobIndex = blobUrls.indexOf(imageToRemove);
      
      if (blobIndex !== -1) {
        // Remove the file at the corresponding index
        const fileIndex = imageFiles.length - blobUrls.length + blobIndex;
        if (fileIndex >= 0 && fileIndex < newFiles.length) {
          newFiles.splice(fileIndex, 1);
        }
      }
      
      // Revoke the blob URL to free memory
      URL.revokeObjectURL(imageToRemove);
    }
    
    setImages(newImages);
    setImageFiles(newFiles);
  };

  return {
    form,
    isSubmitting,
    selectedTags,
    setSelectedTags,
    images,
    setImages,
    imageFiles,
    addImages,
    removeImage,
    isLoading,
    segmentId,
    setSegmentId,
    onSubmit,
    navigate
  };
};
