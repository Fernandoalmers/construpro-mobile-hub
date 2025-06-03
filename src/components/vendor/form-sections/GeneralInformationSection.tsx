
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FileSymlink } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import ProductSegmentSelect from '../ProductSegmentSelect';
import ProductCategorySelect from '../ProductCategorySelect';
import { tagOptions } from '../utils/productValidation';
import { ProductFormValues } from '../hooks/useProdutoForm';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface GeneralInformationSectionProps {
  form: UseFormReturn<ProductFormValues>;
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
  onSegmentIdChange: (id: string) => void;
}

const GeneralInformationSection: React.FC<GeneralInformationSectionProps> = ({
  form,
  selectedTags,
  onTagToggle,
  onSegmentIdChange
}) => {
  // Watch segment ID to filter categories
  const watchSegmentId = form.watch('segmento_id');

  return (
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
                      onSegmentIdChange={onSegmentIdChange}
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
                  <FormControl>
                    <ProductCategorySelect
                      value={field.value || ''}
                      onChange={field.onChange}
                      error={form.formState.errors.categoria?.message}
                      required={true}
                      segmentId={watchSegmentId}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
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
                  onClick={() => onTagToggle(tag.value)}
                >
                  {tag.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

export default GeneralInformationSection;
