
import React from 'react';
import Card from '../common/Card';
import { Badge } from '@/components/ui/badge';
import { Gift, ChevronRight, Lock } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface ResgateProps {
  id: string;
  titulo: string;
  pontos: number;
  categoria: string;
  imagemUrl: string;
  descricao?: string;
}

interface ResgateCardProps {
  resgate: ResgateProps;
  userPoints: number;
  onClick?: () => void;
}

const ResgateCard: React.FC<ResgateCardProps> = ({ resgate, userPoints, onClick }) => {
  const isAvailable = userPoints >= resgate.pontos;
  const percentComplete = Math.min(100, Math.max(0, (userPoints / resgate.pontos) * 100));
  const navigate = useNavigate();
  
  const handleClick = () => {
    // If a custom onClick handler is provided, use it
    if (onClick) {
      onClick();
      return;
    }
    
    // Otherwise, navigate to the reward detail page
    navigate(`/resgate/${resgate.id}`);
  };

  const handleResgateClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the card's onClick
    
    if (isAvailable) {
      // Navigate to the reward detail page for redemption
      navigate(`/resgate/${resgate.id}`);
    }
  };
  
  return (
    <Card 
      className="overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-all rounded-xl cursor-pointer h-full"
      onClick={handleClick}
    >
      <div className="flex flex-col h-full min-h-80">
        {/* Enhanced image area with WHITE background - Responsive */}
        <div className="w-full h-32 md:h-36 bg-white flex items-center justify-center relative flex-shrink-0">
          <img 
            src={resgate.imagemUrl} 
            alt={resgate.titulo} 
            className="w-full h-full object-contain p-3 transition-all duration-200 hover:scale-105"
            onError={(e) => {
              e.currentTarget.src = 'https://via.placeholder.com/200x150?text=Recompensa';
            }}
          />
          {/* Enhanced badge position and styling */}
          <Badge className="absolute top-2 left-2 bg-construPro-blue text-white text-xs font-medium px-2 py-0.5 rounded-md shadow-sm">
            {resgate.categoria}
          </Badge>
        </div>
        
        {/* Enhanced information layout - Flexible */}
        <div className="p-3 md:p-4 flex flex-col justify-between flex-grow">
          <div className="flex-grow">
            {/* Added product type label */}
            <div className="mb-2">
              <span className="text-xs font-medium text-construPro-orange bg-orange-50 px-2 py-0.5 rounded-full">
                Recompensa
              </span>
            </div>
            
            {/* Improved typography */}
            <h3 className="font-semibold text-gray-900 line-clamp-2 text-sm mb-2 leading-tight">{resgate.titulo}</h3>
            
            {/* Description with better styling */}
            {resgate.descricao && (
              <p className="text-xs text-gray-500 line-clamp-2 mb-2 leading-relaxed">{resgate.descricao}</p>
            )}
          </div>
          
          {/* Enhanced points display and progress section */}
          <div className="mt-auto space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 mr-2">
                  <Gift className="h-3 w-3 mr-1" /> 
                </Badge>
                <span className="text-sm font-bold text-construPro-orange">{resgate.pontos} pontos</span>
              </div>
              
              {isAvailable && (
                <span className="text-xs text-green-600 font-medium flex items-center">
                  <span className="h-1.5 w-1.5 bg-green-500 rounded-full mr-1"></span>
                  Disponível
                </span>
              )}
            </div>
            
            {/* Enhanced progress bar */}
            <Progress 
              value={percentComplete} 
              className={`h-2 rounded-full overflow-hidden transition-all duration-700 ease-in-out ${
                isAvailable ? 'bg-gray-100' : 'bg-gray-100'
              }`}
            />
            
            {/* Enhanced button and locked state */}
            {isAvailable ? (
              <Button 
                className="w-full bg-construPro-blue hover:bg-construPro-blue/90 text-white flex items-center justify-center gap-1.5 py-2 h-9 rounded-lg shadow-sm font-medium"
                onClick={handleResgateClick}
              >
                <Gift className="h-4 w-4" /> 
                <span>Resgatar</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <div className="w-full py-2 px-3 rounded-lg bg-gray-100 text-gray-500 flex items-center justify-center gap-2 text-xs border border-gray-200">
                <Lock className="h-3.5 w-3.5" />
                <span>Faltam {resgate.pontos - userPoints} pontos</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ResgateCard;
