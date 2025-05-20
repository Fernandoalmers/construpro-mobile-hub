
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertCircle, RefreshCcw } from 'lucide-react';

interface VendorStatusAlertProps {
  onFixVendorStatus: () => void;
}

const VendorStatusAlert: React.FC<VendorStatusAlertProps> = ({ onFixVendorStatus }) => {
  return (
    <Card className="p-4 mb-4 border-yellow-300 bg-yellow-50">
      <div className="flex items-center gap-3">
        <AlertCircle className="h-6 w-6 text-yellow-500" />
        <div className="flex-1">
          <h3 className="font-medium text-yellow-800">Status do vendedor pendente</h3>
          <p className="text-sm text-yellow-700 mt-1">
            O status do seu perfil de vendedor está como "pendente", o que pode impedir a visualização dos pedidos.
          </p>
        </div>
        <Button 
          onClick={onFixVendorStatus}
          className="bg-yellow-600 hover:bg-yellow-700 text-white flex items-center gap-2"
          size="sm"
        >
          <RefreshCcw size={16} />
          Corrigir status
        </Button>
      </div>
    </Card>
  );
};

export default VendorStatusAlert;
