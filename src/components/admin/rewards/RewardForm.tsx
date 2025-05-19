
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
import { AdminReward } from '@/types/admin';
import CustomInput from '@/components/common/CustomInput';
import CustomButton from '@/components/common/CustomButton';
import CustomSelect from '@/components/common/CustomSelect';
import { createReward, fetchRewardCategories, updateReward } from '@/services/adminRewardsService';
import { toast } from '@/components/ui/sonner';
import { Upload, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface RewardFormProps {
  initialData?: Partial<AdminReward>;
  onSuccess: () => void;
  onCancel: () => void;
}

const RewardForm: React.FC<RewardFormProps> = ({
  initialData,
  onSuccess,
  onCancel
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [imagePreview, setImagePreview] = useState<string | null>(initialData?.imagem_url || null);
  const [categories, setCategories] = useState<string[]>(['Resgate', 'Vale Presente', 'Produto', 'Serviço', 'Outro']);
  
  const form = useForm({
    defaultValues: {
      nome: initialData?.nome || '',
      descricao: initialData?.descricao || '',
      pontos: initialData?.pontos || 0,
      categoria: initialData?.categoria || 'Resgate',
      imagem_url: initialData?.imagem_url || '',
      estoque: initialData?.estoque || null,
      status: initialData?.status || 'pendente'
    }
  });

  // Carregar categorias disponíveis
  React.useEffect(() => {
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
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
    setIsLoading(true);
    try {
      console.log("Form submission data:", data); // Debug log
      
      // Se estamos criando uma nova recompensa
      if (!initialData?.id) {
        const result = await createReward({
          nome: data.nome,
          descricao: data.descricao,
          pontos: data.pontos,
          categoria: data.categoria,
          imagem_url: data.imagem_url,
          estoque: data.estoque,
          status: data.status
        });
        
        if (result) {
          console.log("Created reward:", result); // Debug log
          toast.success('Recompensa criada com sucesso!');
          onSuccess();
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
          status: data.status
        });
        
        if (result) {
          console.log("Updated reward:", result); // Debug log
          toast.success('Recompensa atualizada com sucesso!');
          onSuccess();
        }
      }
    } catch (error) {
      console.error('Erro ao salvar recompensa:', error);
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
    { label: 'Pendente', value: 'pendente' },
    { label: 'Ativo', value: 'ativo' },
    { label: 'Inativo', value: 'inativo' }
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="nome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da Recompensa</FormLabel>
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
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pontos Necessários</FormLabel>
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
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoria</FormLabel>
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
        </div>

        <FormField
          control={form.control}
          name="imagem_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Imagem da Recompensa</FormLabel>
              <div className="flex flex-col space-y-3">
                {imagePreview && (
                  <div className="relative w-32 h-32 border rounded overflow-hidden">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
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
                    Selecione uma imagem para a recompensa
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
