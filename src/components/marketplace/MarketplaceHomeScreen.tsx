
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomInput from '../common/CustomInput';
import { ShoppingBag } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import LoadingState from '../common/LoadingState';
import ErrorState from '../common/ErrorState';
import { getProductSegments, ProductSegment } from '@/services/admin/productSegmentsService';

// Import store data
import stores from '@/data/lojas.json';

const MarketplaceHomeScreen: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [storeData, setStoreData] = useState<any[]>(stores);
  const [segments, setSegments] = useState<ProductSegment[]>([]);

  // Map segment names to icons
  const getIconForSegment = (segmentName: string) => {
    const nameToLower = segmentName.toLowerCase();
    if (nameToLower.includes('material') && nameToLower.includes('constru')) {
      return <ShoppingBag size={24} />;
    } else if (nameToLower.includes('elétri') || nameToLower.includes('eletri')) {
      return <ShoppingBag size={24} />;
    } else if (nameToLower.includes('vidro') || nameToLower.includes('vidraç')) {
      return <ShoppingBag size={24} />;
    } else if (nameToLower.includes('marmor')) {
      return <ShoppingBag size={24} />;
    } else if (nameToLower.includes('aluguel') || nameToLower.includes('equipamento')) {
      return <ShoppingBag size={24} />;
    } else {
      return <ShoppingBag size={24} />;
    }
  };

  // Fetch segments with fallback robusto
  const fetchSegments = async () => {
    try {
      console.log('🔄 [MarketplaceHomeScreen] Carregando segmentos...');
      setLoading(true);
      setError(null);

      // Usar o serviço otimizado que já tem fallbacks
      const segmentsData = await getProductSegments();
      console.log('[MarketplaceHomeScreen] Segmentos carregados:', segmentsData.length);
        
      // Filtrar apenas segmentos ativos
      const activeSegments = segmentsData.filter(segment => segment.status === 'ativo');
      setSegments(activeSegments);
    } catch (err) {
      console.error('❌ [MarketplaceHomeScreen] Erro ao carregar segmentos:', err);
      setError('Erro ao carregar categorias. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch segments on component mount
  useEffect(() => {
    fetchSegments();
  }, []);

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const { data, error } = await supabase.from('stores').select('*');
        if (error) throw error;
        if (data && data.length > 0) {
          setStoreData(data);
        }
      } catch (err) {
        console.error('Error fetching stores:', err);
        // Não definir erro aqui para não bloquear a interface por causa das lojas
      }
    };
    fetchStores();
  }, []);

  const handleCategoryClick = (segmentId?: string) => {
    if (!segmentId) {
      navigate('/marketplace/products');
      return;
    }

    // Navigate to marketplace with segment filter
    const queryParams = new URLSearchParams();
    queryParams.append('segmento_id', segmentId);
    console.log(`[MarketplaceHomeScreen] Navigating to marketplace with segment_id: ${segmentId}`);
    navigate(`/marketplace/products?${queryParams.toString()}`);
  };

  const handleRetry = () => {
    fetchSegments();
  };

  if (loading && segments.length === 0) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
        <div className="p-4 pt-8 bg-construPro-blue">
          <h1 className="text-2xl font-bold text-white mb-4">Loja</h1>
          <CustomInput 
            isSearch 
            placeholder="Buscar produtos" 
            onClick={() => navigate('/marketplace/products')} 
            className="mb-2 cursor-pointer" 
            readOnly 
          />
        </div>
        
        <div className="p-4">
          <LoadingState 
            text="Carregando categorias..." 
          />
        </div>
      </div>
    );
  }

  if (error && segments.length === 0) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
        <div className="p-4 pt-8 bg-construPro-blue">
          <h1 className="text-2xl font-bold text-white mb-4">Loja</h1>
          <CustomInput 
            isSearch 
            placeholder="Buscar produtos" 
            onClick={() => navigate('/marketplace/products')} 
            className="mb-2 cursor-pointer" 
            readOnly 
          />
        </div>
        
        <div className="p-4">
          <ErrorState 
            title="Problema de Conexão" 
            message={error}
            actionButton={{
              label: "Tentar Novamente",
              onClick: handleRetry
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="p-4 pt-8 bg-construPro-blue">
        <h1 className="text-2xl font-bold text-white mb-4">Loja</h1>
        
        <CustomInput 
          isSearch 
          placeholder="Buscar produtos" 
          onClick={() => navigate('/marketplace/products')} 
          className="mb-2 cursor-pointer" 
          readOnly 
        />
      </div>
      
      {/* Segment blocks */}
      <div className="p-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-bold text-lg">Categorias</h2>
          {error && segments.length > 0 && (
            <button 
              onClick={handleRetry}
              className="text-sm text-construPro-blue hover:underline"
            >
              Atualizar
            </button>
          )}
        </div>
        
        {/* Grid responsivo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Render segments from database */}
          {segments.map(segment => (
            <div 
              key={segment.id} 
              className="cursor-pointer" 
              onClick={() => handleCategoryClick(segment.id)}
            >
              <div className="relative h-40 rounded-lg overflow-hidden shadow-md bg-gray-200">
                {/* Imagem ou gradiente de fallback */}
                <div className="absolute inset-0">
                  {segment.image_url ? (
                    <img
                      src={segment.image_url}
                      alt={`Categoria ${segment.nome}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        // Fallback para gradiente se imagem falhar
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  
                  {/* Gradiente de fallback */}
                  <div className={`w-full h-full bg-gradient-to-br from-construPro-blue to-construPro-blue/80 flex items-center justify-center ${segment.image_url ? 'hidden' : ''}`}>
                    <div className="text-white text-4xl">
                      {getIconForSegment(segment.nome)}
                    </div>
                  </div>
                </div>
                
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                
                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-3 flex flex-col items-start">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mb-2 shadow-md">
                    <span className="text-construPro-blue">
                      {getIconForSegment(segment.nome)}
                    </span>
                  </div>
                  <span className="text-white font-medium">{segment.nome}</span>
                </div>
              </div>
            </div>
          ))}
          
          {/* Ver todos segment */}
          <div className="cursor-pointer" onClick={() => navigate('/marketplace/products')}>
            <div className="relative h-40 rounded-lg overflow-hidden shadow-md bg-gradient-to-br from-construPro-orange to-construPro-orange/80">
              <div className="absolute bottom-0 left-0 right-0 p-3 flex flex-col items-start">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mb-2 shadow-md">
                  <span className="text-construPro-blue">
                    <ShoppingBag size={24} />
                  </span>
                </div>
                <span className="text-white font-medium">Ver todos</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Promotional banner */}
      <div className="mx-4 mt-3 bg-construPro-orange/10 p-4 rounded-lg">
        <h3 className="text-construPro-orange font-bold mb-1">Ofertas especiais</h3>
        <p className="text-sm text-gray-600">
          Acumule pontos em todas as compras e troque por produtos exclusivos!
        </p>
      </div>
    </div>
  );
};

export default MarketplaceHomeScreen;
