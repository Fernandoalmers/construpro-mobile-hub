
import React from 'react';
import { History, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PointAdjustment } from '@/services/vendorPointsService';

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
      return new Date(dateString).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      console.error('Error formatting date:', e);
      return 'Data inválida';
    }
  };

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
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {adjustments.map(adjustment => (
            <Card key={adjustment.id} className="p-3 hover:bg-gray-50 transition-colors">
              <div className="flex justify-between items-start">
                <div>
                  <p className={`font-medium ${adjustment.valor > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {adjustment.valor > 0 ? '+' : ''}{adjustment.valor} pontos
                  </p>
                  <p className="text-sm text-gray-600 mt-1">{adjustment.motivo}</p>
                </div>
                <div className="text-xs text-gray-500 whitespace-nowrap ml-2">
                  {adjustment.created_at ? formatDate(adjustment.created_at) : 'Data desconhecida'}
                </div>
              </div>
            </Card>
          ))}
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
