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
  
  useEffect(() => {
    if (imageUrl) {
      console.log(`[SegmentCard] ${title} - Image URL:`, imageUrl);
      setImageError(false);
    }
  }, [imageUrl, title]);

  const handleImageError = () => {
    console.error(`[SegmentCard] ${title} - Image failed to load:`, imageUrl);
    setImageError(true);
  };

  const handleImageLoad = () => {
    console.log(`[SegmentCard] ${title} - Image loaded successfully:`, imageUrl);
  };

  // Determinar se deve mostrar a imagem ou o ícone
  const shouldShowImage = imageUrl && !imageError;
  
  return (
    <div 
      className={cn(
        "flex flex-col items-center p-3 rounded-lg cursor-pointer transition-all", 
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
            src={imageUrl} 
            alt={title} 
            className="w-full h-full object-cover" 
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
}

const SegmentCardsHeader: React.FC<SegmentCardsHeaderProps> = ({
  selectedSegment,
  onSegmentClick
}) => {
  const [segments, setSegments] = useState<ProductSegment[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="w-full overflow-x-auto pb-2">
        <div className="flex space-x-4 px-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="animate-pulse flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-gray-200 mb-2"></div>
              <div className="w-16 h-3 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto pb-2">
      <div className="flex space-x-4 px-4 py-3">
        {/* "Todos" segment card */}
        <SegmentCard
          key="all"
          id="all"
          title="Todos"
          icon={<ShoppingBag size={24} />}
          onClick={onSegmentClick}
          isSelected={selectedSegment === null || selectedSegment === "all"}
        />
        
        {/* Render all segments from the database */}
        {segments.map(segment => (
          <SegmentCard
            key={segment.id}
            id={segment.id}
            title={segment.nome}
            imageUrl={segment.image_url}
            icon={getIconForSegment(segment.nome)}
            onClick={onSegmentClick}
            isSelected={selectedSegment === segment.id}
          />
        ))}
      </div>
    </div>
  );
};

export default SegmentCardsHeader;
