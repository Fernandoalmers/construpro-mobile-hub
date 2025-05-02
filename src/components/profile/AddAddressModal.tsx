
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import CustomButton from '../common/CustomButton';
import CustomModal from '../common/CustomModal';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface AddAddressModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: any) => void;
  initialData?: any;
}

const formSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  cep: z.string().min(8, 'CEP inválido').max(9, 'CEP inválido'),
  logradouro: z.string().min(1, 'Endereço é obrigatório'),
  numero: z.string().min(1, 'Número é obrigatório'),
  complemento: z.string().optional(),
  bairro: z.string().min(1, 'Bairro é obrigatório'),
  cidade: z.string().min(1, 'Cidade é obrigatória'),
  estado: z.string().min(2, 'Estado é obrigatório').max(2, 'Use a sigla do estado')
});

const AddAddressModal: React.FC<AddAddressModalProps> = ({ 
  open, 
  onOpenChange,
  onSave,
  initialData
}) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      nome: '',
      cep: '',
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      estado: ''
    },
  });

  const [isLoading, setIsLoading] = React.useState(false);

  // Reset form when initialData changes
  React.useEffect(() => {
    if (initialData) {
      form.reset(initialData);
    } else {
      form.reset({
        nome: '',
        cep: '',
        logradouro: '',
        numero: '',
        complemento: '',
        bairro: '',
        cidade: '',
        estado: ''
      });
    }
  }, [initialData, form]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    onSave(values);
  };

  const searchCEP = async () => {
    const cep = form.getValues('cep').replace('-', '');
    
    if (cep.length !== 8) {
      toast({
        title: "CEP inválido",
        description: "Digite um CEP válido com 8 dígitos",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();
      
      if (data.erro) {
        toast({
          title: "CEP não encontrado",
          description: "Verifique o CEP digitado",
          variant: "destructive",
        });
        return;
      }
      
      form.setValue('logradouro', data.logradouro);
      form.setValue('bairro', data.bairro);
      form.setValue('cidade', data.localidade);
      form.setValue('estado', data.uf);
      
    } catch (error) {
      toast({
        title: "Erro ao buscar CEP",
        description: "Ocorreu um erro ao buscar o CEP",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CustomModal
      open={open}
      onOpenChange={onOpenChange}
      title={initialData ? "Editar endereço" : "Adicionar endereço"}
      description="Preencha os dados do endereço"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <FormField
            control={form.control}
            name="nome"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome do endereço</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Casa, Trabalho" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-2 items-end">
            <FormField
              control={form.control}
              name="cep"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>CEP</FormLabel>
                  <FormControl>
                    <Input placeholder="00000-000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <CustomButton
              type="button"
              variant="outline"
              onClick={searchCEP}
              disabled={isLoading}
              className="mb-[2px]"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Buscar'}
            </CustomButton>
          </div>

          <FormField
            control={form.control}
            name="logradouro"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Logradouro</FormLabel>
                <FormControl>
                  <Input placeholder="Rua, Avenida, etc" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="numero"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número</FormLabel>
                  <FormControl>
                    <Input placeholder="123" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="complemento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Complemento</FormLabel>
                  <FormControl>
                    <Input placeholder="Apto, Sala, etc" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="bairro"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bairro</FormLabel>
                <FormControl>
                  <Input placeholder="Bairro" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="cidade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cidade</FormLabel>
                  <FormControl>
                    <Input placeholder="Cidade" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="estado"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado</FormLabel>
                  <FormControl>
                    <Input placeholder="UF" {...field} maxLength={2} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <CustomButton
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </CustomButton>
            <CustomButton 
              type="submit" 
              variant="primary"
            >
              Salvar
            </CustomButton>
          </div>
        </form>
      </Form>
    </CustomModal>
  );
};

export default AddAddressModal;
