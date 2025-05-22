
import React, { useState } from 'react';
import { Plus, Minus, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPointAdjustment } from '@/services/vendor/points';

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
    mutationFn: (data: { userId: string, tipo: 'adicao' | 'remocao', valor: number, motivo: string }) => {
      console.log('Mutation function called with data:', data);
      return createPointAdjustment(data.userId, data.tipo, data.valor, data.motivo);
    },
    onSuccess: () => {
      console.log('Points adjustment successful for customer ID:', customerId);
      toast.success(isPositiveAdjustment ? 'Pontos adicionados com sucesso!' : 'Pontos removidos com sucesso!');
      setPontos('');
      setMotivo('');
      
      // Invalidate queries to update data
      queryClient.invalidateQueries({ queryKey: ['customerPoints', customerId] });
      queryClient.invalidateQueries({ queryKey: ['pointAdjustments', customerId] });
      
      // Also invalidate user's points transactions data
      queryClient.invalidateQueries({ queryKey: ['pointsHistory'] });
      
      // Force a refetch of the customer's points and adjustments
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ['customerPoints', customerId] });
        queryClient.refetchQueries({ queryKey: ['pointAdjustments', customerId] });
      }, 500);
      
      // Notify parent component
      onSuccess();
    },
    onError: (error) => {
      console.error('Error in points adjustment mutation:', error);
      toast.error('Erro ao ajustar pontos. Verifique o console para detalhes.');
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
    
    await createAdjustmentMutation.mutateAsync({
      userId: customerId,
      tipo: isPositiveAdjustment ? 'adicao' : 'remocao',
      valor: pontosValue,
      motivo
    });
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
        
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <span className="text-gray-500">
              {isPositiveAdjustment ? "+" : "-"}
            </span>
          </div>
          <Input
            value={pontos}
            onChange={handlePontosChange}
            placeholder="Quantidade de pontos"
            className="pl-8"
            required
          />
        </div>
        
        {!isPositiveAdjustment && (
          <p className="text-xs text-gray-500 mt-1">
            {customerPoints > 0 
              ? `Cliente possui ${customerPoints} pontos disponíveis` 
              : 'Cliente não possui pontos disponíveis'}
          </p>
        )}
      </div>
      
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Motivo <span className="text-red-500">*</span>
        </label>
        <Textarea
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          placeholder="Descreva o motivo do ajuste de pontos"
          required
          rows={3}
        />
        <p className="text-xs text-gray-500">
          Informe detalhes que ajudem a identificar este ajuste no futuro
        </p>
      </div>
      
      <Button 
        type="submit" 
        className="w-full" 
        disabled={createAdjustmentMutation.isPending || !pontos || !motivo || (
          !isPositiveAdjustment && parseInt(pontos) > customerPoints
        )}
      >
        {createAdjustmentMutation.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processando...
          </>
        ) : (
          `Confirmar ${isPositiveAdjustment ? 'Adição' : 'Remoção'} de Pontos`
        )}
      </Button>
    </form>
  );
};

export default PointsAdjustmentForm;
