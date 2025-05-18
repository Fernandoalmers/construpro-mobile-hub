
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Construction, Zap, GlassWater, Square, Truck, Wrench, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getProductSegments } from '@/services/admin/productSegmentsService';
import { supabase } from '@/integrations/supabase/client';

interface SegmentCardProps {
  icon: React.ReactNode;
  title: string;
  id: string;
  onClick: (segmentId: string) => void;
  isSelected?: boolean;
}

const SegmentCard: React.FC<SegmentCardProps> = ({
  icon,
  title,
  id,
  onClick,
  isSelected = false
}) => {
  return (
    <div 
      className={cn(
        "flex flex-col items-center p-3 rounded-lg cursor-pointer transition-all", 
        isSelected ? "bg-construPro-blue text-white" : "bg-white hover:bg-gray-50"
      )} 
      onClick={() => onClick(id)}
    >
      <div className={cn(
        "w-12 h-12 rounded-full flex items-center justify-center mb-2", 
        isSelected ? "bg-white text-construPro-blue" : "bg-construPro-blue/10 text-construPro-blue"
      )}>
        {icon}
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
  const [segments, setSegments] = useState<Array<{id: string, nome: string}>>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchSegments = async () => {
      try {
        const segmentsData = await getProductSegments();
        console.log('Fetched segments:', segmentsData);
        setSegments(segmentsData);
      } catch (error) {
        console.error('Error fetching segments:', error);
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
      return <Construction size={24} />; // Default icon
    }
  };

  if (loading) {
    return (
      <div className="w-full overflow-x-auto pb-2">
        <div className="flex space-x-4 px-4">
          {[1, 2, 3, 4].map((i) => (
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
      <div className="flex space-x-4 px-4 py-2">
        {segments.map((segment) => (
          <SegmentCard
            key={segment.id}
            id={segment.id}
            title={segment.nome}
            icon={getIconForSegment(segment.nome)}
            onClick={onSegmentClick}
            isSelected={selectedSegment === segment.id}
          />
        ))}
        <SegmentCard
          id="all"
          title="Todos"
          icon={<ShoppingBag size={24} />}
          onClick={() => onSegmentClick("all")}
          isSelected={selectedSegment === "all" || !selectedSegment}
        />
      </div>
    </div>
  );
};

export default SegmentCardsHeader;
