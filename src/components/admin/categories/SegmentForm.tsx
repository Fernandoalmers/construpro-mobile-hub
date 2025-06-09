
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
import { Upload, X, AlertCircle } from 'lucide-react';
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
  const [imageError, setImageError] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      nome: initialData?.nome || '',
      status: initialData?.status || 'ativo',
      image_url: initialData?.image_url || null
    }
  });

  const handleSubmit = form.handleSubmit(async (data) => {
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
      
      // Reset previous errors
      setImageError(null);
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        const errorMsg = `Tipo de arquivo não suportado. Use apenas: ${allowedTypes.join(', ')}`;
        console.error(`[SegmentForm] Invalid file type: ${file.type}`);
        setImageError(errorMsg);
        toast.error(errorMsg);
        return;
      }
      
      // Size validation (10MB max - matching storage bucket limit)
      if (file.size > 10 * 1024 * 1024) {
        const errorMsg = 'A imagem deve ter no máximo 10MB';
        console.error(`[SegmentForm] File too large: ${file.size} bytes`);
        setImageError(errorMsg);
        toast.error(errorMsg);
        return;
      }
      
      setImageFile(file);
      setImageLoading(true);
      
      try {
        console.log('[SegmentForm] Starting image upload...');
        
        // Upload image immediately for better UX
        const uploadedUrl = await uploadSegmentImage(file);
        
        if (uploadedUrl) {
          console.log('[SegmentForm] Image uploaded successfully:', uploadedUrl);
          setUploadedImageUrl(uploadedUrl);
          setPreviewImage(uploadedUrl);
          form.setValue('image_url', uploadedUrl);
          toast.success('Imagem carregada com sucesso!');
        } else {
          throw new Error('Upload failed - no URL returned');
        }
      } catch (error) {
        console.error('[SegmentForm] Error uploading image:', error);
        
        // More specific error handling
        let errorMessage = 'Erro ao carregar imagem';
        if (error instanceof Error) {
          if (error.message.includes('bucket')) {
            errorMessage = 'Erro de configuração do storage. Contate o suporte.';
          } else if (error.message.includes('size')) {
            errorMessage = 'Arquivo muito grande. Máximo 10MB.';
          } else if (error.message.includes('type')) {
            errorMessage = 'Tipo de arquivo não suportado.';
          } else {
            errorMessage = `Erro ao carregar imagem: ${error.message}`;
          }
        }
        
        setImageError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setImageLoading(false);
      }
    }
  };

  const handleImageLoad = () => {
    console.log('[SegmentForm] Image loaded successfully');
    setImageError(null);
  };

  const handleImageError = () => {
    console.error('[SegmentForm] Error loading image preview');
    setImageError('Erro ao carregar preview da imagem');
  };

  const removeImage = async () => {
    try {
      // If there's an uploaded image, try to delete it
      if (uploadedImageUrl) {
        console.log('[SegmentForm] Deleting uploaded image:', uploadedImageUrl);
        const deleted = await deleteSegmentImage(uploadedImageUrl);
        if (deleted) {
          toast.success('Imagem removida com sucesso!');
        } else {
          console.warn('[SegmentForm] Failed to delete image from storage');
        }
      }
    } catch (error) {
      console.error('[SegmentForm] Error deleting image:', error);
      // Don't show error to user for deletion failures, just log them
    }
    
    // Reset all image-related state
    setImageFile(null);
    setPreviewImage(null);
    setImageError(null);
    setUploadedImageUrl(null);
    form.setValue('image_url', null);
    console.log('[SegmentForm] Image removed from form');
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
                <span className="ml-2 text-sm text-gray-600">Carregando...</span>
              </div>
            )}
            
            {imageError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-700">{imageError}</span>
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
                  disabled={imageLoading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : !imageLoading ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center">
                <Image className="h-10 w-10 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">Carregar imagem para o segmento</p>
                <p className="text-xs text-gray-400">
                  Formatos aceitos: JPEG, PNG, WebP, GIF | Máximo: 10MB
                </p>
                <div className="mt-4">
                  <input
                    id="segment-image"
                    name="segment-image"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="sr-only"
                    onChange={handleImageChange}
                    disabled={imageLoading}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="flex items-center gap-2"
                    disabled={imageLoading}
                    onClick={() => document.getElementById('segment-image')?.click()}
                  >
                    <Upload className="h-4 w-4" />
                    {imageLoading ? 'Carregando...' : 'Selecionar arquivo'}
                  </Button>
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
