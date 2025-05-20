
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, History, Gift } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import LoadingState from '@/components/common/LoadingState';
import ResgateCard from './ResgateCard';
import { useAuth } from '@/context/AuthContext';
import CustomButton from '@/components/common/CustomButton';

interface Resgate {
  id: string;
  item: string;
  pontos: number;
  imagem_url: string;
  categoria: string;
  status: string;
  estoque: number | null;
  descricao?: string;
}

const ResgatesScreen: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [resgates, setResgates] = useState<Resgate[]>([]);
  const [filteredResgates, setFilteredResgates] = useState<Resgate[]>([]);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [selectedCategoria, setSelectedCategoria] = useState<string>('Todos');
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    const fetchResgates = async () => {
      try {
        setIsLoading(true);
        
        const { data, error } = await supabase
          .from('resgates')
          .select('*')
          .eq('status', 'ativo');
          
        if (error) {
          console.error('Error fetching resgates:', error);
          return;
        }
        
        // Filter out rewards with zero stock
        const availableResgates = data
          ? data.filter(resgate => resgate.estoque === null || resgate.estoque > 0)
          : [];
        
        setResgates(availableResgates);
        setFilteredResgates(availableResgates);
        
        // Extract unique categories
        const uniqueCategorias = Array.from(
          new Set(availableResgates.map(resgate => resgate.categoria).filter(Boolean))
        );
        
        setCategorias(['Todos', ...uniqueCategorias]);
      } catch (err) {
        console.error('Failed to fetch resgates:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchResgates();
  }, []);
  
  useEffect(() => {
    let filtered = resgates;
    
    // Filter by category
    if (selectedCategoria !== 'Todos') {
      filtered = filtered.filter(resgate => resgate.categoria === selectedCategoria);
    }
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(resgate => 
        resgate.item.toLowerCase().includes(term) || 
        (resgate.categoria && resgate.categoria.toLowerCase().includes(term))
      );
    }
    
    setFilteredResgates(filtered);
  }, [selectedCategoria, searchTerm, resgates]);
  
  const handleSelectCategoria = (categoria: string) => {
    setSelectedCategoria(categoria);
  };
  
  const getPointsBalance = () => {
    return profile?.saldo_pontos || 0;
  };
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-b from-construPro-blue to-construPro-blue/90 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <button onClick={() => navigate(-1)} className="text-white mr-2 p-1.5 hover:bg-white/10 rounded-full transition-colors">
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-bold text-white">Recompensas</h1>
          </div>
          
          {/* Enhanced history button */}
          <CustomButton 
            variant="outline" 
            className="bg-white/10 text-white border-white/20 hover:bg-white/20 rounded-full"
            onClick={() => navigate('/historico-resgates')}
            icon={<History size={16} />}
          >
            Histórico
          </CustomButton>
        </div>
        
        {/* Enhanced points card */}
        <div className="bg-white rounded-xl p-4 mb-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-0.5">Saldo disponível</p>
              <p className="text-2xl font-bold text-construPro-orange">{getPointsBalance()} pontos</p>
            </div>
            {/* Could add a points icon or decoration here */}
            <div className="h-12 w-12 rounded-full bg-orange-50 flex items-center justify-center">
              <Gift className="h-6 w-6 text-construPro-orange" />
            </div>
          </div>
        </div>
        
        {/* Enhanced search bar */}
        <div className="relative mb-2">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input 
            className="w-full bg-white pl-9 rounded-xl border-gray-100 focus:border-construPro-blue"
            placeholder="Buscar recompensas..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {/* Enhanced categories filter */}
        <div className="overflow-x-auto">
          <div className="flex space-x-2 pb-2">
            {categorias.map((categoria) => (
              <button
                key={categoria}
                className={`px-4 py-2 rounded-full whitespace-nowrap text-sm transition-all ${
                  selectedCategoria === categoria
                    ? 'bg-white text-construPro-blue font-medium shadow-sm'
                    : 'bg-construPro-blue/50 text-white hover:bg-construPro-blue/60'
                }`}
                onClick={() => handleSelectCategoria(categoria)}
              >
                {categoria}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Enhanced Content */}
      <div className="flex-1 p-4 md:p-6">
        {isLoading ? (
          <LoadingState text="Carregando recompensas..." />
        ) : filteredResgates.length > 0 ? (
          <div className="space-y-4">
            {filteredResgates.map((resgate) => (
              <ResgateCard
                key={resgate.id}
                resgate={{
                  id: resgate.id,
                  titulo: resgate.item,
                  pontos: resgate.pontos,
                  imagemUrl: resgate.imagem_url,
                  categoria: resgate.categoria || 'Geral',
                  descricao: resgate.descricao
                }}
                userPoints={getPointsBalance()}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-center bg-white p-8 rounded-xl shadow-sm">
            <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Gift className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-500 mb-2">Nenhuma recompensa encontrada</p>
            {searchTerm && (
              <button 
                className="text-construPro-blue font-medium mt-2 hover:underline"
                onClick={() => setSearchTerm('')}
              >
                Limpar busca
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResgatesScreen;
