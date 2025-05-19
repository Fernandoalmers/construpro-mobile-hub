
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, Check, AlertCircle } from 'lucide-react';
import Card from '../common/Card';
import CustomButton from '../common/CustomButton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { redeemReward } from '@/services/rewardsService';
import LoadingState from '../common/LoadingState';
import ErrorState from '../common/ErrorState';
import { useAddresses } from '@/hooks/useAddresses';

interface Reward {
  id: string;
  titulo: string;
  pontos: number;
  categoria: string;
  imagemUrl: string;
  descricao?: string;
  estoque?: number;
  prazoEntrega?: string;
}

const ResgateDetailScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile, refreshProfile } = useAuth();
  const { addresses } = useAddresses();
  
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [reward, setReward] = useState<Reward | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Set default selected address if available
    if (addresses.length > 0 && !selectedAddressId) {
      const defaultAddress = addresses.find(a => a.principal) || addresses[0];
      setSelectedAddressId(defaultAddress.id);
    }
  }, [addresses]);
  
  useEffect(() => {
    const fetchRewardDetails = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        const { data, error } = await supabase
          .from('resgates')
          .select('*')
          .eq('id', id)
          .eq('status', 'ativo')
          .single();
        
        if (error) {
          throw error;
        }
        
        if (!data) {
          throw new Error('Recompensa não encontrada');
        }
        
        setReward({
          id: data.id,
          titulo: data.item,
          pontos: data.pontos,
          categoria: data.categoria || 'Geral',
          imagemUrl: data.imagem_url || 'https://images.unsplash.com/photo-1577132922436-e9c50c3f10c1?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&h=500&q=80',
          descricao: data.descricao || 'Vale-compra para utilizar em qualquer loja parceira do ConstruPro+.',
          estoque: data.estoque || 50,
          prazoEntrega: data.prazo_entrega || '7-10 dias úteis'
        });
        
      } catch (err: any) {
        console.error('Error fetching reward details:', err);
        setError(err.message || 'Erro ao carregar detalhes da recompensa');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRewardDetails();
  }, [id]);
  
  // Calculate date range for delivery
  const today = new Date();
  let deliveryStart = new Date(today);
  let deliveryEnd = new Date(today);
  
  if (reward?.prazoEntrega) {
    const deliveryDays = reward.prazoEntrega.split('-').map(Number);
    
    deliveryStart.setDate(today.getDate() + deliveryDays[0]);
    deliveryEnd.setDate(today.getDate() + deliveryDays[1] || deliveryDays[0] + 3);
  } else {
    deliveryStart.setDate(today.getDate() + 7);
    deliveryEnd.setDate(today.getDate() + 10);
  }
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleRedeem = () => {
    // Verify if user has enough points
    if (!profile || (profile.saldo_pontos || 0) < (reward?.pontos || 0)) {
      toast.error('Saldo de pontos insuficiente para este resgate');
      return;
    }
    
    // Verify if addresses exist
    if (addresses.length === 0) {
      toast.error('Você precisa cadastrar um endereço antes de resgatar');
      navigate('/profile/address');
      return;
    }
    
    setIsConfirmDialogOpen(true);
  };

  const confirmRedemption = async () => {
    if (!reward || !profile) return;
    
    try {
      setIsProcessing(true);
      
      const success = await redeemReward({
        rewardId: reward.id,
        pontos: reward.pontos,
        addressId: selectedAddressId
      });
      
      if (success) {
        // Refresh profile to get updated points balance
        await refreshProfile();
        
        // Close dialog and navigate to history
        setIsConfirmDialogOpen(false);
        navigate('/historico-resgates');
      }
    } catch (err) {
      console.error('Error processing redemption:', err);
      toast.error('Erro ao processar resgate');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return <LoadingState text="Carregando detalhes da recompensa..." />;
  }

  if (error || !reward) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-100 p-6 pt-12">
        <button onClick={() => navigate(-1)} className="text-construPro-blue mb-4">
          <ArrowLeft size={24} />
        </button>
        <ErrorState
          title="Erro ao carregar recompensa" 
          message={error || "Recompensa não encontrada"}
          action={{
            label: "Voltar para resgates",
            onClick: () => navigate('/rewards')
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 pb-20">
      {/* Header */}
      <div className="bg-construPro-blue p-6 pt-12">
        <button onClick={() => navigate(-1)} className="text-white mb-2">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold text-white">Detalhe da Recompensa</h1>
      </div>
      
      {/* Product Image */}
      <div className="w-full h-64 overflow-hidden">
        <img 
          src={reward.imagemUrl} 
          alt={reward.titulo}
          className="w-full h-full object-cover"
        />
      </div>
      
      {/* Reward Details */}
      <div className="p-6 space-y-4">
        <div>
          <h2 className="text-xl font-bold">{reward.titulo}</h2>
          <div className="flex items-center bg-construPro-orange/10 text-construPro-orange text-sm rounded-full px-3 py-1 mt-2 inline-block">
            <span>{reward.pontos} pontos</span>
          </div>
        </div>
        
        <Card className="p-4">
          <h3 className="font-medium mb-2">Detalhes</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Categoria</span>
              <span>{reward.categoria}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Estoque</span>
              <span>{reward.estoque} unidades</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Prazo de entrega</span>
              <span>{reward.prazoEntrega}</span>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <h3 className="font-medium mb-2">Descrição</h3>
          <p className="text-sm text-gray-700">{reward.descricao}</p>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center mb-2">
            <Calendar className="text-construPro-blue mr-2" size={18} />
            <h3 className="font-medium">Previsão de entrega</h3>
          </div>
          <p className="text-sm">
            Chegará entre <span className="font-medium">{formatDate(deliveryStart)}</span> e <span className="font-medium">{formatDate(deliveryEnd)}</span>
          </p>
        </Card>
        
        <CustomButton
          variant="primary"
          fullWidth
          onClick={handleRedeem}
          disabled={(profile?.saldo_pontos || 0) < reward.pontos}
        >
          Resgatar por {reward.pontos} pontos
        </CustomButton>
        
        {(profile?.saldo_pontos || 0) < reward.pontos && (
          <p className="text-sm text-center text-red-500">
            Você não possui saldo suficiente para este resgate.
          </p>
        )}
      </div>
      
      {/* Confirmation Dialog */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar resgate</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p className="mb-4">Deseja resgatar <strong>{reward.titulo}</strong> por <strong>{reward.pontos} pontos</strong>?</p>
            
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-2">Selecione o endereço de entrega</h4>
              <RadioGroup value={selectedAddressId} onValueChange={setSelectedAddressId}>
                {addresses.map(address => (
                  <div key={address.id} className="flex items-start space-x-2 mb-3">
                    <RadioGroupItem value={address.id} id={`address-${address.id}`} className="mt-1" />
                    <div className="grid gap-1.5">
                      <Label htmlFor={`address-${address.id}`} className="font-medium">
                        {address.nome} {address.principal && '(Principal)'}
                      </Label>
                      <p className="text-sm text-gray-500">
                        {address.logradouro}, {address.numero}
                        {address.complemento && `, ${address.complemento}`}<br />
                        {address.bairro}, {address.cidade} - {address.estado}<br />
                        CEP: {address.cep}
                      </p>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </div>
            
            <Alert>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-construPro-blue" />
                <AlertTitle className="text-construPro-blue">Previsão de entrega</AlertTitle>
              </div>
              <AlertDescription>
                Entre {formatDate(deliveryStart)} e {formatDate(deliveryEnd)}
              </AlertDescription>
            </Alert>
          </div>
          
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <CustomButton
              variant="outline"
              onClick={() => setIsConfirmDialogOpen(false)}
              className="sm:w-auto w-full"
            >
              Cancelar
            </CustomButton>
            <CustomButton
              variant="primary"
              onClick={confirmRedemption}
              loading={isProcessing}
              className="sm:w-auto w-full"
              icon={<Check size={18} />}
            >
              Confirmar Resgate
            </CustomButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ResgateDetailScreen;
