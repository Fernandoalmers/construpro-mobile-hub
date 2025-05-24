
import React from 'react';
import { RefreshCw, Loader2, Award, AlertTriangle, CheckCircle, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Avatar from '../../common/Avatar';
import { CustomerData } from './CustomerSearch';
import { usePointsAudit } from './hooks/usePointsAudit';

interface CustomerInfoProps {
  customer: CustomerData;
  customerPoints: number;
  isLoadingPoints: boolean;
  onRefreshData: () => void;
  auditResults?: any;
  onAutoFix?: () => void;
}

const CustomerInfo: React.FC<CustomerInfoProps> = ({ 
  customer, 
  customerPoints, 
  isLoadingPoints,
  onRefreshData,
  auditResults,
  onAutoFix
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
  
  // Check if there are discrepancies
  const hasDiscrepancies = auditResults && (
    auditResults.difference !== 0 || 
    auditResults.duplicateTransactions > 0 ||
    auditResults.status === 'discrepancy'
  );
  
  return (
    <div className="p-4 bg-blue-50 border-b border-blue-100">
      {/* Alert de discrepâncias */}
      {hasDiscrepancies && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-amber-600 mr-2" />
              <div>
                <div className="font-medium text-amber-800">Problemas detectados no saldo</div>
                <div className="text-sm text-amber-700">
                  {auditResults.difference !== 0 && (
                    <span>Diferença de {auditResults.difference} pontos. </span>
                  )}
                  {auditResults.duplicateTransactions > 0 && (
                    <span>{auditResults.duplicateTransactions} transações duplicadas. </span>
                  )}
                </div>
              </div>
            </div>
            {onAutoFix && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={onAutoFix}
                className="text-amber-700 border-amber-300 hover:bg-amber-100"
              >
                <Wrench className="h-4 w-4 mr-1" />
                Corrigir
              </Button>
            )}
          </div>
        </div>
      )}

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
              {auditResults && !hasDiscrepancies && (
                <span className="ml-2 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full flex items-center">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Saldo verificado
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
                  {formatPhone(customer.telefone)}
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
              <div className="flex items-center justify-center">
                <p className="text-2xl font-bold text-blue-700">{customerPoints || 0}</p>
                {auditResults && auditResults.difference !== 0 && (
                  <span className="ml-2 text-xs text-amber-600">
                    (Calc: {auditResults.transactionBalance})
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerInfo;
