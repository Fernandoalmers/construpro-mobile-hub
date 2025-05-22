
import React from 'react';
import { RefreshCw, Loader2, Award } from 'lucide-react';
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
  // Format CPF with dots and dash
  const formatCPF = (cpf: string | undefined) => {
    if (!cpf || cpf.length !== 11) return cpf;
    return `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9)}`;
  };

  // Format phone number with Brazilian style
  const formatPhone = (phone: string | undefined) => {
    if (!phone) return phone;
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 11) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    } else if (digits.length === 10) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    }
    return phone;
  };

  // Determine if customer is a regular customer or new
  const isRegularCustomer = !!customer.vendedor_id && customer.vendedor_id.length > 0;
  
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
            <div className="flex items-center">
              <h3 className="font-bold">{customer.nome}</h3>
              {isRegularCustomer ? (
                <span className="ml-2 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full flex items-center">
                  <Award className="h-3 w-3 mr-1" />
                  Cliente frequente
                </span>
              ) : (
                <span className="ml-2 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                  Novo cliente
                </span>
              )}
            </div>
            <div className="flex flex-col sm:flex-row sm:gap-3 text-sm text-gray-600">
              {customer.email && (
                <span className="flex items-center">
                  <span className="text-gray-400 mr-1 hidden sm:inline">•</span>
                  {customer.email}
                </span>
              )}
              {customer.telefone && (
                <span className="flex items-center">
                  <span className="text-gray-400 mr-1 hidden sm:inline">•</span>
                  {customer.telefone}
                </span>
              )}
              {customer.cpf && (
                <span className="flex items-center">
                  <span className="text-gray-400 mr-1 hidden sm:inline">•</span>
                  CPF: {formatCPF(customer.cpf)}
                </span>
              )}
            </div>
            {isRegularCustomer && customer.total_gasto > 0 && (
              <div className="text-xs text-gray-500 mt-1">
                Total gasto: R$ {customer.total_gasto.toFixed(2).replace('.', ',')}
              </div>
            )}
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
              <p className="text-2xl font-bold text-blue-700">{customerPoints || 0}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerInfo;
