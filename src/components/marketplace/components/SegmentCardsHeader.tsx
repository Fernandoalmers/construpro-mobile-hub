
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Construction, 
  Zap, 
  Glasses, 
  Square, 
  Truck, 
  Wrench 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SegmentCardProps {
  icon: React.ReactNode;
  title: string;
  id: string;
  onClick: (segmentId: string) => void;
  isSelected?: boolean;
}

const SegmentCard: React.FC<SegmentCardProps> = ({ icon, title, id, onClick, isSelected = false }) => {
  return (
    <div 
      className={cn(
        "flex flex-col items-center p-3 rounded-lg cursor-pointer transition-all",
        isSelected 
          ? "bg-construPro-blue text-white" 
          : "bg-white hover:bg-gray-50"
      )}
      onClick={() => onClick(id)}
    >
      <div className={cn(
        "w-12 h-12 rounded-full flex items-center justify-center mb-2",
        isSelected 
          ? "bg-white text-construPro-blue" 
          : "bg-construPro-blue/10 text-construPro-blue"
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

const SegmentCardsHeader: React.FC<SegmentCardsHeaderProps> = ({ selectedSegment, onSegmentClick }) => {
  const segments = [
    { id: 'materiais', title: 'Materiais de Construção', icon: <Construction size={24} /> },
    { id: 'eletrica', title: 'Elétrica', icon: <Zap size={24} /> },
    { id: 'vidracaria', title: 'Vidraçaria', icon: <Glasses size={24} /> },
    { id: 'marmoraria', title: 'Marmoraria', icon: <Square size={24} /> },
    { id: 'aluguel', title: 'Aluguel de Equip.', icon: <Truck size={24} /> },
    { id: 'profissionais', title: 'Profissionais', icon: <Wrench size={24} /> },
  ];

  return (
    <div className="bg-gray-100 p-4">
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {segments.map((segment) => (
          <SegmentCard 
            key={segment.id}
            id={segment.id}
            icon={segment.icon}
            title={segment.title}
            onClick={onSegmentClick}
            isSelected={selectedSegment === segment.id}
          />
        ))}
      </div>
    </div>
  );
};

export default SegmentCardsHeader;
