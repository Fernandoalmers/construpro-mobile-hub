
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useRewardsData } from '@/hooks/useRewardsData';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Gift, Star, Clock, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';
import { formatCurrency } from '@/utils/formatCurrency';
import { RedemptionCard } from './components/RedemptionCard';
import { RedemptionHeader } from './components/RedemptionHeader';
import { RedemptionEmptyState } from './components/RedemptionEmptyState';

const ResgatesScreen: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { rewards, isLoading, error } = useRewardsData();
  const [redeemingId, setRedeemingId] = useState<string | null>(null);

  console.log('🎁 [ResgatesScreen] Renderizando com:', {
    profile: !!profile,
    rewards: rewards?.length || 0,
    isLoading,
    error
  });

  const userPoints = profile?.saldo_pontos || 0;

  // Filtrar e organizar recompensas
  const { availableRewards, upcomingRewards } = useMemo(() => {
    if (!rewards || !Array.isArray(rewards)) return { availableRewards: [], upcomingRewards: [] };

    const available = rewards.filter(reward => 
      reward.status === 'ativo' && 
      reward.pontos_necessarios <= userPoints
    );

    const upcoming = rewards.filter(reward => 
      reward.status === 'ativo' && 
      reward.pontos_necessarios > userPoints
    );

    return { availableRewards: available, upcomingRewards: upcoming };
  }, [rewards, userPoints]);

  const handleRedeem = async (rewardId: string) => {
    if (!profile) {
      toast.error('Você precisa estar logado para resgatar recompensas');
      return;
    }

    const reward = rewards?.find(r => r.id === rewardId);
    if (!reward) {
      toast.error('Recompensa não encontrada');
      return;
    }

    if (userPoints < reward.pontos_necessarios) {
      toast.error('Você não tem pontos suficientes para este resgate');
      return;
    }

    setRedeemingId(rewardId);

    try {
      const { data, error } = await supabase.rpc('redeem_reward', {
        user_id: profile.id,
        reward_id: rewardId
      });

      if (error) {
        console.error('Erro ao resgatar recompensa:', error);
        
        if (error.message?.includes('insufficient_points')) {
          toast.error('Pontos insuficientes para este resgate');
        } else if (error.message?.includes('reward_not_found')) {
          toast.error('Recompensa não encontrada');
        } else if (error.message?.includes('reward_inactive')) {
          toast.error('Esta recompensa não está mais disponível');
        } else {
          toast.error('Erro ao processar resgate. Tente novamente.');
        }
        return;
      }

      if (data?.success) {
        toast.success('Resgate realizado com sucesso!');
        navigate('/historico-resgates');
      } else {
        toast.error('Erro ao processar resgate');
      }
    } catch (error) {
      console.error('Erro inesperado ao resgatar:', error);
      toast.error('Erro inesperado. Tente novamente.');
    } finally {
      setRedeemingId(null);
    }
  };

  if (isLoading) {
    return <LoadingState text="Carregando recompensas..." />;
  }

  if (error) {
    return <ErrorState title="Erro" message={error} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-royal-blue to-royal-blue/80 text-white">
        <div className="p-4 pt-8">
          <div className="flex items-center mb-4">
            <button 
              onClick={() => navigate('/home')}
              className="mr-3 text-white hover:bg-white/10 p-2 rounded-full transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-2xl font-bold">Resgates</h1>
          </div>
          
          <RedemptionHeader userPoints={userPoints} />
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Recompensas Disponíveis */}
        {availableRewards.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center mb-3">
              <Sparkles className="w-5 h-5 text-green-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-800">
                Disponíveis para Resgate
              </h2>
            </div>
            <div className="grid gap-3">
              {availableRewards.map((reward) => (
                <RedemptionCard
                  key={reward.id}
                  reward={reward}
                  userPoints={userPoints}
                  onRedeem={handleRedeem}
                  isRedeeming={redeemingId === reward.id}
                />
              ))}
            </div>
          </div>
        )}

        {/* Próximas Recompensas */}
        {upcomingRewards.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center mb-3">
              <Star className="w-5 h-5 text-yellow-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-800">
                Continue Acumulando Pontos
              </h2>
            </div>
            <div className="grid gap-3">
              {upcomingRewards.map((reward) => (
                <RedemptionCard
                  key={reward.id}
                  reward={reward}
                  userPoints={userPoints}
                  onRedeem={handleRedeem}
                  isRedeeming={false}
                />
              ))}
            </div>
          </div>
        )}

        {/* Estado Vazio */}
        {availableRewards.length === 0 && upcomingRewards.length === 0 && (
          <RedemptionEmptyState />
        )}

        {/* Link para Histórico */}
        <div className="mt-6 text-center">
          <Button
            variant="outline"
            onClick={() => navigate('/historico-resgates')}
            className="w-full"
          >
            <Clock className="w-4 h-4 mr-2" />
            Ver Histórico de Resgates
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ResgatesScreen;
