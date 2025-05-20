
import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, Database, RotateCcw, RefreshCcw } from 'lucide-react';

interface EmptyOrdersStateProps {
  onRefresh: () => void;
  onMigrateOrders: () => void;
  onMigrateCustomers: () => void;
  onForceRefresh: () => void;
  isMigratingOrders: boolean;
  isMigratingCustomers: boolean;
  showVendorStatusFix: boolean;
  onFixVendorStatus: () => void;
}

const EmptyOrdersState: React.FC<EmptyOrdersStateProps> = ({
  onRefresh,
  onMigrateOrders,
  onMigrateCustomers,
  onForceRefresh,
  isMigratingOrders,
  isMigratingCustomers,
  showVendorStatusFix,
  onFixVendorStatus
}) => {
  return (
    <div className="rounded-lg border p-8 text-center">
      <AlertCircle className="mx-auto h-10 w-10 text-yellow-500 mb-3" />
      <h3 className="text-lg font-medium mb-2">Nenhum pedido encontrado</h3>
      <p className="text-gray-500 mb-4">
        Não encontramos pedidos vinculados à sua loja. Isto pode ocorrer por alguns motivos:
      </p>
      <ul className="text-sm text-gray-600 list-disc list-inside mb-4 text-left">
        <li>Sua loja ainda não recebeu pedidos</li>
        <li>Os produtos cadastrados não foram associados corretamente</li>
        <li>É necessário importar os pedidos existentes</li>
        {showVendorStatusFix && (
          <li className="font-medium text-yellow-700">
            Seu perfil de vendedor está com status "pendente"
          </li>
        )}
      </ul>
      <div className="flex flex-wrap gap-2 justify-center">
        <Button onClick={onRefresh} className="mt-2">
          Tentar novamente
        </Button>
        <Button
          onClick={onMigrateOrders}
          className="mt-2 bg-blue-600 hover:bg-blue-700 text-white"
          disabled={isMigratingOrders}
        >
          {isMigratingOrders ? (
            <>
              <Database size={16} className="mr-1 animate-spin" />
              Migrando pedidos...
            </>
          ) : (
            <>
              <Database size={16} className="mr-1" />
              Migrar pedidos
            </>
          )}
        </Button>
        <Button
          onClick={onMigrateCustomers}
          className="mt-2 bg-yellow-600 hover:bg-yellow-700 text-white"
          disabled={isMigratingCustomers}
        >
          {isMigratingCustomers ? (
            <>
              <RefreshCcw size={16} className="mr-1 animate-spin" />
              Migrando clientes...
            </>
          ) : (
            <>
              <RefreshCcw size={16} className="mr-1" />
              Migrar clientes
            </>
          )}
        </Button>
        {showVendorStatusFix && (
          <Button 
            onClick={onFixVendorStatus}
            className="mt-2 bg-yellow-600 hover:bg-yellow-700"
          >
            Corrigir status do vendedor
          </Button>
        )}
        <Button 
          variant="outline" 
          onClick={onForceRefresh} 
          className="mt-2 flex items-center gap-1"
        >
          <RotateCcw size={16} />
          Forçar Atualização
        </Button>
      </div>
    </div>
  );
};

export default EmptyOrdersState;
