
import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

interface RealtimeIndicatorProps {
  isConnected: boolean;
  lastUpdate?: Date;
}

const RealtimeIndicator: React.FC<RealtimeIndicatorProps> = ({ 
  isConnected, 
  lastUpdate 
}) => {
  const [showUpdate, setShowUpdate] = useState(false);

  useEffect(() => {
    if (lastUpdate) {
      setShowUpdate(true);
      const timer = setTimeout(() => setShowUpdate(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [lastUpdate]);

  return (
    <div className="flex items-center gap-2">
      <Badge 
        variant={isConnected ? "default" : "secondary"}
        className={`flex items-center gap-1 ${
          isConnected ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
        }`}
      >
        {isConnected ? (
          <Wifi className="h-3 w-3" />
        ) : (
          <WifiOff className="h-3 w-3" />
        )}
        {isConnected ? 'Tempo Real' : 'Desconectado'}
      </Badge>
      
      {showUpdate && (
        <Badge className="bg-blue-100 text-blue-800 animate-pulse flex items-center gap-1">
          <RefreshCw className="h-3 w-3" />
          Atualizado
        </Badge>
      )}
      
      {lastUpdate && (
        <span className="text-xs text-gray-500">
          Última atualização: {lastUpdate.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
};

export default RealtimeIndicator;
