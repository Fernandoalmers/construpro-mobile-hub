import React, { useState, useRef, useCallback } from 'react';
import { Plus, Minus, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPointAdjustment } from '@/services/vendor/points/adjustmentsCreator';
import { v4 as uuidv4 } from 'uuid';

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
  // Track if we've already processed a submission to avoid duplicates
  const processingRef = useRef(false);
  // Create a unique transaction ID for this form session with timestamp to ensure uniqueness
  const transactionIdRef = useRef(`${uuidv4()}-${Date.now()}`);
  
  const queryClient = useQueryClient();

  // Create point adjustment mutation
  const createAdjustmentMutation = useMutation({
    mutationFn: async (data: { 
      userId: string; 
      tipo: string; 
      valor: number; 
      motivo: string;
      transactionId: string;
    }) => {
      console.log('Mutation function called with data:', data);
      
      // Add an additional debounce here to prevent multiple rapid clicks
      if (processingRef.current) {
        console.log('Already processing, ignoring duplicate request');
        return null;
      }
      
      processingRef.current = true;
      
      try {
        const result = await createPointAdjustment(
          data.userId, 
          data.tipo, 
          data.valor, 
          data.motivo,
          data.transactionId
        );
        
        if (!result) {
          throw new Error('Falha ao ajustar pontos');
        }
        return result;
      } catch (error) {
        processingRef.current = false;
        throw error;
      }
    },
    onSuccess: () => {
      console.log('Points adjustment successful for customer ID:', customerId);
      // Clear form fields
      setPontos('');
      setMotivo('');
      
      // Reset submission state
      setSubmitting(false);
      processingRef.current = false;
      // Generate a new transaction ID for the next submission with timestamp
      transactionIdRef.current = `${uuidv4()}-${Date.now()}`;

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
      
      // Show success message
      toast.success('Ajuste de pontos realizado com sucesso!');
    },
    onError: (error: Error) => {
      setSubmitting(false);
      processingRef.current = false;
      console.error('Error in points adjustment mutation:', error);
      toast.error('Erro ao ajustar pontos: ' + error.message);
    }
  });

  const handlePontosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers
    const value = e.target.value.replace(/[^0-9]/g, '');
    setPontos(value);
  };

  // Use useCallback to debounce the submit function
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent duplicate submissions
    if (submitting || processingRef.current) {
      console.log('Form is already submitting, ignoring duplicate submission');
      toast.error('Solicitação já está em andamento, aguarde...');
      return;
    }

    // Form validation
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

    // Set the processing flags immediately
    setSubmitting(true);

    try {
      const toastId = 'adjustment-toast';
      toast.loading(
        isPositiveAdjustment 
          ? 'Adicionando pontos...' 
          : 'Removendo pontos...',
        { id: toastId }  
      );
      
      await createAdjustmentMutation.mutateAsync({
        userId: customerId,
        tipo: isPositiveAdjustment ? 'adicao' : 'remocao',
        valor: pontosValue,
        motivo,
        transactionId: transactionIdRef.current
      });
      
      // Close loading toast on success
      toast.dismiss(toastId);
      
    } catch (error) {
      setSubmitting(false);
      console.error('Error submitting points adjustment:', error);
      // Error is handled by mutation's onError
    }
  }, [customerId, pontos, motivo, isPositiveAdjustment, customerPoints, submitting, createAdjustmentMutation]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 pt-2">
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2 mb-2">
          <Button
            type="button"
            variant={isPositiveAdjustment ? "default" : "outline"}
            onClick={() => setIsPositiveAdjustment(true)}
            className="flex items-center justify-center gap-2"
            disabled={submitting}
          >
            <Plus className="h-4 w-4" />
            <span>Adicionar</span>
          </Button>
          
          <Button
            type="button"
            variant={!isPositiveAdjustment ? "default" : "outline"}
            onClick={() => setIsPositiveAdjustment(false)}
            className="flex items-center justify-center gap-2"
            disabled={submitting}
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
            disabled={submitting}
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
            disabled={submitting}
          />
        </div>
      </div>
      
      <Button 
        type="submit" 
        className="w-full"
        disabled={submitting || !pontos || !motivo || createAdjustmentMutation.isPending}
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
