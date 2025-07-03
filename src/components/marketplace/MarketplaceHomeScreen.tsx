
import React, { Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import CustomInput from '../common/CustomInput';
import LoadingState from '../common/LoadingState';
import ErrorState from '../common/ErrorState';
import SegmentCard from './components/SegmentCard';
import { useMarketplaceSegments } from '@/hooks/useMarketplaceSegments';
import { useConnectivityDiagnostic } from '@/hooks/useConnectivityDiagnostic';

// Componente de conteúdo com Suspense para carregamento suave
const MarketplaceContent: React.FC = () => {
  const navigate = useNavigate();
  const { data: segments, isLoading, error, refetch } = useMarketplaceSegments();
  const { isOnline, supabaseHealthy } = useConnectivityDiagnostic();

  console.log('🔄 [MarketplaceContent] Renderizando com:', {
    segmentsCount: segments?.length || 0,
    isLoading,
    isOnline,
    supabaseHealthy
  });


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
    console.log('🔄 [MarketplaceContent] Tentando novamente...');
    refetch();
  };

  // Mostrar erro apenas se não há dados de fallback e conexão falhou
  if (error && (!segments || segments.length === 0) && !isOnline) {
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
            message="Verifique sua conexão com a internet"
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
        
        {/* Grid responsivo com loading indicator */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Indicador de conectividade se necessário */}
          {!supabaseHealthy && segments && segments.length > 0 && (
            <div className="col-span-full mb-2">
              <div className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded flex items-center">
                ⚠️ Modo offline - mostrando dados em cache
              </div>
            </div>
          )}
          
          {/* Render segments usando o novo componente */}
          {segments && segments.map(segment => (
            <SegmentCard
              key={segment.id}
              segment={segment}
              onClick={() => handleCategoryClick(segment.id)}
            />
          ))}
          
          {/* Ver todos segment */}
          <div 
            className="cursor-pointer transform transition-transform duration-200 hover:scale-105" 
            onClick={() => navigate('/marketplace/products')}
          >
            <div className="relative h-40 rounded-lg overflow-hidden shadow-md bg-gradient-to-br from-construPro-orange to-construPro-orange/80">
              <div className="absolute bottom-0 left-0 right-0 p-3 flex flex-col items-start z-10">
                <div className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center mb-2 shadow-lg">
                  <span className="text-construPro-blue">
                    <ShoppingBag size={24} />
                  </span>
                </div>
                <span className="text-white font-medium text-sm drop-shadow-md">Ver todos</span>
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

// Componente principal com Suspense
const MarketplaceHomeScreen: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Suspense 
      fallback={
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
              type="skeleton"
              count={4}
            />
          </div>
        </div>
      }
    >
      <MarketplaceContent />
    </Suspense>
  );
};

export default MarketplaceHomeScreen;
