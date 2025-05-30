
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/sonner';
import { saveVendorProduct } from '@/services/vendorProductsService';

// Define product form schema
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
  unidadeVenda: z.enum(['unidade', 'm2', 'litro', 'kg', 'caixa', 'pacote']),
  valorConversao: z.number().optional().nullable(),
  controleQuantidade: z.enum(['multiplo', 'livre']),
  
  // Stock and Price
  preco: z.number().min(0.01, { message: 'O preço deve ser maior que zero' }),
  estoque: z.number().int().min(0, { message: 'O estoque não pode ser negativo' }),
  precoPromocional: z.number().optional().nullable(),
  
  // Points
  pontosConsumidor: z.number().int().min(0),
  pontosProfissional: z.number().int().min(0),
  
  // Variants
  temVariantes: z.boolean().default(false),
  tipoVariante: z.string().optional(),
  variantes: z.array(z.string()).optional(),
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
        unidadeVenda: initialData.unidadeVenda || 'unidade',
        valorConversao: initialData.valorConversao || null,
        controleQuantidade: initialData.controleQuantidade || 'livre',
        preco: initialData.preco_normal || 0,
        estoque: initialData.estoque || 0,
        precoPromocional: initialData.preco_promocional || null,
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

  const onSubmit = async (values: ProductFormValues) => {
    if (images.length === 0) {
      toast.error("É necessário adicionar pelo menos uma imagem do produto.");
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Prepare data for API
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
        preco_promocional: values.precoPromocional || null,
        estoque: values.estoque,
        pontos_consumidor: values.pontosConsumidor,
        pontos_profissional: values.pontosProfissional,
        imagens: images,
        status: isEditing ? 'pendente' as const : 'pendente' as const,
      };
      
      console.log("Saving product data:", productData);
      
      const savedProduct = await saveVendorProduct(productData);
      
      if (!savedProduct) {
        toast.error("Erro ao salvar produto", { 
          description: "Ocorreu um erro ao salvar os dados do produto."
        });
        return;
      }
      
      toast.success(isEditing ? "Produto atualizado" : "Produto cadastrado", {
        description: isEditing 
          ? "As alterações foram salvas com sucesso." 
          : "O produto foi cadastrado com sucesso."
      });
      
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

  return {
    form,
    isSubmitting,
    selectedTags,
    setSelectedTags,
    images,
    setImages,
    isLoading,
    segmentId,
    setSegmentId,
    onSubmit,
    navigate
  };
};
