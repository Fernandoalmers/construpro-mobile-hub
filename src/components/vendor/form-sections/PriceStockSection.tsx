
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Tag } from 'lucide-react';
import { Input } from '@/components/ui/input';
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

interface PriceStockSectionProps {
  form: UseFormReturn<ProductFormValues>;
}

const PriceStockSection: React.FC<PriceStockSectionProps> = ({ form }) => {
  const watchUnidadeVenda = form.watch('unidadeVenda');

  return (
    <AccordionItem value="item-4">
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
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

export default PriceStockSection;
