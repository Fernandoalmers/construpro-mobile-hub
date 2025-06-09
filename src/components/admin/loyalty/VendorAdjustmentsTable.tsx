
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Settings } from 'lucide-react';
import { VendorAdjustment } from '@/services/admin/loyaltyService';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface VendorAdjustmentsTableProps {
  adjustments: VendorAdjustment[];
  isLoading: boolean;
}

const VendorAdjustmentsTable: React.FC<VendorAdjustmentsTableProps> = ({ adjustments, isLoading }) => {
  const getTypeColor = (tipo: string) => {
    switch (tipo) {
      case 'adicao': return 'bg-green-100 text-green-800';
      case 'remocao': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatValue = (valor: number, tipo: string) => {
    const isAddition = tipo === 'adicao';
    return (
      <span className={isAddition ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
        {isAddition ? '+' : '-'}{Math.abs(valor).toLocaleString()}
      </span>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ajustes por Vendedores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Ajustes por Vendedores
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vendedor</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Motivo</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead>Data</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {adjustments.map((adjustment) => (
              <TableRow key={adjustment.id}>
                <TableCell>
                  <div className="font-medium">{adjustment.vendedor_nome}</div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">{adjustment.usuario_nome}</div>
                </TableCell>
                <TableCell>
                  <Badge className={getTypeColor(adjustment.tipo)}>
                    {adjustment.tipo === 'adicao' ? 'Adição' : 'Remoção'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="max-w-xs truncate" title={adjustment.motivo}>
                    {adjustment.motivo}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {formatValue(adjustment.valor, adjustment.tipo)}
                </TableCell>
                <TableCell>
                  {format(new Date(adjustment.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default VendorAdjustmentsTable;
