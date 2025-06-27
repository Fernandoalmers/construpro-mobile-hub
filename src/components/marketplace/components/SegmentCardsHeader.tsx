import React, { useEffect, useState } from 'react';
import { Construction, Zap, GlassWater, Square, Truck, Wrench, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getProductSegments, ProductSegment } from '@/services/admin/productSegmentsService';
import { toast } from '@/components/ui/sonner';

interface SegmentCardProps {
  icon: React.ReactNode;
  title: string;
  id: string;
  imageUrl?: string | null;
  onClick: (segmentId: string) => void;
  isSelected?: boolean;
}

const SegmentCard: React.FC<SegmentCardProps> = ({
  icon,
  title,
  id,
  imageUrl,
  onClick,
  isSelected = false
}) => {
  const [imageError, setImageError] = useState(false);
  
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
    } else if (nameToLower.includes('profissional') || nameToLower.includes('serviço')) {
      return 'https://images.unsplash.com/photo-1521791055366-0d553872125f?auto=format&fit=crop&w=300';
    }
    return null;
  };

  const handleImageError = () => {
    console.error(`[SegmentCard] ${title} - Image failed to load:`, imageUrl);
    setImageError(true);
  };

  const handleImageLoad = () => {
    console.log(`[SegmentCard] ${title} - Image loaded successfully`);
  };

  // Usar imagem do banco ou fallback
  const finalImageUrl = imageUrl || getFallbackImage(title);
  const shouldShowImage = finalImageUrl && !imageError;
  
  console.log(`[SegmentCard] ${title} - Using image:`, finalImageUrl);
  
  return (
    <div 
      className={cn(
        "flex flex-col items-center p-3 rounded-lg cursor-pointer transition-all min-w-[80px]", 
        isSelected ? "bg-construPro-blue text-white" : "bg-white hover:bg-gray-50"
      )} 
      onClick={() => onClick(id)}
    >
      <div className={cn(
        "w-12 h-12 rounded-full flex items-center justify-center mb-2 overflow-hidden", 
        isSelected ? "bg-white text-construPro-blue" : "bg-construPro-blue/10 text-construPro-blue"
      )}>
        {shouldShowImage ? (
          <img 
            src={finalImageUrl} 
            alt={`Imagem do segmento ${title}`} 
            className="w-full h-full object-cover rounded-full" 
            onError={handleImageError}
            onLoad={handleImageLoad}
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full">
            {icon}
          </div>
        )}
      </div>
      <span className="text-xs font-medium text-center">{title}</span>
    </div>
  );
};

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

  // Debug log to confirm component is loading
  console.log('[SegmentCardsHeader] Component loaded - checking layout responsiveness');

  useEffect(() => {
    const fetchSegments = async () => {
      try {
        console.log('[SegmentCardsHeader] Fetching segments...');
        const segmentsData = await getProductSegments();
        console.log('[SegmentCardsHeader] Raw segments data:', segmentsData);
        
        // Filter active segments and log image info
        const activeSegments = segmentsData.filter(segment => {
          const isActive = segment.status === 'ativo';
          console.log(`[SegmentCardsHeader] Segment ${segment.nome}: active=${isActive}, image_url=${segment.image_url}`);
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
  }, []);

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
            <div key={i} className="animate-pulse flex flex-col items-center min-w-[80px]">
              <div className="w-12 h-12 rounded-full bg-gray-200 mb-2"></div>
              <div className="w-16 h-3 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
        
        {/* Desktop: grid layout */}
        <div className="hidden md:grid grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4 px-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="animate-pulse flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-gray-200 mb-2"></div>
              <div className="w-16 h-3 bg-gray-200 rounded"></div>
            </div>
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
          <SegmentCard
            key={segment.id}
            id={segment.id}
            title={segment.nome}
            imageUrl={segment.image_url}
            icon={segment.id === "all" ? <ShoppingBag size={24} /> : getIconForSegment(segment.nome)}
            onClick={onSegmentClick}
            isSelected={segment.id === "all" ? (selectedSegment === null || selectedSegment === "all") : selectedSegment === segment.id}
          />
        ))}
      </div>
      
      {/* Desktop: grid layout - Hidden on mobile */}
      <div className="hidden md:grid grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4 px-4 py-3">
        {allSegments.map(segment => (
          <SegmentCard
            key={segment.id}
            id={segment.id}
            title={segment.nome}
            imageUrl={segment.image_url}
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
