
import React, { useState } from 'react';
import { Plus, Minus, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPointAdjustment } from '@/services/vendor/points/adjustmentsCreator';

interface PointsAdjustmentFormProps {
  customerId: string;
  customerPoints: number;
  onSuccess: () => void;
}

const PointsAdjustmentForm: React.FC<PointsAdjustmentFormProps> = ({ 
  customerId, 
  customerPoints,
  onSuccess 
}) => {
  const [pontos, setPontos] = useState('');
  const [motivo, setMotivo] = useState('');
  const [isPositiveAdjustment, setIsPositiveAdjustment] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const queryClient = useQueryClient();

  // Create point adjustment mutation
  const createAdjustmentMutation = useMutation({
    mutationFn: async (data: { userId: string; tipo: string; valor: number; motivo: string }) => {
      console.log('Mutation function called with data:', data);
      const result = await createPointAdjustment(data.userId, data.tipo, data.valor, data.motivo);
      if (!result) {
        throw new Error('Falha ao ajustar pontos');
      }
      return result;
    },
    onSuccess: () => {
      console.log('Points adjustment successful for customer ID:', customerId);
      // Clear form fields
      setPontos('');
      setMotivo('');
      setSubmitting(false);

      // Invalidate queries to update data immediately
      queryClient.invalidateQueries({
        queryKey: ['customerPoints']
      });
      
      queryClient.invalidateQueries({
        queryKey: ['pointAdjustments']
      });

      // Also invalidate user's points transactions data
      queryClient.invalidateQueries({
        queryKey: ['pointsHistory']
      });
      
      // Notify parent component
      onSuccess();
    },
    onError: (error: Error) => {
      setSubmitting(false);
      console.error('Error in points adjustment mutation:', error);
      toast.error('Erro ao ajustar pontos: ' + error.message);
    }
  });

  const handlePontosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers
    const value = e.target.value.replace(/[^0-9]/g, '');
    setPontos(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (submitting) {
      toast.error('Solicitação já está em andamento, aguarde...');
      return;
    }

    if (!customerId || !pontos || !motivo) {
      toast.error('Preencha todos os campos obrigatórios.');
      return;
    }

    console.log('Submitting form with customer ID:', customerId);
    console.log('DEBUG - Customer ID details:', { 
      id: customerId, 
      length: customerId.length,
      isUUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(customerId)
    });
    
    const pontosValue = parseInt(pontos);
    if (isNaN(pontosValue) || pontosValue <= 0) {
      toast.error('O valor de pontos deve ser maior que zero.');
      return;
    }

    // If removing points, check if customer has enough points
    if (!isPositiveAdjustment && pontosValue > customerPoints) {
      toast.error(`O cliente possui apenas ${customerPoints} pontos disponíveis.`);
      return;
    }

    try {
      setSubmitting(true);
      toast.loading(
        isPositiveAdjustment 
          ? 'Adicionando pontos...' 
          : 'Removendo pontos...'
      );
      
      await createAdjustmentMutation.mutateAsync({
        userId: customerId,
        tipo: isPositiveAdjustment ? 'adicao' : 'remocao',
        valor: isPositiveAdjustment ? pontosValue : -pontosValue,
        motivo
      });
    } catch (error) {
      console.error('Error submitting points adjustment:', error);
      setSubmitting(false);
      // Error is already handled by mutation's onError
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 pt-2">
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2 mb-2">
          <Button
            type="button"
            variant={isPositiveAdjustment ? "default" : "outline"}
            onClick={() => setIsPositiveAdjustment(true)}
            className="flex items-center justify-center gap-2"
          >
            <Plus className="h-4 w-4" />
            <span>Adicionar</span>
          </Button>
          
          <Button
            type="button"
            variant={!isPositiveAdjustment ? "default" : "outline"}
            onClick={() => setIsPositiveAdjustment(false)}
            className="flex items-center justify-center gap-2"
          >
            <Minus className="h-4 w-4" />
            <span>Remover</span>
          </Button>
        </div>
        
        <div>
          <label htmlFor="pontos" className="block text-sm font-medium mb-1">
            Quantidade de pontos
          </label>
          <Input
            id="pontos"
            value={pontos}
            onChange={handlePontosChange}
            placeholder="Ex: 100"
            className="w-full"
            required
          />
        </div>
        
        <div>
          <label htmlFor="motivo" className="block text-sm font-medium mb-1">
            Motivo
          </label>
          <Textarea
            id="motivo"
            value={motivo}
            onChange={e => setMotivo(e.target.value)}
            placeholder="Descreva o motivo do ajuste..."
            className="min-h-[100px]"
            required
          />
        </div>
      </div>
      
      <Button 
        type="submit" 
        className="w-full"
        disabled={submitting || !pontos || !motivo}
      >
        {submitting || createAdjustmentMutation.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processando...
          </>
        ) : (
          <>
            {isPositiveAdjustment ? 'Adicionar' : 'Remover'} Pontos
          </>
        )}
      </Button>
    </form>
  );
};

export default PointsAdjustmentForm;
