
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomInput from '../common/CustomInput';
import { ShoppingBag } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import LoadingState from '../common/LoadingState';
import ErrorState from '../common/ErrorState';
import { getProductSegments, ProductSegment } from '@/services/admin/productSegmentsService';
import { useSegmentImageCache } from '@/hooks/useSegmentImageCache';
import { useSegmentPreloader } from '@/hooks/useSegmentPreloader';
import OptimizedSegmentCard from '@/components/common/OptimizedSegmentCard';

// Import store data
import stores from '@/data/lojas.json';

const MarketplaceHomeScreen: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [storeData, setStoreData] = useState<any[]>(stores);
  const [segments, setSegments] = useState<ProductSegment[]>([]);
  const [retryCount, setRetryCount] = useState(0);
  const { getCachedSegmentImage, cacheSegmentImage } = useSegmentImageCache();
  
  // Precarregar imagens de segmentos
  useSegmentPreloader();

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

  // Fetch segments with retry functionality
  const fetchSegmentsWithRetry = async (attempt: number = 1) => {
    try {
      console.log(`🔄 [MarketplaceHomeScreen] Tentativa ${attempt} de carregar segmentos...`);
      setLoading(true);
      setError(null);

      // Fetch segments from database with timeout handling
      const segmentsData = await getProductSegments();
      console.log('[MarketplaceHomeScreen] Segmentos carregados:', segmentsData.length);
        
      // Cache images for active segments
      const activeSegments = segmentsData.filter(segment => segment.status === 'ativo');
      activeSegments.forEach(segment => {
        if (segment.image_url) {
          cacheSegmentImage(segment.id, segment.image_url);
        }
      });
        
      setSegments(activeSegments);
      setRetryCount(0);
    } catch (err) {
      console.error(`❌ [MarketplaceHomeScreen] Erro na tentativa ${attempt}:`, err);
      
      if (attempt < 3) {
        // Retry with exponential backoff
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        console.log(`⏳ [MarketplaceHomeScreen] Tentando novamente em ${delay}ms...`);
        
        setTimeout(() => {
          setRetryCount(attempt);
          fetchSegmentsWithRetry(attempt + 1);
        }, delay);
      } else {
        console.error('💥 [MarketplaceHomeScreen] Todas as tentativas falharam');
        setError('Erro ao carregar segmentos. Verifique sua conexão.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch segments on component mount
  useEffect(() => {
    fetchSegmentsWithRetry(1);
  }, [cacheSegmentImage]);

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
    fetchSegmentsWithRetry(1);
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
            text={retryCount > 0 ? `Tentativa ${retryCount + 1} - Carregando segmentos...` : "Carregando segmentos..."} 
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
          <h2 className="font-bold text-lg">Segmentos</h2>
          {error && segments.length > 0 && (
            <button 
              onClick={handleRetry}
              className="text-sm text-construPro-blue hover:underline"
            >
              Atualizar
            </button>
          )}
        </div>
        
        {/* Mobile: single column - Desktop: responsive grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Render segments from database using OptimizedSegmentCard */}
          {segments.map(segment => (
            <div 
              key={segment.id} 
              className="cursor-pointer" 
              onClick={() => handleCategoryClick(segment.id)}
            >
              <div 
                className="relative h-40 rounded-lg overflow-hidden shadow-md bg-gray-200"
              >
                {/* Optimized segment card content */}
                <div className="absolute inset-0">
                  {getCachedSegmentImage(segment.id) || segment.image_url ? (
                    <img
                      src={getCachedSegmentImage(segment.id) || segment.image_url!}
                      alt={`Imagem do segmento ${segment.nome}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-construPro-blue to-construPro-blue/80 flex items-center justify-center">
                      <div className="text-white text-4xl">
                        {getIconForSegment(segment.nome)}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Gradient overlay for better text visibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                
                {/* Content positioned at bottom */}
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
            <div 
              className="relative h-40 rounded-lg overflow-hidden shadow-md bg-gradient-to-br from-construPro-orange to-construPro-orange/80"
            >
              {/* Content positioned at bottom */}
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
