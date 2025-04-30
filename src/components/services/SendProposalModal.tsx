
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import CustomButton from '../common/CustomButton';
import CustomModal from '../common/CustomModal';
import { toast } from '@/components/ui/sonner';

interface SendProposalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceId: string;
  serviceTitulo: string;
}

const formSchema = z.object({
  valor: z.string().min(1, 'Informe o valor da proposta'),
  prazo: z.string().min(1, 'Informe o prazo estimado'),
  mensagem: z.string().min(20, 'A mensagem deve ter pelo menos 20 caracteres').max(500, 'A mensagem deve ter no máximo 500 caracteres')
});

const SendProposalModal: React.FC<SendProposalModalProps> = ({ 
  open, 
  onOpenChange,
  serviceId,
  serviceTitulo 
}) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      valor: '',
      prazo: '',
      mensagem: ''
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    // Here would be the API call to send the proposal
    console.log('Enviando proposta:', { serviceId, ...values });
    
    toast.success('Proposta enviada com sucesso!');
    onOpenChange(false);
    form.reset();
  };

  return (
    <CustomModal
      open={open}
      onOpenChange={onOpenChange}
      title="Enviar proposta"
      description={`Proposta para o serviço: ${serviceTitulo}`}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <FormField
            control={form.control}
            name="valor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor proposto</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: R$ 1.200,00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="prazo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prazo estimado</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: 5 dias" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="mensagem"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mensagem</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Descreva detalhes da sua proposta, experiência com esse tipo de serviço, etc." 
                    className="min-h-[120px]"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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
              Enviar proposta
            </CustomButton>
          </div>
        </form>
      </Form>
    </CustomModal>
  );
};

export default SendProposalModal;
