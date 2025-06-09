
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Users, TrendingUp, TrendingDown, Clock, AlertTriangle } from 'lucide-react';
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
  console.log('📋 [VendorSummaryTable] Rendering with summaries:', summaries?.length || 0);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Resumo de Ajustes por Vendedor
            <Badge variant="outline" className="ml-2 bg-yellow-100 text-yellow-800">
              Carregando...
            </Badge>
          </CardTitle>
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

  const hasValidData = summaries && Array.isArray(summaries) && summaries.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Resumo de Ajustes por Vendedor
          <Badge variant="outline" className="ml-2">
            {summaries?.length || 0} vendedores
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hasValidData ? (
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
                <TableRow key={summary.vendedor_id} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="font-medium">
                      {summary.vendedor_nome}
                    </div>
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
        ) : (
          <div className="text-center py-8">
            <div className="flex flex-col items-center gap-4">
              <AlertTriangle className="h-12 w-12 text-gray-400" />
              <div>
                <p className="text-gray-500 font-medium">Nenhum ajuste encontrado</p>
                <p className="text-sm text-gray-400 mt-1">
                  Não há ajustes de pontos registrados no sistema
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VendorAdjustmentsSummaryTable;
