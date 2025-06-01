import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import CustomInput from '../common/CustomInput';
import { Search, Box, Plug, GlassWater, Hammer, ShoppingBag, Construction } from 'lucide-react';
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

  // Fetch segments on component mount to get real segment data with images
  useEffect(() => {
    const fetchSegments = async () => {
      try {
        setLoading(true);

        // Fetch segments from database with images
        const segmentsData = await getProductSegments();
        console.log('[MarketplaceHomeScreen] Fetched segments:', segmentsData);
        setSegments(segmentsData);
      } catch (err) {
        console.error('Error fetching segments:', err);
        setError('Falha ao carregar segmentos. Por favor, tente novamente.');
      } finally {
        setLoading(false);
      }
    };
    fetchSegments();
  }, []);
  useEffect(() => {
    const fetchStores = async () => {
      try {
        const {
          data,
          error
        } = await supabase.from('stores').select('*');
        if (error) throw error;
        if (data && data.length > 0) {
          setStoreData(data);
        }
      } catch (err) {
        console.error('Error fetching stores:', err);
        setError('Falha ao carregar lojas. Por favor, tente novamente.');
      }
    };
    fetchStores();
  }, []);

  // Fallback images para segmentos sem imagem no banco
  const getFallbackImage = (segmentName: string) => {
    const nameToLower = segmentName.toLowerCase();
    if (nameToLower.includes('material') && nameToLower.includes('constru')) {
      return '/lovable-uploads/1b629f74-0778-46a1-bb6a-4c30301e733e.png';
    } else if (nameToLower.includes('elétri') || nameToLower.includes('eletri')) {
      return 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=300';
    } else if (nameToLower.includes('vidro') || nameToLower.includes('vidraç')) {
      return 'https://images.unsplash.com/photo-1496307653780-42ee777d4833?auto=format&fit=crop&w=300';
    } else if (nameToLower.includes('marmor')) {
      return 'https://images.unsplash.com/photo-1466442929976-97f336a657be?auto=format&fit=crop&w=300';
    } else if (nameToLower.includes('aluguel') || nameToLower.includes('equipamento')) {
      return 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=300';
    }
    return 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=300'; // Default fallback
  };

  // Map segment names to icons
  const getIconForSegment = (segmentName: string) => {
    const nameToLower = segmentName.toLowerCase();
    if (nameToLower.includes('material') && nameToLower.includes('constru')) {
      return <Construction size={24} />;
    } else if (nameToLower.includes('elétri') || nameToLower.includes('eletri')) {
      return <Plug size={24} />;
    } else if (nameToLower.includes('vidro') || nameToLower.includes('vidraç')) {
      return <GlassWater size={24} />;
    } else if (nameToLower.includes('marmor')) {
      return <Box size={24} />;
    } else if (nameToLower.includes('aluguel') || nameToLower.includes('equipamento')) {
      return <Hammer size={24} />;
    } else {
      return <ShoppingBag size={24} />;
    }
  };
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
  if (loading) {
    return <LoadingState text="Carregando segmentos..." />;
  }
  if (error) {
    return <ErrorState title="Erro" message={error} />;
  }
  return <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="p-4 pt-8 bg-construPro-orange">
        <h1 className="text-2xl font-bold text-white mb-4">Loja</h1>
        
        <CustomInput isSearch placeholder="Buscar produtos" onClick={() => navigate('/marketplace/products')} className="mb-2 cursor-pointer" readOnly />
      </div>
      
      {/* Segment blocks */}
      <div className="p-4">
        <h2 className="font-bold text-lg mb-3">Segmentos</h2>
        
        <div className="grid grid-cols-1 gap-4">
          {/* Render segments from database */}
          {segments.filter(segment => segment.status === 'ativo').map(segment => {
          // Use image from database or fallback
          const imageUrl = segment.image_url || getFallbackImage(segment.nome);
          return <div key={segment.id} className="cursor-pointer" onClick={() => handleCategoryClick(segment.id)}>
                <div className="relative h-40 rounded-lg overflow-hidden shadow-md" style={{
              backgroundImage: `url(${imageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}>
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
              </div>;
        })}
          
          {/* Ver todos segment */}
          <div className="cursor-pointer" onClick={() => navigate('/marketplace/products')}>
            <div className="relative h-40 rounded-lg overflow-hidden shadow-md" style={{
            backgroundImage: `url(${getFallbackImage('todos')})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}>
              {/* Gradient overlay for better text visibility */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              
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
    </div>;
};
export default MarketplaceHomeScreen;