
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { 
  Package, Tag, ImagePlus, Trash2, Save, Check, AlertTriangle, Plus, ArrowLeft
} from 'lucide-react';
import { ProductFormData, getProductSegments, getCategoriesBySegment, getVendorStores, saveProduct } from '@/services/vendorProductService';

// Form schema definition
const productFormSchema = z.object({
  nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  descricao: z.string().min(10, "Descrição deve ter pelo menos 10 caracteres"),
  segmento: z.string().min(1, "Segmento é obrigatório"),
  categoria: z.string().optional(),
  codigo_barras: z.string().optional(),
  sku: z.string().min(1, "SKU é obrigatório"),
  preco: z.number().min(0.01, "Preço deve ser maior que zero"),
  preco_anterior: z.number().optional(),
  unidade_venda: z.string().min(1, "Unidade de venda é obrigatória"),
  m2_por_caixa: z.number().optional(),
  estoque: z.number().int().min(0, "Estoque não pode ser negativo"),
  pontos: z.number().int().min(0, "Pontos não pode ser negativo"),
  pontos_profissional: z.number().int().min(0, "Pontos não pode ser negativo"),
  status: z.enum(['pendente', 'aprovado', 'inativo']).default('pendente'),
  loja_id: z.string().min(1, "Selecione uma loja")
});

type ProductFormProps = {
  productId?: string;
  initialData?: ProductFormData;
};

const ProductForm: React.FC<ProductFormProps> = ({ productId, initialData }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [segments, setSegments] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const isEditing = !!productId;

  // Form definition
  const form = useForm<z.infer<typeof productFormSchema>>({
    resolver: zodResolver(productFormSchema),
    defaultValues: initialData || {
      nome: '',
      descricao: '',
      segmento: '',
      categoria: '',
      codigo_barras: '',
      sku: '',
      preco: 0,
      preco_anterior: undefined,
      unidade_venda: 'unidade',
      m2_por_caixa: undefined,
      estoque: 0,
      pontos: 0,
      pontos_profissional: 0,
      status: 'pendente',
      loja_id: ''
    }
  });

  // Load data
  useEffect(() => {
    const loadFormData = async () => {
      setLoading(true);
      
      try {
        // Load segments
        const segmentsData = await getProductSegments();
        setSegments(segmentsData);
        
        // Load stores
        const storesData = await getVendorStores();
        setStores(storesData);
        
        // If editing, load categories for selected segment
        if (initialData?.segmento) {
          const segmentObj = segmentsData.find(s => s.nome === initialData.segmento);
          if (segmentObj) {
            const categoriesData = await getCategoriesBySegment(segmentObj.id);
            setCategories(categoriesData);
          }
        }
        
        // Load images if editing
        if (initialData && initialData.id) {
          // We assume initialData comes with an images array
          if ('images' in initialData && Array.isArray(initialData.images)) {
            const urls = initialData.images.map((img: any) => img.url);
            setImageUrls(urls);
          }
        }
      } catch (error) {
        console.error('Error loading form data:', error);
        toast({
          title: "Erro ao carregar dados",
          description: "Não foi possível carregar os dados necessários.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadFormData();
  }, [initialData]);

  // Handle segment change
  const handleSegmentChange = async (segmentName: string) => {
    form.setValue('segmento', segmentName);
    form.setValue('categoria', ''); // Reset category when segment changes
    
    const segmentObj = segments.find(s => s.nome === segmentName);
    if (segmentObj) {
      const categoriesData = await getCategoriesBySegment(segmentObj.id);
      setCategories(categoriesData);
    } else {
      setCategories([]);
    }
  };

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const newImages: File[] = [];
    const newImageUrls: string[] = [];
    
    Array.from(files).forEach(file => {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Formato inválido",
          description: `${file.name} não é uma imagem válida.`,
          variant: "destructive"
        });
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: `${file.name} excede o tamanho máximo de 5MB.`,
          variant: "destructive"
        });
        return;
      }
      
      newImages.push(file);
      newImageUrls.push(URL.createObjectURL(file));
    });
    
    setImages(prev => [...prev, ...newImages]);
    setImageUrls(prev => [...prev, ...newImageUrls]);
  };

  // Remove image
  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImageUrls(prev => prev.filter((_, i) => i !== index));
    
    // Revoke objectURL to prevent memory leaks
    if (imageUrls[index] && imageUrls[index].startsWith('blob:')) {
      URL.revokeObjectURL(imageUrls[index]);
    }
  };

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof productFormSchema>) => {
    if (imageUrls.length === 0) {
      toast({
        title: "Imagens obrigatórias",
        description: "É necessário adicionar pelo menos uma imagem.",
        variant: "destructive"
      });
      return;
    }
    
    setSubmitting(true);
    
    try {
      const productData: ProductFormData = {
        ...values,
        id: productId
      };
      
      // Determine what to save for images (Files for new uploads, URLs for existing ones)
      const imagesToSave: (File | string)[] = [];
      
      images.forEach((file, index) => {
        imagesToSave.push(file);
      });
      
      // Add any image URLs that weren't replaced
      imageUrls.forEach(url => {
        if (!url.startsWith('blob:')) {
          imagesToSave.push(url);
        }
      });
      
      const result = await saveProduct(productData, imagesToSave);
      
      if (result.success) {
        toast({
          title: isEditing ? "Produto atualizado" : "Produto criado",
          description: isEditing 
            ? "O produto foi atualizado com sucesso." 
            : "O produto foi criado e está pendente de aprovação.",
        });
        navigate('/vendor/products/list');
      } else {
        toast({
          title: "Erro",
          description: result.error || "Ocorreu um erro ao salvar o produto.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao salvar o produto.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-6 h-6 border-2 border-t-construPro-blue rounded-full animate-spin"></div>
        <span className="ml-2">Carregando...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center mb-4">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/vendor/products/list')}
          className="mr-2"
        >
          <ArrowLeft size={20} />
        </Button>
        <h1 className="text-2xl font-bold">{isEditing ? 'Editar Produto' : 'Novo Produto'}</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Tabs defaultValue="basic">
            <TabsList>
              <TabsTrigger value="basic" className="flex items-center gap-2">
                <Package size={16} />
                Informações Básicas
              </TabsTrigger>
              <TabsTrigger value="details" className="flex items-center gap-2">
                <Tag size={16} />
                Detalhes e Preços
              </TabsTrigger>
              <TabsTrigger value="images" className="flex items-center gap-2">
                <ImagePlus size={16} />
                Imagens
              </TabsTrigger>
            </TabsList>
            
            <Card className="mt-4">
              <CardContent className="pt-6">
                <TabsContent value="basic" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="loja_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Loja*</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione uma loja" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {stores.map(store => (
                                <SelectItem key={store.id} value={store.id}>
                                  {store.nome}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Loja que irá vender este produto
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status do produto*</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            disabled={!isEditing}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione um status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="pendente">Pendente de aprovação</SelectItem>
                              <SelectItem value="aprovado">Aprovado</SelectItem>
                              <SelectItem value="inativo">Inativo</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            {!isEditing && 'Novos produtos precisam de aprovação antes de ficarem visíveis'}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="nome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do produto*</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Porcelanato Acetinado Bege 60x60" {...field} />
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
                        <FormLabel>Descrição do produto*</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Descreva detalhes do produto, características, dimensões, aplicações..."
                            className="min-h-[120px]"
                            {...field}
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
                          <Select
                            onValueChange={handleSegmentChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione um segmento" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {segments.map(segment => (
                                <SelectItem key={segment.id} value={segment.nome}>
                                  {segment.nome}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="categoria"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Categoria</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            disabled={categories.length === 0}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={categories.length === 0 ? "Selecione um segmento primeiro" : "Selecione uma categoria"} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories.map(category => (
                                <SelectItem key={category.id} value={category.nome}>
                                  {category.nome}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="details" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="codigo_barras"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Código de Barras</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: 7891234567890" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="sku"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SKU*</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: PISO-BEGE-60X60" {...field} />
                          </FormControl>
                          <FormDescription>
                            Código interno para identificação do produto
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="preco"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preço*</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                R$
                              </span>
                              <Input 
                                type="number"
                                step="0.01" 
                                className="pl-10" 
                                placeholder="0.00"
                                {...field}
                                onChange={e => field.onChange(parseFloat(e.target.value))}
                                value={field.value || ''}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="preco_anterior"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preço Anterior</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                R$
                              </span>
                              <Input 
                                type="number"
                                step="0.01" 
                                className="pl-10" 
                                placeholder="0.00"
                                {...field}
                                onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                value={field.value ?? ''}
                              />
                            </div>
                          </FormControl>
                          <FormDescription>
                            Para mostrar desconto
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="estoque"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estoque disponível*</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              step="1"
                              min="0"
                              placeholder="0"
                              {...field}
                              onChange={e => field.onChange(parseInt(e.target.value))}
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="unidade_venda"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unidade de venda*</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="unidade">Unidade</SelectItem>
                              <SelectItem value="m2">Metro quadrado (m²)</SelectItem>
                              <SelectItem value="metro">Metro</SelectItem>
                              <SelectItem value="kg">Quilograma (kg)</SelectItem>
                              <SelectItem value="litro">Litro</SelectItem>
                              <SelectItem value="pacote">Pacote</SelectItem>
                              <SelectItem value="caixa">Caixa</SelectItem>
                              <SelectItem value="conjunto">Conjunto</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {form.watch('unidade_venda') === 'm2' && (
                      <FormField
                        control={form.control}
                        name="m2_por_caixa"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>m² por caixa</FormLabel>
                            <FormControl>
                              <Input 
                                type="number"
                                step="0.01"
                                min="0.01"
                                placeholder="Ex: 2.5"
                                {...field}
                                onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                value={field.value ?? ''}
                              />
                            </FormControl>
                            <FormDescription>
                              Metragem por caixa (para pisos, porcelanatos, etc.)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="pontos"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pontos para consumidor*</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="1"
                              min="0"
                              placeholder="0"
                              {...field}
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
                      name="pontos_profissional"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pontos para profissional*</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="1"
                              min="0"
                              placeholder="0"
                              {...field}
                              onChange={e => field.onChange(parseInt(e.target.value))}
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="images" className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <FormLabel className="text-base font-medium">Imagens do produto*</FormLabel>
                      <div className="ml-auto">
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={() => document.getElementById('product-images')?.click()}
                          disabled={imageUrls.length >= 5}
                        >
                          <Plus size={16} className="mr-1" />
                          Adicionar Imagem
                        </Button>
                        <Input
                          id="product-images"
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={handleImageUpload}
                          disabled={imageUrls.length >= 5}
                        />
                      </div>
                    </div>
                    
                    {imageUrls.length === 0 ? (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                        <ImagePlus size={48} className="mx-auto text-gray-400" />
                        <p className="mt-2 text-sm text-gray-500">
                          Clique em "Adicionar Imagem" para fazer upload de imagens do produto
                        </p>
                        <p className="mt-1 text-xs text-gray-400">
                          Formatos suportados: JPG, PNG, WEBP. Tamanho máximo: 5MB
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {imageUrls.map((url, index) => (
                          <div key={index} className="relative">
                            <div className="group relative aspect-square rounded-lg overflow-hidden border border-gray-200">
                              <img 
                                src={url} 
                                alt={`Produto ${index + 1}`} 
                                className="w-full h-full object-cover"
                              />
                              {index === 0 && (
                                <div className="absolute top-2 left-2 bg-construPro-blue text-white text-xs rounded px-2 py-1">
                                  Principal
                                </div>
                              )}
                              <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between bg-black bg-opacity-50 p-2">
                                <span className="text-white text-xs">
                                  Imagem {index + 1} de {imageUrls.length}
                                </span>
                                <Button 
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleRemoveImage(index)}
                                  className="h-6 w-6 p-0"
                                >
                                  <Trash2 size={14} />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {imageUrls.length > 0 && (
                      <div className="flex items-center text-sm text-gray-500">
                        <AlertTriangle size={14} className="mr-1" />
                        <span>
                          A primeira imagem será usada como imagem principal do produto
                        </span>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </CardContent>
            </Card>
          </Tabs>
          
          <div className="flex flex-col md:flex-row gap-2">
            <Button 
              type="submit" 
              className="flex-1" 
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin mr-2"></div>
                  Salvando...
                </>
              ) : (
                <>
                  <Save size={16} className="mr-2" />
                  Salvar Produto
                </>
              )}
            </Button>
            
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate('/vendor/products/list')}
              disabled={submitting}
              className="flex-1 md:flex-initial"
            >
              Cancelar
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default ProductForm;
