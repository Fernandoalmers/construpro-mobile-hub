
import React, { useEffect, useState } from 'react';
import { Construction, Zap, GlassWater, Square, Truck, Wrench, ShoppingBag } from 'lucide-react';
import { getProductSegments, ProductSegment } from '@/services/admin/productSegmentsService';
import { useSegmentImageCache } from '@/hooks/useSegmentImageCache';
import OptimizedSegmentCard from '@/components/common/OptimizedSegmentCard';
import { toast } from '@/components/ui/sonner';

interface SegmentCardsHeaderProps {
  selectedSegment: string | null;
  onSegmentClick: (segmentId: string) => void;
  showSegmentCards?: boolean;
}

const SegmentCardsHeader: React.FC<SegmentCardsHeaderProps> = ({
  selectedSegment,
  onSegmentClick,
  showSegmentCards = true
}) => {
  const [segments, setSegments] = useState<ProductSegment[]>([]);
  const [loading, setLoading] = useState(true);
  const { getCachedSegmentImage, cacheSegmentImage } = useSegmentImageCache();

  // Debug log to confirm component is loading
  console.log('[SegmentCardsHeader] Component loaded - checking layout responsiveness');

  useEffect(() => {
    const fetchSegments = async () => {
      try {
        console.log('[SegmentCardsHeader] Fetching segments...');
        const segmentsData = await getProductSegments();
        console.log('[SegmentCardsHeader] Raw segments data:', segmentsData);
        
        // Filter active segments and process cache
        const activeSegments = segmentsData.filter(segment => {
          const isActive = segment.status === 'ativo';
          console.log(`[SegmentCardsHeader] Segment ${segment.nome}: active=${isActive}, image_url=${segment.image_url}`);
          
          // Cache da imagem se disponível
          if (isActive && segment.image_url) {
            cacheSegmentImage(segment.id, segment.image_url);
          }
          
          return isActive;
        });
        
        console.log('[SegmentCardsHeader] Active segments:', activeSegments);
        setSegments(activeSegments);
      } catch (error) {
        console.error('[SegmentCardsHeader] Error fetching segments:', error);
        toast.error('Erro ao carregar segmentos');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSegments();
  }, [cacheSegmentImage]);

  // Map segment names to icons
  const getIconForSegment = (segmentName: string) => {
    const nameToLower = segmentName.toLowerCase();
    if (nameToLower.includes('material') && nameToLower.includes('constru')) {
      return <Construction size={24} />;
    } else if (nameToLower.includes('elétrica') || nameToLower.includes('eletrica')) {
      return <Zap size={24} />;
    } else if (nameToLower.includes('vidro') || nameToLower.includes('vidraçaria')) {
      return <GlassWater size={24} />;
    } else if (nameToLower.includes('marmor')) {
      return <Square size={24} />;
    } else if (nameToLower.includes('aluguel') || nameToLower.includes('equipamento')) {
      return <Truck size={24} />;
    } else if (nameToLower.includes('profissional') || nameToLower.includes('serviço')) {
      return <Wrench size={24} />;
    } else {
      return <ShoppingBag size={24} />;
    }
  };

  // Se showSegmentCards for false, não renderizar nada
  if (!showSegmentCards) {
    return null;
  }

  if (loading) {
    return (
      <div className="w-full pb-2">
        {/* Mobile: scroll horizontal */}
        <div className="flex md:hidden space-x-4 px-4 overflow-x-auto">
          {[1, 2, 3, 4].map(i => (
            <OptimizedSegmentCard
              key={`mobile-skeleton-${i}`}
              id={`skeleton-${i}`}
              title=""
              icon={<ShoppingBag size={24} />}
              onClick={() => {}}
              showSkeleton={true}
              className="min-w-[80px]"
            />
          ))}
        </div>
        
        {/* Desktop: grid layout */}
        <div className="hidden md:grid grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4 px-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <OptimizedSegmentCard
              key={`desktop-skeleton-${i}`}
              id={`skeleton-${i}`}
              title=""
              icon={<ShoppingBag size={24} />}
              onClick={() => {}}
              showSkeleton={true}
            />
          ))}
        </div>
      </div>
    );
  }

  const allSegments = [
    {
      id: "all",
      nome: "Todos",
      image_url: null,
      status: 'ativo' as const
    },
    ...segments
  ];

  return (
    <div className="w-full pb-2">
      {/* Mobile: horizontal scroll layout - Hidden on desktop */}
      <div className="flex md:hidden space-x-4 px-4 py-3 overflow-x-auto">
        {allSegments.map(segment => (
          <OptimizedSegmentCard
            key={segment.id}
            id={segment.id}
            title={segment.nome}
            imageUrl={getCachedSegmentImage(segment.id) || segment.image_url}
            icon={segment.id === "all" ? <ShoppingBag size={24} /> : getIconForSegment(segment.nome)}
            onClick={onSegmentClick}
            isSelected={segment.id === "all" ? (selectedSegment === null || selectedSegment === "all") : selectedSegment === segment.id}
            className="min-w-[80px]"
          />
        ))}
      </div>
      
      {/* Desktop: grid layout - Hidden on mobile */}
      <div className="hidden md:grid grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4 px-4 py-3">
        {allSegments.map(segment => (
          <OptimizedSegmentCard
            key={segment.id}
            id={segment.id}
            title={segment.nome}
            imageUrl={getCachedSegmentImage(segment.id) || segment.image_url}
            icon={segment.id === "all" ? <ShoppingBag size={24} /> : getIconForSegment(segment.nome)}
            onClick={onSegmentClick}
            isSelected={segment.id === "all" ? (selectedSegment === null || selectedSegment === "all") : selectedSegment === segment.id}
          />
        ))}
      </div>
    </div>
  );
};

export default SegmentCardsHeader;
