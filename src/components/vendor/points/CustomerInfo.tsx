
import React from 'react';
import { RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Avatar from '../../common/Avatar';
import { CustomerData } from './CustomerSearch';

interface CustomerInfoProps {
  customer: CustomerData;
  customerPoints: number;
  isLoadingPoints: boolean;
  onRefreshData: () => void;
}

const CustomerInfo: React.FC<CustomerInfoProps> = ({ 
  customer, 
  customerPoints, 
  isLoadingPoints,
  onRefreshData
}) => {
  return (
    <div className="p-4 bg-blue-50 border-b border-blue-100">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center">
          <Avatar
            src={undefined}
            fallback={customer.nome?.charAt(0) || 'C'}
            size="md"
            className="mr-4"
          />
          <div>
            <h3 className="font-bold">{customer.nome}</h3>
            <div className="flex flex-col sm:flex-row sm:gap-3 text-sm text-gray-600">
              {customer.email && <span>{customer.email}</span>}
              {customer.telefone && <span>{customer.telefone}</span>}
              {customer.cpf && <span>CPF: {customer.cpf}</span>}
            </div>
          </div>
        </div>
        <div className="flex flex-col">
          <div className="bg-white px-6 py-3 rounded-lg shadow-sm text-center">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-blue-600 font-medium">Saldo de Pontos</p>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6" 
                onClick={onRefreshData}
                title="Atualizar dados"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            {isLoadingPoints ? (
              <div className="flex justify-center my-1">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              </div>
            ) : (
              <p className="text-2xl font-bold text-blue-700">{customerPoints}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerInfo;
