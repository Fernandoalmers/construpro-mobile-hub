
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Zap, Calendar, Info } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
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

interface PromotionSectionProps {
  form: UseFormReturn<ProductFormValues>;
}

const PromotionSection: React.FC<PromotionSectionProps> = ({ form }) => {
  const watchPromocaoAtiva = form.watch('promocaoAtiva');
  const watchPrecoPromocional = form.watch('precoPromocional');
  const watchPreco = form.watch('preco');

  // Calculate discount percentage for preview
  const discountPercentage = watchPrecoPromocional && watchPreco && watchPrecoPromocional < watchPreco
    ? Math.round(((watchPreco - watchPrecoPromocional) / watchPreco) * 100)
    : 0;

  return (
    <AccordionItem value="item-promotion">
      <AccordionTrigger className="bg-white px-4 py-3 rounded-t-md shadow-sm border border-gray-200">
        <div className="flex items-center space-x-2">
          <Zap size={20} className="text-orange-500" />
          <span className="font-medium">Promoção com Temporizador</span>
          {watchPromocaoAtiva && (
            <div className="ml-2 bg-orange-500 text-white px-2 py-1 rounded-full text-xs">
              Ativa
            </div>
          )}
        </div>
      </AccordionTrigger>
      <AccordionContent className="bg-white p-4 border-x border-b border-gray-200 rounded-b-md shadow-sm">
        <div className="space-y-4">
          <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
            <div className="flex items-start gap-2">
              <Info size={16} className="text-orange-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-orange-800">
                <p className="font-medium mb-1">Como funciona o temporizador de ofertas:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Configure um preço promocional menor que o preço normal</li>
                  <li>• Defina o período da promoção (início e fim)</li>
                  <li>• O countdown será exibido automaticamente no marketplace</li>
                  <li>• A promoção será desativada automaticamente quando expirar</li>
                </ul>
              </div>
            </div>
          </div>

          <FormField
            control={form.control}
            name="promocaoAtiva"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel className="font-medium">
                  Ativar promoção com temporizador
                </FormLabel>
              </FormItem>
            )}
          />

          {watchPromocaoAtiva && (
            <div className="space-y-4 pt-2 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="precoPromocional"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preço promocional*</FormLabel>
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
                      {discountPercentage > 0 && (
                        <p className="text-xs text-green-600 font-medium">
                          Desconto de {discountPercentage}% aplicado
                        </p>
                      )}
                    </FormItem>
                  )}
                />

                {discountPercentage > 0 && (
                  <div className="flex items-center justify-center">
                    <div className="bg-red-500 text-white px-3 py-2 rounded-lg text-center">
                      <div className="text-lg font-bold">-{discountPercentage}%</div>
                      <div className="text-xs">Preview da badge</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="promocaoInicio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1">
                        <Calendar size={14} />
                        Início da promoção*
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="datetime-local"
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="promocaoFim"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1">
                        <Calendar size={14} />
                        Fim da promoção*
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="datetime-local"
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {watchPromocaoAtiva && watchPrecoPromocional && (
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-2">Preview da Oferta:</h4>
                  <div className="flex items-center gap-3">
                    <div className="text-sm">
                      <span className="line-through text-gray-500">R$ {watchPreco?.toFixed(2)}</span>
                      <span className="ml-2 text-lg font-bold text-blue-600">
                        R$ {watchPrecoPromocional?.toFixed(2)}
                      </span>
                    </div>
                    {discountPercentage > 0 && (
                      <div className="bg-red-500 text-white px-2 py-1 rounded text-xs font-semibold">
                        -{discountPercentage}%
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

export default PromotionSection;
