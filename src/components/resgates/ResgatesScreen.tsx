
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useRewardsData } from '@/hooks/useRewardsData';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Gift, Star, Clock, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { redeemReward } from '@/services/rewardsService';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';
import { formatCurrency } from '@/utils/formatCurrency';
import RedemptionCard from './components/RedemptionCard';
import RedemptionHeader from './components/RedemptionHeader';
import RedemptionEmptyState from './components/RedemptionEmptyState';

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
      reward.pontos <= userPoints
    );

    const upcoming = rewards.filter(reward => 
      reward.status === 'ativo' && 
      reward.pontos > userPoints
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

    if (userPoints < reward.pontos) {
      toast.error('Você não tem pontos suficientes para este resgate');
      return;
    }

    setRedeemingId(rewardId);

    try {
      const success = await redeemReward({
        rewardId,
        pontos: reward.pontos
      });

      if (success) {
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
          
          <div className="flex items-center justify-between bg-white/10 rounded-lg p-4">
            <div className="flex items-center">
              <Gift className="w-6 h-6 mr-2" />
              <div>
                <p className="text-sm opacity-90">Seus pontos</p>
                <p className="text-2xl font-bold">{userPoints}</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/profile/points-history')}
              className="border-white/30 text-white hover:bg-white/10"
            >
              Ver histórico
            </Button>
          </div>
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
                <Card key={reward.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{reward.titulo}</h3>
                        <p className="text-sm text-gray-500 mt-1">{reward.descricao}</p>
                        <Badge className="mt-2 bg-construPro-orange text-white">
                          {reward.pontos} pontos
                        </Badge>
                      </div>
                      <Button
                        onClick={() => handleRedeem(reward.id)}
                        disabled={redeemingId === reward.id}
                        className="ml-4"
                      >
                        {redeemingId === reward.id ? 'Resgatando...' : 'Resgatar'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
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
                <Card key={reward.id} className="opacity-75">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{reward.titulo}</h3>
                        <p className="text-sm text-gray-500 mt-1">{reward.descricao}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline">
                            {reward.pontos} pontos
                          </Badge>
                          <span className="text-xs text-gray-500">
                            Faltam {reward.pontos - userPoints} pontos
                          </span>
                        </div>
                      </div>
                      <Button variant="outline" disabled>
                        Indisponível
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Estado Vazio */}
        {availableRewards.length === 0 && upcomingRewards.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-16 h-16 bg-construPro-blue/10 rounded-full flex items-center justify-center mb-4">
              <Gift className="h-8 w-8 text-construPro-blue" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma recompensa disponível</h3>
            <p className="text-gray-500 mb-6 max-w-sm">Continue acumulando pontos para desbloquear recompensas incríveis!</p>
            <Button 
              onClick={() => navigate('/marketplace')}
              className="bg-construPro-blue hover:bg-construPro-blue/90"
            >
              Explorar Produtos
            </Button>
          </div>
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
