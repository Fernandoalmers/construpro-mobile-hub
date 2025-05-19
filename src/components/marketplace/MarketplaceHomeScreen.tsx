
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import CustomInput from '../common/CustomInput';
import { 
  Search, 
  Box, 
  Plug, 
  GlassWater, 
  Hammer, 
  UserPlus, 
  ShoppingBag,
  Construction
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import LoadingState from '../common/LoadingState';
import ErrorState from '../common/ErrorState';

// Import store data
import stores from '@/data/lojas.json';

// Map categories to segment IDs for navigation
const segmentIdMap = {
  'Materiais de Construção': '2d77d6f2-11fe-4d2f-a98d-aed3c5a0766f',
  'Materiais Elétricos': '4d5a7b8c-12ab-3e4f-b98d-cfe4d6a7b5c3', 
  'Vidraçaria': '9b2c3d4e-5f6a-7b8c-9d0e-1f2a3b4c5d6e',
  'Marmoraria': 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  'Aluguel': 'd4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a'
};

// Updated segment blocks list with segmento_id included
const segmentBlocks = [
  {
    id: 'materiais-construcao',
    name: 'Materiais de Construção',
    icon: <Construction size={24} />,
    filter: { 
      categoria: 'Materiais de Construção',
      segmento_id: '2d77d6f2-11fe-4d2f-a98d-aed3c5a0766f' // Using the mapped ID
    }
  },
  {
    id: 'materiais-eletricos',
    name: 'Material Elétrico',
    icon: <Plug size={24} />,
    filter: { 
      categoria: 'Materiais Elétricos',
      segmento_id: '4d5a7b8c-12ab-3e4f-b98d-cfe4d6a7b5c3' 
    }
  },
  {
    id: 'vidracaria',
    name: 'Vidraçaria',
    icon: <GlassWater size={24} />,
    filter: { 
      categoria: 'Vidraçaria',
      segmento_id: '9b2c3d4e-5f6a-7b8c-9d0e-1f2a3b4c5d6e' 
    }
  },
  {
    id: 'marmoraria',
    name: 'Marmoraria',
    icon: <Box size={24} />,
    filter: { 
      categoria: 'Marmoraria',
      segmento_id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d' 
    }
  },
  {
    id: 'aluguel',
    name: 'Aluguel de Equipamentos',
    icon: <Hammer size={24} />,
    filter: { 
      categoria: 'Aluguel',
      segmento_id: 'd4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a' 
    }
  },
  {
    id: 'profissionais',
    name: 'Profissionais',
    icon: <UserPlus size={24} />,
    filter: { type: 'professionals' }
  },
  {
    id: 'todos',
    name: 'Ver todos',
    icon: <ShoppingBag size={24} />,
    filter: {}
  }
];

const MarketplaceHomeScreen: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [storeData, setStoreData] = useState<any[]>(stores);

  // Use real store images if available
  const segmentImages: Record<string, string> = {
    'materiais-construcao': '/lovable-uploads/1b629f74-0778-46a1-bb6a-4c30301e733e.png',
    'materiais-eletricos': storeData.find(s => s.categorias?.includes('Elétrica'))?.logoUrl || 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=300',
    'vidracaria': storeData.find(s => s.categorias?.includes('Vidraçaria'))?.logoUrl || 'https://images.unsplash.com/photo-1496307653780-42ee777d4833?auto=format&fit=crop&w=300',
    'marmoraria': storeData.find(s => s.categorias?.includes('Marmoraria'))?.logoUrl || 'https://images.unsplash.com/photo-1466442929976-97f336a657be?auto=format&fit=crop&w=300',
    'aluguel': storeData.find(s => s.categorias?.includes('Aluguel'))?.logoUrl || 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=300',
    'profissionais': 'https://images.unsplash.com/photo-1521791055366-0d553872125f?auto=format&fit=crop&w=300',
    'todos': 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=300'
  };

  useEffect(() => {
    const fetchStores = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('stores')
          .select('*');
          
        if (error) throw error;
        
        if (data && data.length > 0) {
          setStoreData(data);
        }
        
      } catch (err) {
        console.error('Error fetching stores:', err);
        setError('Falha ao carregar lojas. Por favor, tente novamente.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchStores();
  }, []);

  const handleCategoryClick = (filter: any) => {
    if (filter.type === 'professionals') {
      navigate('/services');
      return;
    }
    
    // Navigate to marketplace with filter parameters
    const queryParams = new URLSearchParams();
    
    if (filter.categoria) {
      queryParams.append('categoria', filter.categoria);
    }
    
    // Add segment_id to URL parameters if available
    if (filter.segmento_id) {
      queryParams.append('segmento_id', filter.segmento_id);
      console.log(`[MarketplaceHomeScreen] Navigating to marketplace with segment_id: ${filter.segmento_id}`);
    }
    
    navigate(`/marketplace/products?${queryParams.toString()}`);
  };

  if (loading) {
    return <LoadingState text="Carregando segmentos..." />;
  }

  if (error) {
    return <ErrorState title="Erro" message={error} />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-construPro-blue p-4 pt-8">
        <h1 className="text-2xl font-bold text-white mb-4">Loja</h1>
        
        <CustomInput
          isSearch
          placeholder="Buscar produtos"
          onClick={() => navigate('/marketplace/products')}
          className="mb-2 cursor-pointer"
          readOnly
        />
      </div>
      
      {/* Segment blocks - redesigned for more elegance */}
      <div className="p-4">
        <h2 className="font-bold text-lg mb-3">Segmentos</h2>
        
        <div className="grid grid-cols-2 gap-4">
          {segmentBlocks.map((segment) => (
            <div 
              key={segment.id}
              className="cursor-pointer"
              onClick={() => handleCategoryClick(segment.filter)}
            >
              <div 
                className="relative h-40 rounded-lg overflow-hidden shadow-md"
                style={{ 
                  backgroundImage: `url(${segmentImages[segment.id]})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                {/* Gradient overlay for better text visibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                
                {/* Content positioned at bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-3 flex flex-col items-start">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mb-2 shadow-md">
                    <span className="text-construPro-blue">
                      {segment.icon}
                    </span>
                  </div>
                  <span className="text-white font-medium">{segment.name}</span>
                </div>
              </div>
            </div>
          ))}
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
