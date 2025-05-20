
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
      className="overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all"
      onClick={handleClick}
    >
      <div className="flex flex-col h-full">
        {/* Badge e Categoria */}
        <div className="relative">
          <Badge className="absolute top-2 left-2 bg-construPro-blue text-white text-xs font-medium">
            {resgate.categoria}
          </Badge>

          {/* Imagem do produto */}
          <div className="h-24 flex items-center justify-center bg-gray-50">
            <img 
              src={resgate.imagemUrl} 
              alt={resgate.titulo} 
              className="h-full max-h-24 w-auto object-contain p-2"
              onError={(e) => {
                e.currentTarget.src = 'https://via.placeholder.com/100x100?text=Recompensa';
              }}
            />
          </div>
        </div>
        
        {/* Informações do produto */}
        <div className="p-3 flex flex-col justify-between flex-grow">
          <div>
            <h3 className="font-medium text-gray-900 line-clamp-2 text-sm mb-1">{resgate.titulo}</h3>
            
            {resgate.descricao && (
              <p className="text-xs text-gray-500 line-clamp-2 mb-2">{resgate.descricao}</p>
            )}
          </div>
          
          <div className="mt-auto space-y-2">
            <div className="flex justify-between items-center text-sm font-medium">
              <span className="text-construPro-orange">{resgate.pontos} pontos</span>
            </div>
            
            <Progress 
              value={percentComplete} 
              className={`h-1.5 rounded-full overflow-hidden transition-all duration-700 ease-in-out ${isAvailable ? 'bg-gray-100' : 'bg-gray-100'}`}
            />
            
            {isAvailable ? (
              <Button 
                className="w-full bg-construPro-blue hover:bg-construPro-blue/90 text-white flex items-center justify-center gap-1 py-1 h-8"
                onClick={handleResgateClick}
              >
                <Gift className="h-3.5 w-3.5" /> 
                <span>Resgatar</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <div className="w-full py-1.5 px-2 rounded-md bg-gray-100 text-gray-500 flex items-center justify-center gap-1.5 text-xs">
                <Lock className="h-3 w-3" />
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
