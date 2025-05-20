
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Info } from 'lucide-react';

const CustomerRegistrationInfo: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <Card className="p-4 bg-blue-50 border-blue-200">
      <div className="flex items-start gap-3">
        <Info className="h-5 w-5 text-blue-500 mt-0.5" />
        <div>
          <h3 className="font-medium text-blue-800">Registro automático de clientes</h3>
          <p className="text-sm text-blue-700 mt-1">
            Quando um cliente faz uma compra, ele é automaticamente registrado na sua lista de clientes.
            Você também pode importar clientes de pedidos existentes na página de clientes.
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2 bg-white hover:bg-blue-100 border-blue-200"
            onClick={() => navigate('/vendor/customers')}
          >
            Ver lista de clientes
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default CustomerRegistrationInfo;
