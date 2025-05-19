
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../common/Card';
import ListEmptyState from '../common/ListEmptyState';
import { ArrowLeft, Clock, Gift, CheckCircle, Truck, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import LoadingState from '../common/LoadingState';
import ErrorState from '../common/ErrorState';

interface Redemption {
  id: string;
  item: string;
  pontos: number;
  status: string;
  data: string;
  codigo?: string;
  imagem_url?: string;
  created_at: string;
}

const HistoricoResgatesScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchRedemptionHistory = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        const { data, error } = await supabase
          .from('resgates')
          .select('*')
          .eq('cliente_id', user.id)
          .order('created_at', { ascending: false });
        
        if (error) {
          throw error;
        }
        
        setRedemptions(data || []);
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

  // Helper function to render status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'aprovado':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'pendente':
        return <Clock size={16} className="text-amber-500" />;
      case 'em_transito':
        return <Truck size={16} className="text-blue-500" />;
      case 'entregue':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'recusado':
        return <AlertCircle size={16} className="text-red-500" />;
      default:
        return <AlertCircle size={16} className="text-gray-500" />;
    }
  };
  
  // Format status for display
  const formatStatus = (status: string) => {
    const statusMap: Record<string, string> = {
      'pendente': 'Pendente',
      'aprovado': 'Aprovado',
      'recusado': 'Recusado',
      'em_transito': 'Em Trânsito',
      'entregue': 'Entregue'
    };
    
    return statusMap[status] || status;
  };

  if (isLoading) {
    return <LoadingState text="Carregando histórico..." />;
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-100 p-6">
        <button onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft size={24} />
        </button>
        <ErrorState
          title="Erro ao carregar histórico" 
          message={error}
          action={{
            label: "Tentar novamente",
            onClick: () => window.location.reload()
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 pb-20">
      {/* Header */}
      <div className="bg-white p-4 flex items-center shadow-sm">
        <button onClick={() => navigate(-1)} className="mr-4">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold">Histórico de Resgates</h1>
      </div>
      
      <div className="p-6">
        {redemptions.length > 0 ? (
          <div className="space-y-4">
            {redemptions.map(redemption => (
              <Card key={redemption.id} className="p-4 flex gap-3">
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                  <img 
                    src={redemption.imagem_url || 'https://images.unsplash.com/photo-1577132922436-e9c50c3f10c1?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&h=500&q=80'} 
                    alt={redemption.item}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="flex-1">
                  <h3 className="font-medium">{redemption.item}</h3>
                  
                  <div className="flex items-center mt-1 text-sm text-gray-500">
                    <span className="bg-construPro-orange/10 text-construPro-orange rounded-full px-2 py-0.5 inline-block mr-2">
                      {redemption.pontos} pontos
                    </span>
                    <span>
                      {new Date(redemption.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center">
                      {getStatusIcon(redemption.status)}
                      <span className="ml-1 text-sm">{formatStatus(redemption.status)}</span>
                    </div>
                    
                    {redemption.codigo && (
                      <span className="text-sm bg-gray-100 px-2 py-0.5 rounded">
                        Código: {redemption.codigo}
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <ListEmptyState
            title="Histórico vazio"
            description="Você ainda não realizou nenhum resgate de pontos."
            icon={<Gift size={40} />}
            action={{
              label: "Explorar Recompensas",
              onClick: () => navigate('/rewards')
            }}
          />
        )}
      </div>
    </div>
  );
};

export default HistoricoResgatesScreen;
