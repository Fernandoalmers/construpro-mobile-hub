
import React from 'react';
import Card from '../common/Card';
import { Badge } from '@/components/ui/badge';
import { Gift, ChevronRight, Lock } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

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
  
  return (
    <Card 
      className="overflow-hidden flex flex-col h-full border border-gray-100 shadow-sm hover:shadow-md transition-all"
      onClick={onClick}
    >
      <div className="relative h-36 bg-gray-50">
        <img 
          src={resgate.imagemUrl} 
          alt={resgate.titulo} 
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src = 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&h=500&q=80';
          }}
        />
        <Badge className="absolute top-2 right-2 bg-construPro-blue text-white font-medium">
          {resgate.categoria}
        </Badge>
      </div>
      
      <div className="p-4 flex-1 flex flex-col gap-2">
        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{resgate.titulo}</h3>
        
        {resgate.descricao && (
          <p className="text-sm text-gray-500 line-clamp-2 mb-2">{resgate.descricao}</p>
        )}
        
        <div className="mt-auto space-y-3">
          <div className="flex justify-between items-center text-sm font-medium">
            <span className="text-construPro-orange">{resgate.pontos} pontos</span>
            <span className="text-gray-600">{userPoints} / {resgate.pontos}</span>
          </div>
          
          <div className="space-y-2">
            <Progress 
              value={percentComplete} 
              className={`h-2 ${isAvailable ? 'bg-gray-100' : 'bg-gray-100'}`}
            />
            
            {isAvailable ? (
              <Button 
                className="w-full bg-construPro-blue hover:bg-construPro-blue/90 text-white flex items-center justify-center gap-1"
                onClick={onClick}
              >
                <Gift className="h-4 w-4" /> 
                <span>Resgatar</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <div className="w-full py-2 px-3 rounded-md bg-gray-100 text-gray-500 flex items-center justify-center gap-2 text-sm">
                <Lock className="h-4 w-4" />
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
