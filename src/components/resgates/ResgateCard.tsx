
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
      className="overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all"
      onClick={onClick}
    >
      <div className="flex flex-row h-full">
        {/* Imagem à esquerda - reduzido a largura para evitar sobreposição */}
        <div className="w-1/4 max-w-[100px]">
          <div className="h-full relative">
            <img 
              src={resgate.imagemUrl} 
              alt={resgate.titulo} 
              className="w-full h-full object-cover min-h-[100px]"
              onError={(e) => {
                e.currentTarget.src = 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&h=500&q=80';
              }}
            />
            <Badge className="absolute top-2 left-2 bg-construPro-blue text-white text-xs font-medium">
              {resgate.categoria}
            </Badge>
          </div>
        </div>
        
        {/* Informações à direita - aumentado o espaço para o texto */}
        <div className="w-3/4 p-3 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{resgate.titulo}</h3>
            
            {resgate.descricao && (
              <p className="text-xs text-gray-500 line-clamp-2 mb-2">{resgate.descricao}</p>
            )}
          </div>
          
          <div className="mt-auto space-y-2">
            <div className="flex justify-between items-center text-sm font-medium">
              <span className="text-construPro-orange">{resgate.pontos} pontos</span>
            </div>
            
            <div className="space-y-2">
              <Progress 
                value={percentComplete} 
                className={`h-1.5 ${isAvailable ? 'bg-gray-100' : 'bg-gray-100'}`}
              />
              
              {isAvailable ? (
                <Button 
                  className="w-full bg-construPro-blue hover:bg-construPro-blue/90 text-white flex items-center justify-center gap-1 py-1 h-8"
                  onClick={onClick}
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
      </div>
    </Card>
  );
};

export default ResgateCard;
