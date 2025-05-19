
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
  
  // Use our hook to fetch rewards data
  const { rewards, categories, isLoading, error, refetch } = useRewardsData({
    search: searchTerm,
    categories: selectedCategories,
    userPointsAvailable: profile?.saldo_pontos
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
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-construPro-blue p-6 pt-12 rounded-b-3xl shadow-md">
        <h1 className="text-2xl font-bold text-white mb-5">Resgate de Pontos</h1>
        
        <div className="bg-white p-5 rounded-xl shadow-sm mb-5">
          <div className="flex justify-between items-center mb-2">
            <p className="text-gray-600 font-medium">Seu saldo</p>
          </div>
          
          <h2 className="text-3xl font-bold text-construPro-blue">
            {saldoPontos.toLocaleString()} pontos
          </h2>
        </div>
        
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <CustomInput
              placeholder="Buscar recompensas"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white border-0 shadow-sm focus:ring-2 focus:ring-construPro-blue/20"
            />
          </div>
          
          <div>
            <p className="text-white text-sm mb-2 font-medium">Filtrar por categoria</p>
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
      </div>
      
      {/* Rewards List */}
      <div className="p-4 md:p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-lg text-gray-800">Recompensas disponíveis</h2>
        </div>

        {rewards.length > 0 ? (
          <div className="flex flex-col gap-3">
            {rewards.map(resgate => (
              <ResgateCard
                key={resgate.id}
                resgate={resgate}
                userPoints={saldoPontos}
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
