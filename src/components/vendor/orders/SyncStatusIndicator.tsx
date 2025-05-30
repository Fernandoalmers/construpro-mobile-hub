
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface SyncStatusIndicatorProps {
  syncStatus: {
    total_orders: number;
    total_pedidos: number;
    missing_pedidos: number;
    sync_status: 'SYNC_OK' | 'SYNC_WARNING' | 'SYNC_CRITICAL';
    last_check: string;
  } | null;
  isChecking: boolean;
}

const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({ 
  syncStatus, 
  isChecking 
}) => {
  if (isChecking) {
    return (
      <Badge className="bg-blue-100 text-blue-800">
        <Clock size={12} className="mr-1 animate-spin" />
        Verificando...
      </Badge>
    );
  }

  if (!syncStatus) {
    return (
      <Badge className="bg-gray-100 text-gray-800">
        <Shield size={12} className="mr-1" />
        Status desconhecido
      </Badge>
    );
  }

  switch(syncStatus.sync_status) {
    case 'SYNC_OK':
      return (
        <Badge className="bg-green-100 text-green-800">
          <CheckCircle size={12} className="mr-1" />
          Sincronização OK
        </Badge>
      );
    case 'SYNC_WARNING':
      return (
        <Badge className="bg-yellow-100 text-yellow-800">
          <AlertTriangle size={12} className="mr-1" />
          {syncStatus.missing_pedidos} pedidos não sincronizados
        </Badge>
      );
    case 'SYNC_CRITICAL':
      return (
        <Badge className="bg-red-100 text-red-800">
          <AlertTriangle size={12} className="mr-1" />
          CRÍTICO: {syncStatus.missing_pedidos} pedidos perdidos
        </Badge>
      );
    default:
      return (
        <Badge className="bg-gray-100 text-gray-800">
          <Shield size={12} className="mr-1" />
          Status desconhecido
        </Badge>
      );
  }
};

export default SyncStatusIndicator;
