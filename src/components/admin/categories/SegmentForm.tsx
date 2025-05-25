
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
import { uploadSegmentImage, deleteSegmentImage } from '@/services/admin/productSegmentsService';
import { toast } from '@/components/ui/sonner';

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
  const [imageLoading, setImageLoading] = useState<boolean>(false);
  const [imageError, setImageError] = useState<boolean>(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      nome: initialData?.nome || '',
      status: initialData?.status || 'ativo',
      image_url: initialData?.image_url || null
    }
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    // Ensure status is always defined
    const formData = {
      ...data,
      status: data.status || 'ativo',
      image_url: uploadedImageUrl || previewImage || data.image_url
    };
    
    console.log('[SegmentForm] Submitting form with data:', formData);
    onSubmit(formData);
  });

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (file) {
      console.log(`[SegmentForm] Selected file: ${file.name}, type: ${file.type}, size: ${file.size}`);
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        console.error(`[SegmentForm] Invalid file type: ${file.type}`);
        setImageError(true);
        toast.error('Por favor, selecione apenas arquivos de imagem');
        return;
      }
      
      // Size validation (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        console.error(`[SegmentForm] File too large: ${file.size} bytes`);
        setImageError(true);
        toast.error('A imagem deve ter no máximo 5MB');
        return;
      }
      
      setImageError(false);
      setImageFile(file);
      setImageLoading(true);
      
      try {
        // Upload image immediately
        const uploadedUrl = await uploadSegmentImage(file);
        
        if (uploadedUrl) {
          setUploadedImageUrl(uploadedUrl);
          setPreviewImage(uploadedUrl);
          form.setValue('image_url', uploadedUrl);
          toast.success('Imagem carregada com sucesso!');
        } else {
          setImageError(true);
          toast.error('Erro ao carregar imagem');
        }
      } catch (error) {
        console.error('[SegmentForm] Error uploading image:', error);
        setImageError(true);
        toast.error('Erro ao carregar imagem');
      } finally {
        setImageLoading(false);
      }
    }
  };

  const handleImageLoad = () => {
    console.log('[SegmentForm] Image loaded successfully');
  };

  const handleImageError = () => {
    console.error('[SegmentForm] Error loading image');
    setImageError(true);
  };

  const removeImage = async () => {
    // If there's an uploaded image, try to delete it
    if (uploadedImageUrl) {
      const deleted = await deleteSegmentImage(uploadedImageUrl);
      if (deleted) {
        toast.success('Imagem removida com sucesso!');
      }
    }
    
    setImageFile(null);
    setPreviewImage(null);
    setImageError(false);
    setUploadedImageUrl(null);
    form.setValue('image_url', null);
    console.log('[SegmentForm] Image removed');
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
            {imageLoading && (
              <div className="w-full max-w-[200px] h-[120px] flex items-center justify-center bg-gray-100 rounded-lg">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-construPro-blue"></div>
              </div>
            )}
            
            {previewImage && !imageLoading ? (
              <div className="relative w-full max-w-[200px] h-[120px] overflow-hidden rounded-lg border">
                <img 
                  src={previewImage} 
                  alt="Preview da imagem do segmento" 
                  className="w-full h-full object-cover"
                  onLoad={handleImageLoad}
                  onError={handleImageError}
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
            ) : !imageLoading ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center">
                <Image className="h-10 w-10 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">Carregar imagem para o segmento</p>
                <p className="text-xs text-gray-400">Recomendado: 800x600px, máximo 5MB</p>
                {imageError && (
                  <p className="text-xs text-red-500 mt-1">
                    Erro ao carregar imagem. Verifique o formato e tamanho.
                  </p>
                )}
                <div className="mt-4">
                  <label htmlFor="segment-image" className="cursor-pointer">
                    <input
                      id="segment-image"
                      name="segment-image"
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={handleImageChange}
                      disabled={imageLoading}
                    />
                    <CustomButton
                      type="button"
                      variant="outline"
                      icon={<Upload className="h-4 w-4" />}
                      disabled={imageLoading}
                    >
                      {imageLoading ? 'Carregando...' : 'Selecionar arquivo'}
                    </CustomButton>
                  </label>
                </div>
              </div>
            ) : null}
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
            disabled={isLoading || imageLoading}
          >
            {initialData?.id ? 'Atualizar Segmento' : 'Criar Segmento'}
          </CustomButton>
        </div>
      </form>
    </Form>
  );
};

export default SegmentForm;
