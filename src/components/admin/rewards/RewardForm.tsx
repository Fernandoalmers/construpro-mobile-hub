
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
import { AdminReward } from '@/types/admin';
import CustomInput from '@/components/common/CustomInput';
import CustomButton from '@/components/common/CustomButton';
import CustomSelect from '@/components/common/CustomSelect';
import { createReward, fetchRewardCategories, updateReward } from '@/services/adminRewardsService';
import { toast } from '@/components/ui/sonner';
import { Upload, Image, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

interface RewardFormProps {
  initialData?: Partial<AdminReward>;
  onSuccess: () => void;
  onCancel: () => void;
}

const DEFAULT_IMAGE_URL = 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&h=500&q=80';

const RewardForm: React.FC<RewardFormProps> = ({
  initialData,
  onSuccess,
  onCancel
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [imagePreview, setImagePreview] = useState<string | null>(initialData?.imagem_url || null);
  const [categories, setCategories] = useState<string[]>(['Resgate', 'Vale Presente', 'Produto', 'Serviço', 'Outro']);
  const [adminStatus, setAdminStatus] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  
  const form = useForm({
    defaultValues: {
      nome: initialData?.nome || '',
      descricao: initialData?.descricao || '',
      pontos: initialData?.pontos || 0,
      categoria: initialData?.categoria || 'Resgate',
      imagem_url: initialData?.imagem_url || '',
      estoque: initialData?.estoque || null,
      prazo_entrega: initialData?.prazo_entrega || '7-10 dias úteis',
      status: initialData?.status || 'ativo' // Default to active
    },
    mode: 'onChange',
  });

  // Check admin status on component mount
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const { data, error } = await supabase.rpc('is_admin');
        if (error) {
          console.error("Error checking admin status:", error);
          return;
        }
        setAdminStatus(!!data);
        console.log("Admin status:", data);
        
        if (!data) {
          setFormError('Você precisa ser um administrador para gerenciar recompensas.');
        }
      } catch (err) {
        console.error("Error checking admin status:", err);
        setFormError('Erro ao verificar permissões de administrador.');
      }
    };
    
    checkAdminStatus();
  }, []);
  
  // Carregar categorias disponíveis
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categoriesData = await fetchRewardCategories();
        if (categoriesData.length > 0) {
          setCategories(categoriesData);
        }
      } catch (error) {
        console.error('Erro ao carregar categorias:', error);
      }
    };
    
    loadCategories();
  }, []);

  const validateForm = () => {
    const values = form.getValues();
    
    if (!values.nome) {
      setFormError('O nome da recompensa é obrigatório.');
      return false;
    }
    
    if (!values.pontos || values.pontos <= 0) {
      setFormError('O valor de pontos deve ser maior que zero.');
      return false;
    }

    setFormError(null);
    return true;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Verifica tamanho (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Imagem muito grande. Máximo de 5MB permitido.");
        return;
      }

      // Verifica tipo
      if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
        toast.error("Formato de imagem não suportado. Use JPG, PNG, WEBP ou GIF.");
        return;
      }

      // Temporariamente mostrar preview da imagem selecionada
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
        form.setValue('imagem_url', result);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: any) => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Ensure image URL is set, even if blank in form
      if (!data.imagem_url) {
        data.imagem_url = DEFAULT_IMAGE_URL;
      }
      
      console.log("Form submission data:", data); // Debug log
      
      // Check admin status before proceeding
      if (!adminStatus) {
        toast.error('Permissão negada: apenas administradores podem gerenciar recompensas');
        setIsLoading(false);
        return;
      }
      
      // Se estamos criando uma nova recompensa
      if (!initialData?.id) {
        const result = await createReward({
          nome: data.nome,
          descricao: data.descricao,
          pontos: data.pontos,
          categoria: data.categoria,
          imagem_url: data.imagem_url,
          estoque: data.estoque,
          prazo_entrega: data.prazo_entrega,
          status: data.status || 'ativo' // Default to active if not specified
        });
        
        if (result) {
          console.log("Created reward:", result); // Debug log
          toast.success('Recompensa criada com sucesso!');
          onSuccess();
        } else {
          setFormError('Erro ao criar recompensa. Verifique os dados e tente novamente.');
        }
      } else {
        // Lógica para atualizar uma recompensa existente
        const result = await updateReward(initialData.id, {
          nome: data.nome,
          descricao: data.descricao,
          pontos: data.pontos,
          categoria: data.categoria,
          imagem_url: data.imagem_url,
          estoque: data.estoque,
          prazo_entrega: data.prazo_entrega,
          status: data.status
        });
        
        if (result) {
          console.log("Updated reward:", result); // Debug log
          toast.success('Recompensa atualizada com sucesso!');
          onSuccess();
        } else {
          setFormError('Erro ao atualizar recompensa. Verifique os dados e tente novamente.');
        }
      }
    } catch (error) {
      console.error('Erro ao salvar recompensa:', error);
      setFormError('Erro inesperado. Tente novamente mais tarde.');
      toast.error('Erro ao salvar recompensa');
    } finally {
      setIsLoading(false);
    }
  };

  const categoryOptions = categories.map(cat => ({
    label: cat,
    value: cat
  }));

  const statusOptions = [
    { label: 'Ativo', value: 'ativo' },
    { label: 'Pendente', value: 'pendente' },
    { label: 'Inativo', value: 'inativo' }
  ];
  
  if (formError) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Erro</AlertTitle>
        <AlertDescription>{formError}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {formError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}

        <FormField
          control={form.control}
          name="nome"
          rules={{ required: "Nome da recompensa é obrigatório" }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da Recompensa *</FormLabel>
              <FormControl>
                <CustomInput 
                  placeholder="Digite o nome da recompensa" 
                  {...field} 
                />
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
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Descreva a recompensa" 
                  className="resize-none min-h-[100px]"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="pontos"
            rules={{ 
              required: "Pontos são obrigatórios",
              min: { value: 1, message: "Deve ser maior que zero" }
            }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pontos Necessários *</FormLabel>
                <FormControl>
                  <CustomInput 
                    type="number"
                    placeholder="Quantidade de pontos" 
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
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
                <FormLabel>Estoque Disponível</FormLabel>
                <FormControl>
                  <CustomInput 
                    type="number"
                    placeholder="Quantidade em estoque (deixe em branco se ilimitado)" 
                    {...field}
                    value={field.value === null ? '' : field.value}
                    onChange={(e) => {
                      const value = e.target.value === '' ? null : parseInt(e.target.value);
                      field.onChange(value);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="categoria"
            rules={{ required: "Categoria é obrigatória" }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoria *</FormLabel>
                <FormControl>
                  <CustomSelect 
                    options={categoryOptions}
                    value={field.value}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            rules={{ required: "Status é obrigatório" }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status *</FormLabel>
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
        </div>

        <FormField
          control={form.control}
          name="prazo_entrega"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Prazo de Entrega</FormLabel>
              <FormControl>
                <CustomInput 
                  placeholder="Ex: 7-10 dias úteis" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="imagem_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Imagem da Recompensa</FormLabel>
              <div className="flex flex-col space-y-3">
                {(imagePreview || DEFAULT_IMAGE_URL) && (
                  <div className="relative w-32 h-32 border rounded overflow-hidden">
                    <img 
                      src={imagePreview || DEFAULT_IMAGE_URL} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error("Image loading error");
                        e.currentTarget.src = DEFAULT_IMAGE_URL;
                      }}
                    />
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex items-center gap-2"
                    onClick={() => document.getElementById('reward-image')?.click()}
                  >
                    <Upload size={16} />
                    {imagePreview ? 'Alterar Imagem' : 'Carregar Imagem'}
                  </Button>
                  
                  <input
                    id="reward-image"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                  
                  <input type="hidden" {...field} />
                </div>
                
                {!imagePreview && (
                  <p className="text-sm text-gray-500">
                    Imagem padrão será usada se nenhuma for selecionada
                  </p>
                )}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <CustomButton 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancelar
          </CustomButton>
          <CustomButton 
            type="submit" 
            variant="primary" 
            loading={isLoading}
            disabled={isLoading}
          >
            {initialData?.id ? 'Atualizar Recompensa' : 'Criar Recompensa'}
          </CustomButton>
        </div>
      </form>
    </Form>
  );
};

export default RewardForm;
