import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/sonner';
import { useNavigate } from 'react-router-dom';
import { proposalsService } from '@/services/proposalsService';

interface SendProposalModalProps {
  serviceId: string;
  serviceTitulo: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formSchema = z.object({
  valor: z.string().min(1, 'Informe o valor da proposta'),
  prazo: z.string().min(1, 'Informe o prazo estimado'),
  mensagem: z.string().min(20, 'A mensagem deve ter pelo menos 20 caracteres').max(500, 'A mensagem deve ter no máximo 500 caracteres')
});

const SendProposalModal: React.FC<SendProposalModalProps> = ({
  serviceId,
  serviceTitulo,
  open,
  onOpenChange,
}) => {
  const navigate = useNavigate();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      valor: '',
      prazo: '',
      mensagem: ''
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      await proposalsService.submitProposal({
        serviceRequestId: serviceId,
        valor: data.valor,
        prazo: data.prazo,
        mensagem: data.mensagem,
      });

      toast.success('Proposta enviada com sucesso!');
      onOpenChange(false);
      navigate('/services/my-proposals');
    } catch (error) {
      console.error('Erro ao enviar proposta:', error);
      toast.error('Erro ao enviar proposta. Tente novamente.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enviar proposta</DialogTitle>
        </DialogHeader>
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
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                variant="default"
                className="bg-construPro-orange hover:bg-orange-600 text-white"
              >
                Enviar proposta
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default SendProposalModal;
