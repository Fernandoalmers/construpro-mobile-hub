import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, Save, Info, Package, Tag, Image, Layers, FileSymlink } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import CustomButton from '../common/CustomButton';
import ProductSegmentSelect from './ProductSegmentSelect';
import { saveVendorProduct } from '@/services/vendorProductsService';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

// Define product form schema
const productFormSchema = z.object({
  // General Information
  nome: z.string().min(3, { message: 'O nome deve ter pelo menos 3 caracteres' }),
  descricao: z.string().min(10, { message: 'A descrição deve ter pelo menos 10 caracteres' }),
  categoria: z.string().min(1, { message: 'Selecione uma categoria' }),
  segmento: z.string().min(1, { message: 'Selecione um segmento' }), // Added segmento field
  marca: z.string().optional(),
  tags: z.array(z.string()).optional(),
  
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

type ProductFormValues = z.infer<typeof productFormSchema>;

const categorias = [
  'Porcelanatos', 'Pisos', 'Revestimentos', 'Tintas', 'Ferramentas',
  'Materiais Elétricos', 'Materiais Hidráulicos', 'EPIs', 'Iluminação',
  'Madeiras', 'Acabamentos', 'Decoração', 'Material de Construção'
];

interface ProdutoFormScreenProps {
  isEditing?: boolean;
  productId?: string;
  initialData?: any; // Add this new property to accept initial data
}

const ProdutoFormScreen: React.FC<ProdutoFormScreenProps> = ({ 
  isEditing = false,
  productId,
  initialData = null // Set default value
}) => {
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
      
      // Save segment ID if available
      if (initialData.segmento_id) {
        setSegmentId(initialData.segmento_id);
        console.log("Setting initial segment ID:", initialData.segmento_id);
      }

      // Initialize form with product data
      form.reset({
        nome: initialData.nome || '',
        descricao: initialData.descricao || '',
        categoria: initialData.categoria || '',
        segmento: initialData.segmento || '',
        marca: initialData.marca || '',
        tags: initialData.tags || [],
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

  // Handle tags selection
  const handleTagToggle = (tag: string) => {
    setSelectedTags(current => {
      const isSelected = current.includes(tag);
      const newTags = isSelected 
        ? current.filter(t => t !== tag)
        : [...current, tag];
      
      form.setValue('tags', newTags);
      return newTags;
    });
  };

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newImages = [...images];
      for (let i = 0; i < files.length && newImages.length < 5; i++) {
        newImages.push(URL.createObjectURL(files[i]));
      }
      setImages(newImages);
    }
  };

  // Remove image
  const handleRemoveImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
  };

  // Handle segment ID change
  const handleSegmentIdChange = (id: string) => {
    console.log("Segment ID changed:", id);
    setSegmentId(id);
  };

  // Form submission
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
        categoria: values.categoria || 'Geral', // Ensure categoria is not undefined
        segmento: values.segmento,
        segmento_id: segmentId, // Include segment ID if available
        preco_normal: values.preco,
        preco_promocional: values.precoPromocional || null,
        estoque: values.estoque,
        pontos_consumidor: values.pontosConsumidor,
        pontos_profissional: values.pontosProfissional,
        imagens: images,
        status: isEditing ? 'pendente' as const : 'pendente' as const,
      };
      
      console.log("Saving product data:", productData);
      
      // Call the API to save the product
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
  
  const watchUnidadeVenda = form.watch('unidadeVenda');
  const watchTemVariantes = form.watch('temVariantes');
  const watchTipoVariante = form.watch('tipoVariante');

  const isConversionRequired = ['m2', 'litro', 'kg'].includes(watchUnidadeVenda);
  
  const getConversionFieldLabel = () => {
    switch(watchUnidadeVenda) {
      case 'm2': return 'Área por caixa (m²)';
      case 'litro': return 'Volume por embalagem (litros)';
      case 'kg': return 'Peso por embalagem (kg)';
      default: return 'Valor por embalagem';
    }
  };
  
  const getVariantOptions = () => {
    switch(watchTipoVariante) {
      case 'cor': 
        return ['Branco', 'Preto', 'Cinza', 'Bege', 'Marrom', 'Azul', 'Verde', 'Amarelo', 'Vermelho'];
      case 'tamanho': 
        return ['PP', 'P', 'M', 'G', 'GG', 'XG'];
      case 'volume': 
        return ['0.9L', '3.6L', '18L', '20L'];
      default: 
        return [];
    }
  };

  const availableVariantTypes = [
    { value: 'cor', label: 'Cor' },
    { value: 'tamanho', label: 'Tamanho' },
    { value: 'volume', label: 'Volume' },
  ];

  const tagOptions = [
    { value: 'promocao', label: 'Promoção' },
    { value: 'lancamento', label: 'Lançamento' },
    { value: 'destaque', label: 'Destaque' },
    { value: 'limitado', label: 'Edição Limitada' },
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-100 pb-20">
        <div className="bg-white p-4 flex items-center shadow-sm">
          <button onClick={() => navigate('/vendor/produtos')} className="mr-4">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold">{isEditing ? 'Editar Produto' : 'Novo Produto'}</h1>
        </div>
        <div className="flex-1 flex justify-center items-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-construPro-blue mx-auto"></div>
            <p className="mt-4">Carregando informações do produto...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 pb-20">
      {/* Header */}
      <div className="bg-white p-4 flex items-center shadow-sm">
        <button onClick={() => navigate('/vendor/produtos')} className="mr-4">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold">
          {isEditing ? 'Editar Produto' : 'Novo Produto'}
        </h1>
      </div>
      
      <div className="p-6 space-y-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* General Information Section */}
            <Accordion type="single" collapsible defaultValue="item-1">
              <AccordionItem value="item-1">
                <AccordionTrigger className="bg-white px-4 py-3 rounded-t-md shadow-sm border border-gray-200">
                  <div className="flex items-center space-x-2">
                    <FileSymlink size={20} className="text-construPro-blue" />
                    <span className="font-medium">Informações Gerais</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="bg-white p-4 border-x border-b border-gray-200 rounded-b-md shadow-sm">
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="nome"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome do Produto*</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Ex: Porcelanato Acetinado Bege 60x60" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="descricao"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descrição*</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              placeholder="Descreva detalhes do produto como características, dimensões, aplicações, etc." 
                              className="min-h-[100px]"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="segmento"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Segmento*</FormLabel>
                            <FormControl>
                              <ProductSegmentSelect
                                value={field.value || ''}
                                onChange={field.onChange}
                                error={form.formState.errors.segmento?.message}
                                required={true}
                                onSegmentIdChange={handleSegmentIdChange}
                                initialSegmentId={segmentId || undefined}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="categoria"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Categoria*</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione uma categoria" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {categorias.map(categoria => (
                                  <SelectItem key={categoria} value={categoria}>
                                    {categoria}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="marca"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Marca</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Ex: Portobello" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div>
                        <FormLabel>Tags</FormLabel>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {tagOptions.map(tag => (
                            <div
                              key={tag.value}
                              className={`px-3 py-1 rounded-full text-sm border cursor-pointer transition-colors ${
                                selectedTags.includes(tag.value)
                                  ? 'bg-construPro-blue text-white border-construPro-blue'
                                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                              }`}
                              onClick={() => handleTagToggle(tag.value)}
                            >
                              {tag.label}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            
            {/* Unit and Packaging Section */}
            <Accordion type="single" collapsible defaultValue="item-2">
              <AccordionItem value="item-2">
                <AccordionTrigger className="bg-white px-4 py-3 rounded-t-md shadow-sm border border-gray-200">
                  <div className="flex items-center space-x-2">
                    <Package size={20} className="text-construPro-blue" />
                    <span className="font-medium">Unidade de Venda e Embalagem</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="bg-white p-4 border-x border-b border-gray-200 rounded-b-md shadow-sm">
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="unidadeVenda"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unidade de Venda*</FormLabel>
                          <Select 
                            onValueChange={(value) => {
                              field.onChange(value);
                              // Reset conversion value when changing unit
                              form.setValue('valorConversao', null);
                              
                              // Set quantity control based on unit
                              if (value === 'm2') {
                                form.setValue('controleQuantidade', 'multiplo');
                              }
                            }} 
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione uma unidade" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="unidade">Unidade</SelectItem>
                              <SelectItem value="m2">Metro quadrado (m²)</SelectItem>
                              <SelectItem value="litro">Litro</SelectItem>
                              <SelectItem value="kg">Quilograma (kg)</SelectItem>
                              <SelectItem value="caixa">Caixa</SelectItem>
                              <SelectItem value="pacote">Pacote</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {isConversionRequired && (
                      <FormField
                        control={form.control}
                        name="valorConversao"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{getConversionFieldLabel()}*</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step={watchUnidadeVenda === 'm2' ? 0.01 : 0.1}
                                min={0.01}
                                onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                value={field.value !== null ? field.value : ''}
                                placeholder={watchUnidadeVenda === 'm2' ? "Ex: 2.5" : "Ex: 5"}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    
                    <FormField
                      control={form.control}
                      name="controleQuantidade"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de controle de quantidade*</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                            value={field.value}
                            disabled={watchUnidadeVenda === 'm2'} // Force multiple for m2
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o tipo de controle" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="multiplo">Por múltiplos da embalagem</SelectItem>
                              <SelectItem value="livre">Livre (qualquer valor)</SelectItem>
                            </SelectContent>
                          </Select>
                          {watchUnidadeVenda === 'm2' && (
                            <p className="text-xs text-amber-600 mt-1">
                              Produtos vendidos em m² exigem controle por múltiplos da embalagem.
                            </p>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            
            {/* Stock and Price Section */}
            <Accordion type="single" collapsible defaultValue="item-3">
              <AccordionItem value="item-3">
                <AccordionTrigger className="bg-white px-4 py-3 rounded-t-md shadow-sm border border-gray-200">
                  <div className="flex items-center space-x-2">
                    <Tag size={20} className="text-construPro-blue" />
                    <span className="font-medium">Estoque e Preço</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="bg-white p-4 border-x border-b border-gray-200 rounded-b-md shadow-sm">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="preco"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Preço por {watchUnidadeVenda === 'm2' ? 'm²' : watchUnidadeVenda}*</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R$</span>
                                <Input 
                                  {...field}
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  onChange={e => field.onChange(parseFloat(e.target.value))}
                                  value={field.value || ''}
                                  className="pl-9"
                                  placeholder="0,00"
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="precoPromocional"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Preço promocional</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R$</span>
                                <Input 
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                                  value={field.value !== null ? field.value : ''}
                                  className="pl-9"
                                  placeholder="0,00"
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="estoque"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estoque disponível*</FormLabel>
                          <FormControl>
                            <div className="flex items-center space-x-2">
                              <Input 
                                type="number"
                                step="1"
                                min="0"
                                onChange={e => field.onChange(parseInt(e.target.value))}
                                value={field.value || ''}
                                className="w-full"
                              />
                              <span className="bg-gray-100 px-3 py-2 rounded border text-gray-600 whitespace-nowrap">
                                {watchUnidadeVenda === 'm2' ? 'm²' : watchUnidadeVenda === 'unidade' ? 'un.' : watchUnidadeVenda}
                              </span>
                            </div>
                          </FormControl>
                          <FormMessage />
                          {form.getValues('estoque') === 0 && (
                            <p className="text-xs text-amber-600 mt-1">
                              Produto ficará indisponível para compra com estoque zero.
                            </p>
                          )}
                        </FormItem>
                      )}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            
            {/* Images Section */}
            <Accordion type="single" collapsible defaultValue="item-4">
              <AccordionItem value="item-4">
                <AccordionTrigger className="bg-white px-4 py-3 rounded-t-md shadow-sm border border-gray-200">
                  <div className="flex items-center space-x-2">
                    <Image size={20} className="text-construPro-blue" />
                    <span className="font-medium">Imagens</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="bg-white p-4 border-x border-b border-gray-200 rounded-b-md shadow-sm">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm mb-2">Adicione até 5 imagens do produto (primeira será a principal)*</p>
                      <div className="flex flex-wrap gap-3 mb-3">
                        {images.map((img, index) => (
                          <div key={index} className="relative">
                            <img 
                              src={img} 
                              alt={`Produto ${index + 1}`} 
                              className="w-20 h-20 object-cover rounded border border-gray-200"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(index)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-sm"
                              aria-label="Remover imagem"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </button>
                            {index === 0 && (
                              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-construPro-blue text-white text-xs px-2 py-0.5 rounded">
                                Principal
                              </div>
                            )}
                          </div>
                        ))}
                        
                        {images.length < 5 && (
                          <label className="w-20 h-20 border-2 border-dashed border-gray-300 flex items-center justify-center rounded cursor-pointer hover:bg-gray-50">
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleImageUpload}
                              multiple={true}
                            />
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M12 5v14M5 12h14" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </label>
                        )}
                      </div>
                      {images.length === 0 && (
                        <p className="text-xs text-red-500">É obrigatório adicionar pelo menos uma imagem.</p>
                      )}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            
            {/* Points Section */}
            <Accordion type="single" collapsible defaultValue="item-5">
              <AccordionItem value="item-5">
                <AccordionTrigger className="bg-white px-4 py-3 rounded-t-md shadow-sm border border-gray-200">
                  <div className="flex items-center space-x-2">
                    <Tag size={20} className="text-construPro-blue" />
                    <span className="font-medium">Pontos</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="bg-white p-4 border-x border-b border-gray-200 rounded-b-md shadow-sm">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="pontosConsumidor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center">
                              Pontos para consumidor*
                              <button
                                type="button"
                                onClick={(e) => e.preventDefault()}
                                className="ml-1 text-gray-500 hover:text-gray-700"
                                title="Pontos que o consumidor final ganha ao comprar este produto"
                              >
                                <Info size={14} />
                              </button>
                            </FormLabel>
                            <FormControl>
                              <Input 
                                type="number"
                                step="1"
                                min="0"
                                onChange={e => field.onChange(parseInt(e.target.value))}
                                value={field.value || ''}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="pontosProfissional"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center">
                              Pontos para profissional*
                              <button
                                type="button"
                                onClick={(e) => e.preventDefault()}
                                className="ml-1 text-gray-500 hover:text-gray-700"
                                title="Pontos que o profissional ganha ao comprar este produto"
                              >
                                <Info size={14} />
                              </button>
                            </FormLabel>
                            <FormControl>
                              <Input 
                                type="number"
                                step="1"
                                min="0"
                                onChange={e => field.onChange(parseInt(e.target.value))}
                                value={field.value || ''}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="bg-blue-50 p-3 rounded text-sm text-blue-700 flex items-start">
                      <Info size={16} className="mr-2 flex-shrink-0 mt-0.5" />
                      <p>A pontuação é concedida com base no perfil do cliente. Consumidores e profissionais ganham pontos diferentes que podem ser resgatados posteriormente.</p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            
            {/* Variants Section */}
            <Accordion type="single" collapsible>
              <AccordionItem value="item-6">
                <AccordionTrigger className="bg-white px-4 py-3 rounded-t-md shadow-sm border border-gray-200">
                  <div className="flex items-center space-x-2">
                    <Layers size={20} className="text-construPro-blue" />
                    <span className="font-medium">Variantes (Opcional)</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="bg-white p-4 border-x border-b border-gray-200 rounded-b-md shadow-sm">
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="temVariantes"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Este produto possui variantes (cor, tamanho, volume, etc)
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                    
                    {watchTemVariantes && (
                      <div className="space-y-4 pt-2">
                        <FormField
                          control={form.control}
                          name="tipoVariante"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tipo de variante</FormLabel>
                              <Select 
                                onValueChange={field.onChange}
                                value={field.value || ''}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione o tipo de variante" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {availableVariantTypes.map(type => (
                                    <SelectItem key={type.value} value={type.value}>
                                      {type.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        {watchTipoVariante && (
                          <div>
                            <FormLabel>Opções de {watchTipoVariante === 'cor' ? 'cores' : 
                                             watchTipoVariante === 'tamanho' ? 'tamanhos' : 'volumes'}</FormLabel>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {getVariantOptions().map((option) => (
                                <div
                                  key={option}
                                  className={`px-3 py-1 rounded-full text-sm border cursor-pointer transition-colors ${
                                    form.getValues('variantes')?.includes(option)
                                      ? 'bg-construPro-blue text-white border-construPro-blue'
                                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                                  }`}
                                  onClick={() => {
                                    const currentVariants = form.getValues('variantes') || [];
                                    const isSelected = currentVariants.includes(option);
                                    
                                    const newVariants = isSelected
                                      ? currentVariants.filter(v => v !== option)
                                      : [...currentVariants, option];
                                    
                                    form.setValue('variantes', newVariants);
                                  }}
                                >
                                  {option}
                                </div>
                              ))}
                            </div>
                            
                            {form.getValues('variantes')?.length === 0 && watchTipoVariante && (
                              <p className="text-xs text-amber-600 mt-1">
                                Selecione pelo menos uma opção de variante.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            
            {/* Form actions */}
            <div className="pt-4 flex flex-col gap-2">
              <CustomButton 
                variant="primary" 
                fullWidth 
                type="submit"
                loading={isSubmitting}
                icon={<Save size={18} />}
              >
                {isEditing ? 'Atualizar Produto' : 'Salvar Produto'}
              </CustomButton>
              
              <CustomButton
                variant="outline"
                fullWidth
                type="button"
                onClick={() => navigate('/vendor/produtos')}
              >
                Cancelar
              </CustomButton>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default ProdutoFormScreen;
