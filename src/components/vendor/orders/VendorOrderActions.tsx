
import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { FileText, Printer, CheckCircle, AlertCircle } from 'lucide-react';
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
    content: () => printRef.current,
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

  return (
    <>
      <Card className="p-4">
        <h3 className="font-medium mb-3 flex items-center gap-2">
          <CheckCircle size={16} />
          Ações do Vendedor
        </h3>
        
        <div className="space-y-3">
          {/* Botão de atualização de status */}
          {canUpdate && nextStatus && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  className="w-full"
                  disabled={isUpdating}
                  variant="default"
                >
                  {isUpdating ? 'Atualizando...' : buttonText}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar Atualização de Status</AlertDialogTitle>
                  <AlertDialogDescription>
                    {getStatusUpdateDescription()}
                    <br /><br />
                    <strong>Status atual:</strong> {pedido.status}<br />
                    <strong>Novo status:</strong> {nextStatus}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleStatusUpdate}>
                    Confirmar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {!canUpdate && (
            <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 p-3 rounded-md">
              <AlertCircle size={16} />
              <span>
                {pedido.status.toLowerCase() === 'entregue' 
                  ? 'Pedido finalizado' 
                  : 'Pedido cancelado'}
              </span>
            </div>
          )}

          <Separator />

          {/* Botão de exportar PDF */}
          <Button 
            variant="outline" 
            className="w-full"
            onClick={handlePrint}
          >
            <Printer size={16} className="mr-2" />
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
