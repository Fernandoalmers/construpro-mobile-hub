
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Users, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { VendorAdjustmentSummary } from '@/services/admin/loyaltyService';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface VendorAdjustmentsSummaryTableProps {
  summaries: VendorAdjustmentSummary[];
  isLoading: boolean;
}

const VendorAdjustmentsSummaryTable: React.FC<VendorAdjustmentsSummaryTableProps> = ({ 
  summaries, 
  isLoading 
}) => {
  console.log('🎯 [VendorSummaryTable] Rendering:', {
    count: summaries?.length || 0,
    isLoading,
    vendors: summaries?.map(s => s.vendedor_nome) || []
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Resumo de Ajustes por Vendedor</CardTitle>
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
          <Users className="h-5 w-5" />
          Resumo de Ajustes por Vendedor
          <Badge variant="outline" className="ml-2">
            {summaries.length} vendedores
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vendedor</TableHead>
              <TableHead className="text-center">Total Ajustes</TableHead>
              <TableHead className="text-center">Pontos Adicionados</TableHead>
              <TableHead className="text-center">Pontos Removidos</TableHead>
              <TableHead>Último Ajuste</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {summaries.map((summary) => (
              <TableRow key={summary.vendedor_id}>
                <TableCell>
                  <div className="font-medium">{summary.vendedor_nome}</div>
                  <div className="text-xs text-gray-500">ID: {summary.vendedor_id}</div>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline" className="font-mono">
                    {summary.total_ajustes}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-green-600 font-bold">
                      +{summary.pontos_adicionados.toLocaleString()}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <TrendingDown className="h-4 w-4 text-red-600" />
                    <span className="text-red-600 font-bold">
                      -{summary.pontos_removidos.toLocaleString()}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">
                      {format(new Date(summary.ultimo_ajuste), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {summaries.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>Nenhum ajuste de pontos encontrado</p>
            <p className="text-sm mt-1">Verifique se existem vendedores ativos com ajustes</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VendorAdjustmentsSummaryTable;
