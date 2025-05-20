
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertCircle, Database, RefreshCcw, Users } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { runOrdersMigration } from '@/services/vendor/utils/orderMigration';
import { migrateCustomersFromOrders } from '@/services/vendorCustomersService';
import { updateVendorStatus } from '@/services/vendor/orders/utils/diagnosticUtils';

interface DiagnosticActionsProps {
  showVendorStatusFix: boolean;
  vendorId?: string;
  onRefresh: () => void;
}

const DiagnosticActions: React.FC<DiagnosticActionsProps> = ({ 
  showVendorStatusFix, 
  vendorId,
  onRefresh
}) => {
  const navigate = useNavigate();
  const [isMigrating, setIsMigrating] = React.useState(false);
  const [isMigratingOrders, setIsMigratingOrders] = React.useState(false);
  
  // Função para executar migração de pedidos
  const handleMigrateOrders = async () => {
    setIsMigratingOrders(true);
    toast.loading("Migrando pedidos da tabela 'orders' para 'pedidos'...");
    
    try {
      const result = await runOrdersMigration();
      
      if (result.success) {
        toast.success(result.message || "Migração de pedidos concluída com sucesso!");
        
        // Aguardar um momento antes de atualizar os dados
        setTimeout(() => {
          onRefresh();
        }, 1000);
      } else {
        toast.error(result.message || "Erro na migração de pedidos");
      }
    } catch (error) {
      console.error("Error migrating orders:", error);
      toast.error("Erro ao migrar pedidos");
    } finally {
      setIsMigratingOrders(false);
    }
  };
  
  // Function to run customers migration
  const handleCustomersMigration = async () => {
    setIsMigrating(true);
    toast.loading("Migrando clientes a partir de pedidos existentes...");
    try {
      const result = await migrateCustomersFromOrders();
      if (result) {
        toast.success("Clientes migrados com sucesso!");
        // Navigate to customers page to see results
        setTimeout(() => {
          navigate('/vendor/customers');
        }, 1500);
      } else {
        toast.error("Falha ao migrar clientes. Verifique os logs para mais detalhes.");
      }
    } catch (error) {
      console.error("Error running migration:", error);
      toast.error("Erro ao migrar clientes.");
    } finally {
      setIsMigrating(false);
    }
  };

  // Handler for vendor status fix
  const fixVendorStatus = async () => {
    if (!vendorId) {
      toast.error("ID do vendedor não encontrado");
      return;
    }
    
    toast.loading("Atualizando status do vendedor...");
    
    try {
      const result = await updateVendorStatus(vendorId, 'ativo');
      
      if (result.success) {
        toast.success("Status do vendedor atualizado com sucesso");
        // Refresh data
        setTimeout(() => {
          onRefresh();
        }, 1000);
      } else {
        toast.error("Erro ao atualizar status do vendedor");
      }
    } catch (error) {
      toast.error("Erro ao atualizar status do vendedor");
      console.error("Error updating vendor status:", error);
    }
  };

  return (
    <Card className="p-4 bg-yellow-50 border-yellow-200">
      <div className="flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
          <div>
            <h3 className="font-medium text-yellow-800">Diagnóstico e correção de problemas</h3>
            <p className="text-sm text-yellow-700 mt-1">
              Se você não está vendo seus pedidos ou clientes, execute as migrações abaixo.
              Este processo sincronizará automaticamente pedidos e clientes de todas as fontes.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={handleMigrateOrders}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            size="sm"
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
            onClick={handleCustomersMigration}
            className="bg-yellow-600 hover:bg-yellow-700 text-white"
            size="sm"
            disabled={isMigrating}
          >
            {isMigrating ? (
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
          
          <Button 
            onClick={() => navigate('/vendor/customers')}
            variant="outline"
            size="sm"
            className="border-yellow-300 text-yellow-700"
          >
            <Users size={16} className="mr-1" />
            Ver clientes
          </Button>
          
          {showVendorStatusFix && (
            <Button 
              onClick={fixVendorStatus}
              className="bg-red-500 hover:bg-red-600 text-white"
              size="sm"
            >
              Corrigir status do vendedor
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

export default DiagnosticActions;
