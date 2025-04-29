
import React from 'react';
import Card from '../common/Card';
import { Badge } from '@/components/ui/badge';
import { Lock } from 'lucide-react';

interface ResgateProps {
  id: string;
  titulo: string;
  pontos: number;
  categoria: string;
  imagemUrl: string;
}

interface ResgateCardProps {
  resgate: ResgateProps;
  disabled?: boolean;
  onClick?: () => void;
}

const ResgateCard: React.FC<ResgateCardProps> = ({ resgate, disabled = false, onClick }) => {
  return (
    <Card 
      className={`overflow-hidden flex flex-col ${disabled ? 'opacity-70' : ''}`}
      onClick={disabled ? undefined : onClick}
    >
      <div className="relative h-32 bg-gray-200">
        <img 
          src={resgate.imagemUrl} 
          alt={resgate.titulo} 
          className="w-full h-full object-cover"
        />
        <Badge className="absolute top-2 right-2 bg-construPro-blue">
          {resgate.categoria}
        </Badge>
        {disabled && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <div className="bg-black/70 w-10 h-10 rounded-full flex items-center justify-center">
              <Lock size={20} className="text-white" />
            </div>
          </div>
        )}
      </div>
      
      <div className="p-3 flex-1 flex flex-col">
        <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">{resgate.titulo}</h3>
        
        <div className="mt-auto">
          <div className="bg-construPro-orange/10 text-construPro-orange rounded-full px-3 py-1 text-sm font-medium text-center">
            {resgate.pontos} pontos
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ResgateCard;
