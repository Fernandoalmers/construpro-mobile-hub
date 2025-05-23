
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, X, Package, Info } from 'lucide-react';
import { AdminRedemption } from '@/types/admin';

interface RedemptionTableProps {
  redemptions: AdminRedemption[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onMarkAsDelivered: (id: string) => void;
  isProcessing: boolean;
  onViewDetails: (id: string) => void;
}

const getRedemptionStatusBadgeColor = (status: string): string => {
  switch (status) {
    case 'aprovado':
      return 'bg-green-100 text-green-800';
    case 'pendente':
      return 'bg-yellow-100 text-yellow-800';
    case 'recusado':
      return 'bg-red-100 text-red-800';
    case 'entregue':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const RedemptionTable: React.FC<RedemptionTableProps> = React.memo(({
  redemptions,
  onApprove,
  onReject,
  onMarkAsDelivered,
  isProcessing,
  onViewDetails
}) => {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>Item</TableHead>
            <TableHead>Pontos</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {redemptions.map(redemption => (
            <TableRow 
              key={redemption.id} 
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => onViewDetails(redemption.id)}
            >
              <TableCell className="font-medium">{redemption.cliente_nome}</TableCell>
              <TableCell>
                {redemption.imagem_url && (
                  <img
                    src={redemption.imagem_url}
                    alt={redemption.item}
                    className="w-8 h-8 rounded-md inline mr-2 object-cover"
                    loading="lazy"
                    width={32}
                    height={32}
                  />
                )}
                {redemption.item}
              </TableCell>
              <TableCell>{redemption.pontos} pts</TableCell>
              <TableCell>
                <Badge className={getRedemptionStatusBadgeColor(redemption.status)}>
                  {redemption.status}
                </Badge>
              </TableCell>
              <TableCell>{new Date(redemption.data).toLocaleDateString('pt-BR')}</TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <div className="flex space-x-2">
                  {redemption.status === 'pendente' && (
                    <>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-green-600"
                        onClick={() => onApprove(redemption.id)}
                        disabled={isProcessing}
                      >
                        <Check className="h-4 w-4 mr-1" /> Aprovar
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-red-600"
                        onClick={() => onReject(redemption.id)}
                        disabled={isProcessing}
                      >
                        <X className="h-4 w-4 mr-1" /> Recusar
                      </Button>
                    </>
                  )}
                  {redemption.status === 'aprovado' && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-blue-600"
                      onClick={() => onMarkAsDelivered(redemption.id)}
                      disabled={isProcessing}
                    >
                      <Package className="h-4 w-4 mr-1" /> Marcar Entregue
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onViewDetails(redemption.id)}
                  >
                    <Info className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
});

RedemptionTable.displayName = 'RedemptionTable';

export default RedemptionTable;
