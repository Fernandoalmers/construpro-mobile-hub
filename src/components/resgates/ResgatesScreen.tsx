
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FilterChips from '../common/FilterChips';
import CustomInput from '../common/CustomInput';
import ListEmptyState from '../common/ListEmptyState';
import { Search, Gift } from 'lucide-react';
import ResgateCard from './ResgateCard';
import { useAuth } from '@/context/AuthContext';
import { useRewardsData } from '@/hooks/useRewardsData';
import LoadingState from '../common/LoadingState';
import ErrorState from '../common/ErrorState';

const ResgatesScreen: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  
  // Use our new hook to fetch rewards data
  const { rewards, categories, isLoading, error, refetch } = useRewardsData({
    search: searchTerm,
    categories: selectedCategories
  });
  
  // Get user's points balance
  const saldoPontos = profile?.saldo_pontos || 0;
  
  // Format categories for the filter chips
  const categoriaItems = categories.map(cat => ({ id: cat, label: cat }));

  if (isLoading) {
    return <LoadingState text="Carregando recompensas..." />;
  }

  if (error) {
    return (
      <ErrorState
        title="Erro ao carregar recompensas"
        message={error}
        onRetry={refetch}
      />
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 pb-20">
      {/* Header */}
      <div className="bg-construPro-blue p-6 pt-12 rounded-b-3xl">
        <h1 className="text-2xl font-bold text-white mb-4">Resgate de Pontos</h1>
        
        <div className="bg-white p-4 rounded-xl shadow-md mb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-600">Seu saldo</p>
          </div>
          <h2 className="text-3xl font-bold text-construPro-blue mb-1">
            {saldoPontos.toLocaleString()} pontos
          </h2>
        </div>
        
        <CustomInput
          isSearch
          placeholder="Buscar recompensas"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mb-4"
        />
        
        <div>
          <p className="text-white text-sm mb-2">Filtrar por categoria</p>
          <div className="overflow-x-auto">
            <div className="inline-flex pb-2">
              <FilterChips
                items={categoriaItems}
                selectedIds={selectedCategories}
                onChange={setSelectedCategories}
                allowMultiple
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Rewards List */}
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-lg text-gray-800">Recompensas disponíveis</h2>
          <button 
            onClick={() => navigate('/historico-resgates')}
            className="text-construPro-blue text-sm font-medium"
          >
            Ver histórico
          </button>
        </div>

        {rewards.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {rewards.map(resgate => (
              <ResgateCard
                key={resgate.id}
                resgate={resgate}
                disabled={saldoPontos < resgate.pontos}
                onClick={() => navigate(`/resgate/${resgate.id}`)}
              />
            ))}
          </div>
        ) : (
          <ListEmptyState
            title="Nenhuma recompensa encontrada"
            description="Tente mudar os filtros ou buscar por outro termo."
            icon={<Gift size={40} />}
            action={{
              label: "Limpar filtros",
              onClick: () => {
                setSearchTerm('');
                setSelectedCategories([]);
              }
            }}
          />
        )}
      </div>
    </div>
  );
};

export default ResgatesScreen;
