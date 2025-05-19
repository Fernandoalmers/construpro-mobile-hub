import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { 
  Form, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormControl, 
  FormMessage 
} from '@/components/ui/form';
import { AdminSegment } from '@/types/admin';
import CustomInput from '@/components/common/CustomInput';
import CustomSelect from '@/components/common/CustomSelect';
import CustomButton from '@/components/common/CustomButton';
import { getProductSegments, ProductSegment } from '@/services/admin/productSegmentsService';

interface CategoryFormProps {
  initialData?: {
    id?: string;
    nome: string;
    segment_id?: string;
    status?: string;
  };
  onSubmit: (data: {
    nome: string;
    segment_id?: string;
    status: string;
  }) => void;
  isLoading: boolean;
}

const CategoryForm: React.FC<CategoryFormProps> = ({ 
  initialData, 
  onSubmit, 
  isLoading 
}) => {
  const [segments, setSegments] = useState<ProductSegment[]>([]);
  const [isLoadingSegments, setIsLoadingSegments] = useState<boolean>(false);

  const form = useForm({
    defaultValues: {
      nome: initialData?.nome || '',
      segment_id: initialData?.segment_id || '',
      status: initialData?.status || 'ativo'
    }
  });

  useEffect(() => {
    const loadSegments = async () => {
      setIsLoadingSegments(true);
      try {
        const segmentsData = await getProductSegments();
        setSegments(segmentsData);
      } catch (error) {
        console.error('Error loading segments:', error);
      } finally {
        setIsLoadingSegments(false);
      }
    };

    loadSegments();
  }, []);

  const handleSubmit = form.handleSubmit((data) => {
    // Ensure status is always defined
    const formData = {
      ...data,
      status: data.status || 'ativo'
    };
    onSubmit(formData);
  });

  const segmentOptions = segments.map(segment => ({
    value: segment.id,
    label: segment.nome
  }));

  // Add an empty option for no segment
  segmentOptions.unshift({ value: '', label: 'Nenhum segmento' });

  const statusOptions = [
    { value: 'ativo', label: 'Ativo' },
    { value: 'inativo', label: 'Inativo' }
  ];

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField
          control={form.control}
          name="nome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da Categoria</FormLabel>
              <FormControl>
                <CustomInput 
                  placeholder="Digite o nome da categoria" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="segment_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Segmento</FormLabel>
              <FormControl>
                <CustomSelect 
                  options={segmentOptions} 
                  value={field.value} 
                  onChange={field.onChange}
                  disabled={isLoadingSegments}
                  placeholder="Selecione um segmento"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <FormControl>
                <CustomSelect 
                  options={statusOptions} 
                  value={field.value} 
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end pt-4">
          <CustomButton 
            type="submit" 
            variant="primary" 
            loading={isLoading}
            disabled={isLoading}
          >
            {initialData?.id ? 'Atualizar Categoria' : 'Criar Categoria'}
          </CustomButton>
        </div>
      </form>
    </Form>
  );
};

export default CategoryForm;
