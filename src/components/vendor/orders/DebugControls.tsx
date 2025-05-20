
import React from 'react';
import { Button } from '@/components/ui/button';
import { Bug, RotateCcw } from 'lucide-react';

interface DebugControlsProps {
  debugMode: boolean;
  toggleDebugMode: () => void;
  forceRefresh: () => void;
}

const DebugControls: React.FC<DebugControlsProps> = ({ 
  debugMode, 
  toggleDebugMode, 
  forceRefresh 
}) => {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          size="sm"
          onClick={toggleDebugMode}
          className={`flex items-center gap-1 ${debugMode ? 'bg-blue-50 border-blue-300' : ''}`}
        >
          <Bug size={16} className={debugMode ? 'text-blue-500' : ''} />
          {debugMode ? 'Desativar Modo Debug' : 'Ativar Modo Debug'}
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={forceRefresh}
          className="flex items-center gap-1"
        >
          <RotateCcw size={16} />
          Forçar Atualização
        </Button>
      </div>
    </div>
  );
};

export default DebugControls;
