
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
      // Toast message moved to createPointAdjustment for better error handling
      setPontos('');
      setMotivo('');

      // Invalidate queries to update data
      queryClient.invalidateQueries({
        queryKey: ['customerPoints', customerId]
      });
      
      queryClient.invalidateQueries({
        queryKey: ['pointAdjustments', customerId]
      });

      // Also invalidate user's points transactions data
      queryClient.invalidateQueries({
        queryKey: ['pointsHistory']
      });
      
      // Force a refetch of the customer's points and adjustments with a short delay
      setTimeout(() => {
        queryClient.refetchQueries({
          queryKey: ['customerPoints', customerId]
        });
        
        queryClient.refetchQueries({
          queryKey: ['pointAdjustments', customerId]
        });
      }, 500);

      // Notify parent component
      onSuccess();
    },
    onError: (error: Error) => {
      console.error('Error in points adjustment mutation:', error);
      // Toast message moved to createPointAdjustment for better error handling
    }
  });

  const handlePontosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers
    const value = e.target.value.replace(/[^0-9]/g, '');
    setPontos(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerId || !pontos || !motivo) {
      toast.error('Preencha todos os campos obrigatórios.');
      return;
    }

    console.log('Submitting form with customer ID:', customerId);
    
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
      await createAdjustmentMutation.mutateAsync({
        userId: customerId,
        tipo: isPositiveAdjustment ? 'adicao' : 'remocao',
        valor: pontosValue,
        motivo
      });
    } catch (error) {
      console.error('Error submitting points adjustment:', error);
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
        disabled={createAdjustmentMutation.isPending || !pontos || !motivo}
      >
        {createAdjustmentMutation.isPending ? (
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
