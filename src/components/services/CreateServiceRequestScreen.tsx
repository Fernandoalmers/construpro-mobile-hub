
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CustomButton from '../common/CustomButton';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/sonner';
import { useAuth } from '@/context/AuthContext';
import { servicesService } from '@/services/servicesManagementService';

const serviceCategories = [
  { value: 'pintura', label: 'Pintura' },
  { value: 'eletrica', label: 'Elétrica' },
  { value: 'hidraulica', label: 'Hidráulica' },
  { value: 'alvenaria', label: 'Alvenaria/Pedreiro' },
  { value: 'carpintaria', label: 'Carpintaria' },
  { value: 'piso', label: 'Piso e Revestimento' },
  { value: 'jardinagem', label: 'Jardinagem' },
  { value: 'limpeza', label: 'Limpeza de Obra' },
  { value: 'gesso', label: 'Gesso e Drywall' },
  { value: 'vidracaria', label: 'Vidraçaria' },
  { value: 'outros', label: 'Outros' }
];

const formSchema = z.object({
  titulo: z.string().min(5, 'Título deve ter pelo menos 5 caracteres'),
  descricao: z.string().min(20, 'Descrição deve ter pelo menos 20 caracteres'),
  categoria: z.string().min(1, 'Selecione uma categoria'),
  endereco: z.string().min(3, 'Informe pelo menos a cidade/bairro'),
  orcamento: z.string().optional()
});

const CreateServiceRequestScreen = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      titulo: '',
      descricao: '',
      categoria: '',
      endereco: '',
      orcamento: ''
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!isAuthenticated) {
      toast.error('Você precisa estar logado para criar uma solicitação de serviço');
      navigate('/login');
      return;
    }

    try {
      await servicesService.createServiceRequest({
        titulo: values.titulo,
        descricao: values.descricao,
        categoria: values.categoria,
        endereco: values.endereco,
        orcamento: values.orcamento || null
      });
      
      toast.success('Solicitação de serviço criada com sucesso!');
      navigate('/services');
    } catch (error) {
      console.error('Erro ao criar solicitação:', error);
      toast.error('Erro ao criar solicitação. Tente novamente.');
    }
  };

  return (
    <div className="flex flex-col">
      <h2 className="text-lg font-medium mb-4">Solicitar novo serviço</h2>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="titulo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Título do serviço</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Assentar piso em 25m²" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="categoria"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoria</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {serviceCategories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="descricao"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição detalhada</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Descreva o serviço, detalhes importantes, materiais necessários, etc." 
                    className="min-h-[120px]"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endereco"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Local do serviço (Bairro/Cidade)</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Centro, São Paulo - SP" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="orcamento"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Orçamento estimado (opcional)</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: R$ 1.500,00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="pt-4">
            <CustomButton 
              type="submit" 
              variant="primary"
              fullWidth
            >
              Criar solicitação de serviço
            </CustomButton>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default CreateServiceRequestScreen;
