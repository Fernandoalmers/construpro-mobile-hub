
import React from 'react';
import { ArrowLeft, Save, Image as ImageIcon, Info, Tag, Layers } from 'lucide-react';
import { useProdutoForm } from './hooks/useProdutoForm';
import { validateBarcode, availableVariantTypes, getVariantOptions } from './utils/productValidation';
import CustomButton from '../common/CustomButton';
import GeneralInformationSection from './form-sections/GeneralInformationSection';
import ProductIdentificationSection from './form-sections/ProductIdentificationSection';
import UnitPackagingSection from './form-sections/UnitPackagingSection';
import PriceStockSection from './form-sections/PriceStockSection';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ProdutoFormScreenProps {
  isEditing?: boolean;
  productId?: string;
  initialData?: any;
}

const ProdutoFormScreen: React.FC<ProdutoFormScreenProps> = ({ 
  isEditing = false,
  productId,
  initialData
}) => {
  const {
    form,
    isSubmitting,
    selectedTags,
    setSelectedTags,
    images,
    setImages,
    isLoading,
    setSegmentId,
    onSubmit,
    navigate
  } = useProdutoForm({ isEditing, productId, initialData });

  // Watch form values for variants
  const watchTemVariantes = form.watch('temVariantes');
  const watchTipoVariante = form.watch('tipoVariante');

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

  // Form submission with validation
  const handleSubmit = (values: any) => {
    // Validate barcode if provided
    if (values.codigo_barras && !validateBarcode(values.codigo_barras)) {
      return;
    }
    onSubmit(values);
  };

  // Get variant options based on selected type
  const getVariantOptionsForType = () => {
    return getVariantOptions(watchTipoVariante || '');
  };

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
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <Accordion type="single" collapsible defaultValue="item-1">
              <GeneralInformationSection
                form={form}
                selectedTags={selectedTags}
                onTagToggle={handleTagToggle}
                onSegmentIdChange={handleSegmentIdChange}
              />
              
              <ProductIdentificationSection form={form} />
              
              <UnitPackagingSection form={form} />
              
              <PriceStockSection form={form} />
              
              {/* Images Section */}
              <AccordionItem value="item-5">
                <AccordionTrigger className="bg-white px-4 py-3 rounded-t-md shadow-sm border border-gray-200">
                  <div className="flex items-center space-x-2">
                    <ImageIcon size={20} className="text-construPro-blue" />
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
              
              {/* Points Section */}
              <AccordionItem value="item-6">
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
              
              {/* Variants Section */}
              <AccordionItem value="item-7">
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
                              {getVariantOptionsForType().map((option) => (
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
                onClick={() => navigate('/vendor/products')}
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
