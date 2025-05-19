
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { 
  Form, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormControl, 
  FormMessage 
} from '@/components/ui/form';
import CustomInput from '@/components/common/CustomInput';
import CustomSelect from '@/components/common/CustomSelect';
import CustomButton from '@/components/common/CustomButton';
import { Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Image } from 'lucide-react';

interface SegmentFormProps {
  initialData?: {
    id?: string;
    nome: string;
    status?: string;
    image_url?: string | null;
  };
  onSubmit: (data: {
    nome: string;
    status: string;
    image_url?: string | null;
  }, imageFile?: File) => void;
  isLoading: boolean;
}

const SegmentForm: React.FC<SegmentFormProps> = ({ 
  initialData, 
  onSubmit, 
  isLoading 
}) => {
  const [previewImage, setPreviewImage] = useState<string | null>(initialData?.image_url || null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const form = useForm({
    defaultValues: {
      nome: initialData?.nome || '',
      status: initialData?.status || 'ativo',
      image_url: initialData?.image_url || null
    }
  });

  const handleSubmit = form.handleSubmit((data) => {
    // Ensure status is always defined
    const formData = {
      ...data,
      status: data.status || 'ativo'
    };
    onSubmit(formData, imageFile || undefined);
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (file) {
      setImageFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setPreviewImage(null);
    form.setValue('image_url', null);
  };

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
              <FormLabel>Nome do Segmento</FormLabel>
              <FormControl>
                <CustomInput 
                  placeholder="Digite o nome do segmento" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormItem>
          <FormLabel>Imagem do Segmento</FormLabel>
          <div className="mt-1 flex flex-col gap-4">
            {previewImage ? (
              <div className="relative w-full max-w-[200px] h-[120px] overflow-hidden rounded-lg border">
                <img 
                  src={previewImage} 
                  alt="Preview da imagem do segmento" 
                  className="w-full h-full object-cover"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-1 right-1 rounded-full w-6 h-6 p-0"
                  onClick={removeImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center">
                <Image className="h-10 w-10 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">Carregar imagem para o segmento</p>
                <p className="text-xs text-gray-400">Recomendado: 800x600px</p>
                <div className="mt-4">
                  <label htmlFor="segment-image" className="cursor-pointer">
                    <input
                      id="segment-image"
                      name="segment-image"
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={handleImageChange}
                    />
                    <CustomButton
                      type="button"
                      variant="outline"
                      icon={<Upload className="h-4 w-4" />}
                    >
                      Selecionar arquivo
                    </CustomButton>
                  </label>
                </div>
              </div>
            )}
          </div>
        </FormItem>

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <FormControl>
                <CustomSelect 
                  options={statusOptions} 
                  value={field.value || 'ativo'} 
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
            {initialData?.id ? 'Atualizar Segmento' : 'Criar Segmento'}
          </CustomButton>
        </div>
      </form>
    </Form>
  );
};

export default SegmentForm;
