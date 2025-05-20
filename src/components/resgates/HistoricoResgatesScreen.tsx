
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRedemptionHistory } from '@/services/rewardsService';
import { useAuth } from '@/context/AuthContext';
import LoadingState from '@/components/common/LoadingState';
import { supabase } from '@/integrations/supabase/client';
import RedemptionHeader from './components/RedemptionHeader';
import RedemptionCard from './components/RedemptionCard';
import RedemptionEmptyState from './components/RedemptionEmptyState';
import RedemptionDetailsDialog from './components/RedemptionDetailsDialog';

interface Redemption {
  id: string;
  item: string;
  pontos: number;
  status: string;
  data?: string;
  codigo?: string;
  imagem_url?: string;
  created_at: string;
  descricao?: string;
}

const HistoricoResgatesScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRedemptionId, setSelectedRedemptionId] = useState<string | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  
  useEffect(() => {
    const fetchRedemptionHistory = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        const redeemHistory = await getRedemptionHistory();
        setRedemptions(redeemHistory || []);
      } catch (err: any) {
        console.error('Error fetching redemption history:', err);
        setError(err.message || 'Erro ao carregar histórico de resgates');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRedemptionHistory();
    
    // Set up realtime subscription
    const channel = supabase
      .channel('redemptions_history')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'resgates',
          filter: `cliente_id=eq.${user?.id}`
        }, 
        () => {
          fetchRedemptionHistory();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleRedemptionClick = (id: string) => {
    setSelectedRedemptionId(id);
    setDetailsDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <RedemptionHeader title="Histórico de Resgates" />
        <div className="p-4">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="bg-white rounded-xl p-3 flex gap-3 mb-3 animate-pulse">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-200 rounded-lg"></div>
              <div className="flex-1">
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <RedemptionHeader title="Histórico de Resgates" />
        <div className="flex flex-col items-center justify-center p-6 mt-12 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Ops! Algo deu errado</h3>
          <p className="text-gray-500 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-construPro-blue text-white rounded-lg hover:bg-construPro-blue/90 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <RedemptionHeader title="Histórico de Resgates" />
      
      <div className="p-4">
        {redemptions.length > 0 ? (
          <div className="space-y-3">
            {redemptions.map(redemption => (
              <div key={redemption.id} className="animate-fade-in">
                <RedemptionCard 
                  redemption={redemption}
                  onClick={() => handleRedemptionClick(redemption.id)}
                />
              </div>
            ))}
          </div>
        ) : (
          <RedemptionEmptyState
            title="Histórico vazio"
            description="Você ainda não realizou nenhum resgate de pontos. Explore as recompensas disponíveis e resgate seus pontos!"
          />
        )}
      </div>

      {/* Redemption details dialog */}
      <RedemptionDetailsDialog 
        redemptionId={selectedRedemptionId}
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
      />
    </div>
  );
};

export default HistoricoResgatesScreen;
