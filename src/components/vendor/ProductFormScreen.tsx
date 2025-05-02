
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Upload, Plus, Trash, Camera } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CustomButton from '../common/CustomButton';
import Card from '../common/Card';
import { toast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import produtos from '../../data/produtos.json';

const formSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  descricao: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres'),
  segmento: z.string().min(1, 'Segmento é obrigatório'),
  categoria: z.string().min(1, 'Categoria é obrigatória'),
  codigoBarras: z.string().optional(),
  sku: z.string().min(1, 'SKU é obrigatório'),
  preco: z.string().min(1, 'Preço é obrigatório'),
  precoPromocional: z.string().optional(),
  estoque: z.string().min(1, 'Estoque é obrigatório'),
  unidadeVenda: z.string().min(1, 'Unidade de venda é obrigatória'),
  m2PorCaixa: z.string().optional(),
  pontosConsumidor: z.string().min(1, 'Pontos para consumidor é obrigatório'),
  pontosProfissional: z.string().min(1, 'Pontos para profissional é obrigatório'),
});

const segmentos = [
  { value: 'materiais_construcao', label: 'Materiais de Construção' },
  { value: 'material_eletrico', label: 'Material Elétrico' },
  { value: 'vidracaria', label: 'Vidraçaria' },
  { value: 'marmoraria', label: 'Marmoraria' },
  { value: 'aluguel_equipamentos', label: 'Aluguel de Equipamentos' },
];

const categorias = {
  materiais_construcao: [
    { value: 'cimento', label: 'Cimento' },
    { value: 'argamassa', label: 'Argamassa' },
    { value: 'tijolos', label: 'Tijolos e Blocos' },
    { value: 'telhas', label: 'Telhas' },
  ],
  material_eletrico: [
    { value: 'cabos', label: 'Cabos e Fios' },
    { value: 'disjuntores', label: 'Disjuntores' },
    { value: 'lampadas', label: 'Lâmpadas' },
    { value: 'tomadas', label: 'Tomadas e Interruptores' },
  ],
  vidracaria: [
    { value: 'vidros_planos', label: 'Vidros Planos' },
    { value: 'box', label: 'Box para Banheiro' },
    { value: 'espelhos', label: 'Espelhos' },
  ],
  marmoraria: [
    { value: 'granito', label: 'Granito' },
    { value: 'marmore', label: 'Mármore' },
    { value: 'quartzos', label: 'Quartzos' },
  ],
  aluguel_equipamentos: [
    { value: 'betoneiras', label: 'Betoneiras' },
    { value: 'andaimes', label: 'Andaimes' },
    { value: 'compressores', label: 'Compressores' },
  ],
};

const unidadesVenda = [
  { value: 'unidade', label: 'Unidade' },
  { value: 'metro', label: 'Metro' },
  { value: 'metro_quadrado', label: 'Metro Quadrado' },
  { value: 'metro_cubico', label: 'Metro Cúbico' },
  { value: 'caixa', label: 'Caixa' },
  { value: 'pacote', label: 'Pacote' },
  { value: 'kg', label: 'Quilograma' },
  { value: 'litro', label: 'Litro' },
  { value: 'galao', label: 'Galão' },
];

const ProductFormScreen: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  
  const [images, setImages] = useState<string[]>([]);
  const [selectedSegmento, setSelectedSegmento] = useState('');
  const [availableCategorias, setAvailableCategorias] = useState<{value: string, label: string}[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: isEditing && id ? 
      {
        nome: produtos.find(p => p.id === id)?.nome || '',
        descricao: produtos.find(p => p.id === id)?.descricao || '',
        segmento: '',
        categoria: produtos.find(p => p.id === id)?.categoria || '',
        codigoBarras: '',
        sku: '',
        preco: produtos.find(p => p.id === id)?.preco.toString() || '',
        precoPromocional: '',
        estoque: produtos.find(p => p.id === id)?.estoque.toString() || '',
        unidadeVenda: '',
        m2PorCaixa: '',
        pontosConsumidor: produtos.find(p => p.id === id)?.pontos.toString() || '',
        pontosProfissional: '',
      } : {
        nome: '',
        descricao: '',
        segmento: '',
        categoria: '',
        codigoBarras: '',
        sku: '',
        preco: '',
        precoPromocional: '',
        estoque: '',
        unidadeVenda: '',
        m2PorCaixa: '',
        pontosConsumidor: '',
        pontosProfissional: '',
      }
  });

  React.useEffect(() => {
    if (isEditing && id) {
      const produto = produtos.find(p => p.id === id);
      if (produto) {
        // Add product image to state
        setImages([produto.imagemUrl]);
      }
    }
  }, [id, isEditing]);

  const handleSegmentoChange = (value: string) => {
    setSelectedSegmento(value);
    form.setValue('segmento', value);
    setAvailableCategorias(categorias[value as keyof typeof categorias] || []);
    form.setValue('categoria', '');
  };
  
  const addImage = () => {
    // Mock adding image - in a real app, this would open a file selector
    const mockImageUrl = "https://images.unsplash.com/photo-1618160472022-18a881fd7e13?auto=format&fit=crop&w=200&h=200&q=80";
    setImages(prev => [...prev, mockImageUrl]);
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (images.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos uma imagem do produto",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      
      if (isEditing) {
        toast({
          title: "Produto atualizado",
          description: "O produto foi atualizado e está pendente de aprovação",
        });
      } else {
        toast({
          title: "Produto criado",
          description: "O produto foi criado e está pendente de aprovação",
        });
      }
      
      navigate('/vendor/products');
    }, 1500);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 pb-20">
      {/* Header */}
      <div className="bg-construPro-blue p-6 pt-12 flex items-center">
        <button onClick={() => navigate('/vendor/products')} className="mr-4 text-white">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold text-white">
          {isEditing ? 'Editar Produto' : 'Novo Produto'}
        </h1>
      </div>
      
      <div className="p-6">
        <Tabs defaultValue="basic">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="basic">Básico</TabsTrigger>
            <TabsTrigger value="details">Detalhes</TabsTrigger>
            <TabsTrigger value="images">Imagens</TabsTrigger>
          </TabsList>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <TabsContent value="basic" className="space-y-4">
                <Card className="p-4">
                  <FormField
                    control={form.control}
                    name="nome"
                    render={({ field }) => (
                      <FormItem className="mb-4">
                        <FormLabel>Nome do produto*</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Cimento CP-II 50kg" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="descricao"
                    render={({ field }) => (
                      <FormItem className="mb-4">
                        <FormLabel>Descrição*</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Descreva detalhes do produto"
                            className="min-h-[120px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="segmento"
                    render={({ field }) => (
                      <FormItem className="mb-4">
                        <FormLabel>Segmento*</FormLabel>
                        <Select
                          onValueChange={handleSegmentoChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o segmento" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {segmentos.map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
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
                        <FormLabel>Categoria*</FormLabel>
                        <Select
                          disabled={!selectedSegmento}
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={selectedSegmento ? "Selecione a categoria" : "Selecione um segmento primeiro"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {availableCategorias.map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </Card>
              </TabsContent>
              
              <TabsContent value="details" className="space-y-4">
                <Card className="p-4">
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <FormField
                      control={form.control}
                      name="codigoBarras"
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
                            <Input placeholder="Ex: CIM-CP2-50" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <FormField
                      control={form.control}
                      name="preco"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preço Normal*</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: 29.90" {...field} />
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
                          <FormLabel>Preço Promocional</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: 24.90" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <FormField
                      control={form.control}
                      name="estoque"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estoque*</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: 50" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="unidadeVenda"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unidade de Venda*</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {unidadesVenda.map(option => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="mb-4">
                    <FormField
                      control={form.control}
                      name="m2PorCaixa"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>m² por caixa (se aplicável)</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: 2.5" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="pontosConsumidor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pontos Consumidor*</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: 50" {...field} />
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
                          <FormLabel>Pontos Profissional*</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: 75" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </Card>
              </TabsContent>
              
              <TabsContent value="images" className="space-y-4">
                <Card className="p-4">
                  <Label className="mb-4 block">Imagens do produto</Label>
                  
                  {images.length > 0 && (
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      {images.map((image, i) => (
                        <div key={i} className="relative rounded-lg overflow-hidden h-40 bg-gray-200">
                          <img src={image} alt={`Imagem ${i+1}`} className="w-full h-full object-cover" />
                          <button 
                            type="button" 
                            onClick={() => removeImage(i)}
                            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                          >
                            <Trash size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <CustomButton
                    type="button"
                    variant="outline"
                    icon={images.length === 0 ? <Camera size={18} /> : <Plus size={18} />}
                    onClick={addImage}
                    fullWidth
                  >
                    {images.length === 0 ? 'Adicionar imagens' : 'Adicionar mais imagens'}
                  </CustomButton>
                  
                  <p className="text-xs text-gray-500 mt-2">
                    Formatos aceitos: JPG, PNG. Tamanho máximo: 5MB por imagem.
                  </p>
                </Card>
              </TabsContent>
              
              <CustomButton
                type="submit"
                variant="primary"
                fullWidth
                loading={isSubmitting}
              >
                {isEditing ? 'Atualizar Produto' : 'Cadastrar Produto'}
              </CustomButton>
            </form>
          </Form>
        </Tabs>
      </div>
    </div>
  );
};

export default ProductFormScreen;
