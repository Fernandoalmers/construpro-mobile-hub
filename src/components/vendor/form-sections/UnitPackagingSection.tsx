
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Package } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { isConversionRequired, getConversionFieldLabel } from '../utils/productValidation';
import { ProductFormValues } from '../hooks/useProdutoForm';
import {
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
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface UnitPackagingSectionProps {
  form: UseFormReturn<ProductFormValues>;
}

const UnitPackagingSection: React.FC<UnitPackagingSectionProps> = ({ form }) => {
  const watchUnidadeVenda = form.watch('unidadeVenda');

  return (
    <AccordionItem value="item-3">
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
                    form.setValue('valorConversao', null);
                    
                     if (['m2', 'barra', 'rolo'].includes(value)) {
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
                    <SelectItem value="barra">Barra</SelectItem>
                    <SelectItem value="saco">Saco</SelectItem>
                    <SelectItem value="rolo">Rolo</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {isConversionRequired(watchUnidadeVenda) && (
            <FormField
              control={form.control}
              name="valorConversao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{getConversionFieldLabel(watchUnidadeVenda)}*</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step={['m2', 'barra', 'rolo'].includes(watchUnidadeVenda) ? 0.01 : 0.1}
                      min={0.01}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      value={field.value !== null ? field.value : ''}
                      placeholder={
                        watchUnidadeVenda === 'm2' ? "Ex: 2.5" :
                        watchUnidadeVenda === 'barra' ? "Ex: 3.0" :
                        watchUnidadeVenda === 'rolo' ? "Ex: 50.0" :
                        "Ex: 5"
                      }
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
                  disabled={['m2', 'barra', 'rolo'].includes(watchUnidadeVenda)}
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
                {['m2', 'barra', 'rolo'].includes(watchUnidadeVenda) && (
                  <p className="text-xs text-amber-600 mt-1">
                    {watchUnidadeVenda === 'm2' && 'Produtos vendidos em m² exigem controle por múltiplos da embalagem.'}
                    {watchUnidadeVenda === 'barra' && 'Barras podem ser vendidas em frações (ex: 0.5 para meia barra).'}
                    {watchUnidadeVenda === 'rolo' && 'Rolos podem ser vendidos por metragem fracionada.'}
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

export default UnitPackagingSection;
