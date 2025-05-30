
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Barcode } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { validateBarcode, formatBarcode } from '../utils/productValidation';
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

interface ProductIdentificationSectionProps {
  form: UseFormReturn<ProductFormValues>;
}

const ProductIdentificationSection: React.FC<ProductIdentificationSectionProps> = ({ form }) => {
  const watchCodigoBarras = form.watch('codigo_barras');

  return (
    <AccordionItem value="item-2">
      <AccordionTrigger className="bg-white px-4 py-3 rounded-t-md shadow-sm border border-gray-200">
        <div className="flex items-center space-x-2">
          <Barcode size={20} className="text-construPro-blue" />
          <span className="font-medium">Identificação do Produto</span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="bg-white p-4 border-x border-b border-gray-200 rounded-b-md shadow-sm">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="sku"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SKU (Código do Produto)</FormLabel>
                  <FormControl>
                    <Input 
                      {...field}
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      placeholder="Ex: PROD-001, ABC123"
                      maxLength={50}
                    />
                  </FormControl>
                  <p className="text-xs text-gray-500 mt-1">
                    Código único para identificação interna do produto
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="codigo_barras"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código de Barras</FormLabel>
                  <FormControl>
                    <Input 
                      {...field}
                      onChange={(e) => field.onChange(formatBarcode(e.target.value))}
                      placeholder="Ex: 1234567890123"
                      maxLength={14}
                    />
                  </FormControl>
                  <p className="text-xs text-gray-500 mt-1">
                    Código de barras EAN-8, EAN-13, UPC-12 ou EAN-14
                  </p>
                  {watchCodigoBarras && !validateBarcode(watchCodigoBarras) && (
                    <p className="text-xs text-red-500 mt-1">
                      Formato inválido. Use 8, 12, 13 ou 14 dígitos
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

export default ProductIdentificationSection;
