
import React from 'react';
import { History, RefreshCw, Loader2, PlusCircle, MinusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PointAdjustment } from '@/services/vendorPointsService';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PointsAdjustmentHistoryProps {
  adjustments: PointAdjustment[];
  isLoading: boolean;
  onRefresh: () => void;
}

const PointsAdjustmentHistory: React.FC<PointsAdjustmentHistoryProps> = ({ 
  adjustments, 
  isLoading, 
  onRefresh 
}) => {
  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch (e) {
      console.error('Error formatting date:', e);
      return 'Data inválida';
    }
  };

  // Group adjustments by date (YYYY-MM-DD)
  const groupedAdjustments = React.useMemo(() => {
    const groups: { [key: string]: PointAdjustment[] } = {};
    
    adjustments.forEach(adjustment => {
      if (!adjustment.created_at) return;
      
      try {
        const date = parseISO(adjustment.created_at);
        const dateKey = format(date, 'yyyy-MM-dd');
        
        if (!groups[dateKey]) {
          groups[dateKey] = [];
        }
        
        groups[dateKey].push(adjustment);
      } catch (error) {
        console.error('Error parsing date:', error);
      }
    });
    
    return groups;
  }, [adjustments]);

  const sortedDates = React.useMemo(() => {
    return Object.keys(groupedAdjustments).sort((a, b) => b.localeCompare(a));
  }, [groupedAdjustments]);

  return (
    <div className="space-y-3 p-4 pt-0">
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-2">
          <History size={16} className="text-gray-500" />
          <h3 className="font-medium text-gray-700">Histórico de Ajustes</h3>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={onRefresh}
          className="flex items-center gap-1"
        >
          <RefreshCw className="h-3 w-3" />
          <span className="text-xs">Atualizar</span>
        </Button>
      </div>
      
      {isLoading ? (
        <div className="py-8 text-center">
          <Loader2 className="h-8 w-8 mx-auto animate-spin text-blue-600" />
          <p className="mt-2 text-sm text-gray-500">Carregando histórico...</p>
        </div>
      ) : adjustments.length > 0 ? (
        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
          {sortedDates.map(dateKey => {
            const dayAdjustments = groupedAdjustments[dateKey];
            const formattedDate = format(parseISO(dateKey), "dd 'de' MMMM, yyyy", { locale: ptBR });
            
            return (
              <div key={dateKey} className="space-y-1">
                <h4 className="text-xs font-medium text-gray-500 px-1">{formattedDate}</h4>
                
                {dayAdjustments.map(adjustment => (
                  <Card key={adjustment.id} className="p-3 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex">
                        {adjustment.tipo === 'adicao' || adjustment.valor > 0 ? (
                          <PlusCircle className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                        ) : (
                          <MinusCircle className="h-5 w-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                        )}
                        <div>
                          <p className={`font-medium ${adjustment.valor > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {adjustment.valor > 0 ? '+' : ''}{adjustment.valor} pontos
                          </p>
                          <p className="text-sm text-gray-600 mt-1">{adjustment.motivo}</p>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 whitespace-nowrap ml-2">
                        {adjustment.created_at ? format(parseISO(adjustment.created_at), "HH:mm", { locale: ptBR }) : 'Horário desconhecido'}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500">
            Nenhum ajuste de pontos registrado para este cliente
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Os ajustes de pontos aparecerão aqui depois de realizados
          </p>
        </div>
      )}
    </div>
  );
};

export default PointsAdjustmentHistory;
