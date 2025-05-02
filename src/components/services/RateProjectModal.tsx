
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import CustomButton from '../common/CustomButton';
import CustomModal from '../common/CustomModal';
import { toast } from '@/components/ui/sonner';
import { Star } from 'lucide-react';

interface RateProjectModalProps {
  projectId: string;
  professionalName: string;
  professionalId?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const formSchema = z.object({
  nota: z.number().min(1).max(5),
  comentario: z.string().min(10, 'O comentário deve ter pelo menos 10 caracteres').max(500, 'O comentário deve ter no máximo 500 caracteres')
});

const RateProjectModal: React.FC<RateProjectModalProps> = ({ 
  projectId,
  professionalName,
  professionalId,
  open,
  onOpenChange = () => {}
}) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nota: 0,
      comentario: ''
    },
  });

  const [ratingHover, setRatingHover] = React.useState(0);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    // Here would be the API call to submit the rating
    console.log('Enviando avaliação:', { projectId, professionalId, ...values });
    
    toast.success('Avaliação enviada com sucesso!');
    onOpenChange(false);
    form.reset();
  };

  return (
    <CustomModal
      open={open}
      onOpenChange={onOpenChange}
      title="Avaliar profissional"
      description={`Avalie o trabalho de ${professionalName}`}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <FormField
            control={form.control}
            name="nota"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sua avaliação</FormLabel>
                <FormControl>
                  <div className="flex items-center justify-center">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          className="focus:outline-none"
                          onClick={() => field.onChange(star)}
                          onMouseEnter={() => setRatingHover(star)}
                          onMouseLeave={() => setRatingHover(0)}
                        >
                          <Star
                            size={32}
                            className={`transition-colors ${
                              (ratingHover || field.value) >= star
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
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
                  <Textarea 
                    placeholder="Descreva sua experiência com o profissional, qualidade do trabalho, etc." 
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
              disabled={form.getValues().nota === 0}
            >
              Enviar avaliação
            </CustomButton>
          </div>
        </form>
      </Form>
    </CustomModal>
  );
};

export default RateProjectModal;
