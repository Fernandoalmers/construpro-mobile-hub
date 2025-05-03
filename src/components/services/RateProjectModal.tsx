import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/sonner';
import { useNavigate } from 'react-router-dom';
import { professionalsService } from '@/services/professionalsService';
import { projectsService } from '@/services/projectsService';

const formSchema = z.object({
  nota: z.number().min(1, 'A nota deve ser entre 1 e 5').max(5, 'A nota deve ser entre 1 e 5'),
  comentario: z.string().min(10, 'O comentário deve ter pelo menos 10 caracteres'),
  servicoRealizado: z.string().min(5, 'Informe qual serviço foi realizado'),
});

interface RateProjectModalProps {
  projectId: string;
  professionalId: string;
  professionalName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const RateProjectModal: React.FC<RateProjectModalProps> = ({
  projectId,
  professionalId,
  professionalName,
  open,
  onOpenChange,
}) => {
  const navigate = useNavigate();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nota: 5,
      comentario: '',
      servicoRealizado: '',
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      // Submit the review
      await professionalsService.submitReview({
        projectId,
        professionalId,
        nota: data.nota,
        comentario: data.comentario,
        servicoRealizado: data.servicoRealizado,
      });
      
      // Update project as evaluated
      await projectsService.updateProjectStatus({
        projectId,
        concluido: true
      });

      toast.success('Avaliação enviada com sucesso!');
      onOpenChange(false);
      navigate('/services');
    } catch (error) {
      console.error('Erro ao enviar avaliação:', error);
      toast.error('Erro ao enviar avaliação. Tente novamente.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Avaliar {professionalName}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nota"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nota</FormLabel>
                  <FormControl>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((value) => (
                        <Button
                          key={value}
                          variant={field.value === value ? 'secondary' : 'outline'}
                          onClick={() => field.onChange(value)}
                        >
                          <Star
                            size={16}
                            className={field.value >= value ? 'text-yellow-500 fill-yellow-500' : 'text-gray-400'}
                          />
                        </Button>
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="servicoRealizado"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Serviço realizado</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Instalação de piso" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="comentario"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comentário</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Descreva sua experiência com o profissional" className="min-h-[80px]" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">Enviar avaliação</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default RateProjectModal;
