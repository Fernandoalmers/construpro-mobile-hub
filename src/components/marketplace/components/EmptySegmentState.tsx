
import React from 'react';
import { Folder, ArrowLeft, Grid3X3 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptySegmentStateProps {
  segmentName: string;
  onViewAllCategories: () => void;
  onBackToHome: () => void;
}

const EmptySegmentState: React.FC<EmptySegmentStateProps> = ({
  segmentName,
  onViewAllCategories,
  onBackToHome
}) => {
  return (
    <div className="text-center py-16">
      <div className="max-w-sm mx-auto">
        <div className="mb-6">
          <div className="w-16 h-16 mx-auto bg-orange-100 rounded-full flex items-center justify-center">
            <Folder className="w-8 h-8 text-orange-400" />
          </div>
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Nenhuma loja oferece produtos em {segmentName}
        </h3>
        
        <p className="text-sm text-gray-600 mb-8 leading-relaxed">
          No momento, não temos lojas parceiras oferecendo produtos nesta categoria. 
          Que tal explorar outras opções disponíveis?
        </p>
        
        <div className="space-y-3">
          <Button
            onClick={onViewAllCategories}
            className="w-full bg-construPro-blue text-white px-4 py-2 rounded-lg font-medium hover:bg-construPro-blue-dark transition-colors"
          >
            <Grid3X3 className="w-3.5 h-3.5 mr-2" />
            Ver todas as categorias
          </Button>
          
          <Button
            onClick={onBackToHome}
            variant="outline"
            className="w-full border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-2" />
            Voltar ao início
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EmptySegmentState;
