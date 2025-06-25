
import React from 'react';
import { MapPin, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NoDeliveryZoneStateProps {
  currentCep?: string | null;
  onChangeCep?: () => void;
  onRetry?: () => void;
}

const NoDeliveryZoneState: React.FC<NoDeliveryZoneStateProps> = ({
  currentCep,
  onChangeCep,
  onRetry
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-6">
        <MapPin className="w-8 h-8 text-gray-400" />
      </div>
      
      <h3 className="text-lg font-semibold text-gray-800 mb-2">
        Nenhum lojista entrega no seu endereço
      </h3>
      
      <p className="text-gray-600 mb-1 max-w-md">
        Não encontramos lojas que atendem a região do CEP{' '}
        {currentCep && (
          <span className="font-mono font-medium">
            {currentCep.replace(/(\d{5})(\d{3})/, '$1-$2')}
          </span>
        )}
      </p>
      
      <p className="text-sm text-gray-500 mb-6">
        Tente trocar o CEP ou volte mais tarde para verificar novos lojistas.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-3">
        {onChangeCep && (
          <Button 
            onClick={onChangeCep}
            className="flex items-center gap-2"
          >
            <MapPin className="w-4 h-4" />
            Trocar CEP
          </Button>
        )}
        
        {onRetry && (
          <Button 
            variant="outline" 
            onClick={onRetry}
            className="flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Tentar Novamente
          </Button>
        )}
      </div>
      
      <div className="mt-8 p-4 bg-blue-50 rounded-lg max-w-md">
        <p className="text-sm text-blue-700">
          💡 <strong>Dica:</strong> Nossos lojistas estão sempre expandindo suas áreas de entrega. 
          Cadastre-se para ser notificado quando novos produtos chegarem à sua região!
        </p>
      </div>
    </div>
  );
};

export default NoDeliveryZoneState;
