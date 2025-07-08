
import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { FileText, Printer, CheckCircle, AlertCircle, Loader2, Clock, Package, Send, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Pedido } from '@/services/vendor/orders/pedidosService';
import { useOrderActions } from '@/hooks/vendor/useOrderActions';
import OrderPrintTemplate from '../OrderPrintTemplate';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface VendorOrderActionsProps {
  pedido: Pedido;
}

const VendorOrderActions: React.FC<VendorOrderActionsProps> = ({ pedido }) => {
  const printRef = useRef<HTMLDivElement>(null);
  const { 
    isUpdating, 
    updateOrderStatus, 
    getNextStatus, 
    getStatusButtonText, 
    canUpdateStatus 
  } = useOrderActions(pedido.id);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Pedido-${pedido.id.substring(0, 8)}`,
    pageStyle: `
      @page {
        size: A4;
        margin: 20mm;
      }
      @media print {
        body { 
          font-family: Arial, sans-serif;
          font-size: 12px;
          line-height: 1.4;
        }
      }
    `
  });

  const nextStatus = getNextStatus(pedido.status);
  const buttonText = getStatusButtonText(pedido.status);
  const canUpdate = canUpdateStatus(pedido.status);

  const handleStatusUpdate = () => {
    if (nextStatus) {
      console.log('🎯 [VendorOrderActions] Iniciando atualização de status:', {
        pedido_id: pedido.id,
        status_atual: pedido.status,
        novo_status: nextStatus
      });
      updateOrderStatus(nextStatus);
    }
  };

  const getStatusUpdateDescription = () => {
    const descriptions = {
      'confirmado': 'Confirma que o pedido foi recebido e está sendo preparado.',
      'processando': 'Marca o pedido como em preparação/separação.',
      'enviado': 'Confirma que o pedido foi despachado para entrega.',
      'entregue': 'Finaliza o pedido como entregue ao cliente.'
    };
    return nextStatus ? descriptions[nextStatus] : '';
  };

  const getActionIcon = (status: string) => {
    switch(status) {
      case 'confirmado': return Clock;
      case 'processando': return Package;
      case 'enviado': return Truck;
      case 'entregue': return CheckCircle;
      default: return CheckCircle;
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'confirmado': return 'bg-purple-600 hover:bg-purple-700';
      case 'processando': return 'bg-amber-600 hover:bg-amber-700';
      case 'enviado': return 'bg-blue-600 hover:bg-blue-700';
      case 'entregue': return 'bg-emerald-600 hover:bg-emerald-700';
      default: return 'bg-gray-600 hover:bg-gray-700';
    }
  };

  const ActionIcon = nextStatus ? getActionIcon(nextStatus) : CheckCircle;
  const statusColor = nextStatus ? getStatusColor(nextStatus) : 'bg-gray-600 hover:bg-gray-700';

  return (
    <>
      <Card className="p-4 border-l-4 border-l-blue-500">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle size={18} className="text-blue-600" />
          <h3 className="font-semibold text-gray-900">Ações do Vendedor</h3>
        </div>
        
        <div className="space-y-3">
          {/* Status Update Action */}
          {canUpdate && nextStatus && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  className={`w-full text-white ${statusColor} transition-colors`}
                  disabled={isUpdating}
                  size="lg"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Atualizando...
                    </>
                  ) : (
                    <>
                      <ActionIcon className="mr-2 h-4 w-4" />
                      {buttonText}
                    </>
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <ActionIcon size={20} />
                    Confirmar Atualização de Status
                  </AlertDialogTitle>
                  <AlertDialogDescription className="space-y-2">
                    <p>{getStatusUpdateDescription()}</p>
                    <div className="bg-gray-50 p-3 rounded-md text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium">Status atual:</span>
                        <span className="capitalize">{pedido.status}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Novo status:</span>
                        <span className="capitalize font-semibold text-blue-600">{nextStatus}</span>
                      </div>
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isUpdating}>Cancelar</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleStatusUpdate} 
                    disabled={isUpdating}
                    className={statusColor}
                  >
                    {isUpdating ? 'Atualizando...' : 'Confirmar'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {!canUpdate && (
            <div className="flex items-center gap-3 text-sm bg-gray-50 p-4 rounded-lg border">
              <AlertCircle size={16} className="text-gray-500 flex-shrink-0" />
              <div>
                <div className="font-medium text-gray-700">
                  {pedido.status.toLowerCase() === 'entregue' 
                    ? 'Pedido Finalizado' 
                    : 'Pedido Cancelado'}
                </div>
                <div className="text-gray-500 text-xs mt-1">
                  {pedido.status.toLowerCase() === 'entregue' 
                    ? 'Este pedido foi concluído com sucesso' 
                    : 'Este pedido foi cancelado e não pode ser alterado'}
                </div>
              </div>
            </div>
          )}

          <Separator />

          {/* Print Action */}
          <Button 
            variant="outline" 
            className="w-full flex items-center gap-2 hover:bg-gray-50"
            onClick={handlePrint}
          >
            <Printer size={16} />
            Exportar PDF para Impressão
          </Button>
        </div>
      </Card>

      {/* Template oculto para impressão */}
      <div style={{ display: 'none' }}>
        <OrderPrintTemplate ref={printRef} pedido={pedido} />
      </div>
    </>
  );
};

export default VendorOrderActions;
