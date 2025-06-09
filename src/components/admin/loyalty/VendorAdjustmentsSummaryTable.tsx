
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Users, TrendingUp, TrendingDown, Clock, AlertTriangle, Bug } from 'lucide-react';
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
  console.log('🎯 [VendorSummaryTable] === ENHANCED COMPONENT RENDER ===');
  console.log('🎯 [VendorSummaryTable] Timestamp:', new Date().toISOString());
  console.log('🎯 [VendorSummaryTable] Props analysis:', {
    summariesCount: summaries?.length || 0,
    isLoading,
    summariesType: typeof summaries,
    isArray: Array.isArray(summaries),
    summariesDefined: summaries !== undefined && summaries !== null
  });

  // ENHANCED DEBUG: Detailed analysis of summaries data
  if (summaries && summaries.length > 0) {
    console.log('🔍 [VendorSummaryTable] DETAILED SUMMARIES ANALYSIS:');
    summaries.forEach((summary, index) => {
      console.log(`  ${index + 1}. "${summary.vendedor_nome}" | ID: ${summary.vendedor_id} | Adjustments: ${summary.total_ajustes}`);
      console.log(`     Points: +${summary.pontos_adicionados} / -${summary.pontos_removidos} | Last: ${summary.ultimo_ajuste}`);
      
      // Special check for Mais Real
      if (summary.vendedor_nome.includes('Mais Real')) {
        console.log(`    🎯 MAIS REAL FOUND IN COMPONENT DATA! ${summary.total_ajustes} adjustments, +${summary.pontos_adicionados} points`);
      }
    });
    
    // Check specifically for Mais Real
    const maisRealSummary = summaries.find(s => s.vendedor_nome.includes('Mais Real'));
    if (maisRealSummary) {
      console.log(`🎉 [VendorSummaryTable] MAIS REAL SUMMARY FOUND: ${maisRealSummary.vendedor_nome} with ${maisRealSummary.total_ajustes} adjustments`);
    } else {
      console.log('❌ [VendorSummaryTable] MAIS REAL NOT FOUND in component data!');
      console.log('🔍 [VendorSummaryTable] Available vendor names:', summaries.map(s => s.vendedor_nome));
    }
    
    console.log(`🎉 [VendorSummaryTable] TOTAL VENDORS TO RENDER: ${summaries.length}`);
  } else {
    console.log('❌ [VendorSummaryTable] NO SUMMARIES DATA RECEIVED');
    console.log('🔍 [VendorSummaryTable] Debug details:', {
      summaries: summaries,
      summariesLength: summaries?.length,
      isLoading: isLoading,
      summariesString: JSON.stringify(summaries)
    });
  }

  if (isLoading) {
    console.log('⏳ [VendorSummaryTable] Showing loading state');
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

  // ENHANCED VALIDATION: Final validation before render
  const hasData = summaries && Array.isArray(summaries) && summaries.length > 0;
  console.log('🔍 [VendorSummaryTable] FINAL RENDER DECISION:', {
    hasData,
    summariesLength: summaries?.length || 0,
    willShowTable: hasData,
    willShowEmptyState: !hasData,
    dataIntegrity: summaries ? 'OK' : 'FAILED'
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Resumo de Ajustes por Vendedor
          <Badge variant="outline" className="ml-2">
            {summaries?.length || 0} vendedores
          </Badge>
          
          {/* ENHANCED DEBUG INDICATORS */}
          {hasData && (
            <Badge variant="default" className="ml-2 bg-green-100 text-green-800">
              ✓ {summaries.length} vendedores carregados
            </Badge>
          )}
          {!hasData && (
            <Badge variant="destructive" className="ml-2">
              ⚠️ Nenhum dado encontrado
            </Badge>
          )}
          
          {/* Special indicator for Mais Real */}
          {hasData && summaries.find(s => s.vendedor_nome.includes('Mais Real')) && (
            <Badge variant="default" className="ml-2 bg-blue-100 text-blue-800">
              🎯 Mais Real detectado
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <>
            {/* ENHANCED DEBUG PANEL */}
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 text-blue-800 text-sm font-medium">
                <Bug className="h-4 w-4" />
                Debug: Renderizando {summaries.length} vendedores
              </div>
              <div className="text-xs text-blue-600 mt-1 space-y-1">
                <div>Vendedores: {summaries.map(s => s.vendedor_nome).join(', ')}</div>
                <div>Mais Real encontrado: {summaries.find(s => s.vendedor_nome.includes('Mais Real')) ? 'SIM' : 'NÃO'}</div>
                <div>Timestamp: {new Date().toISOString()}</div>
              </div>
            </div>
            
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
                {summaries.map((summary, index) => {
                  console.log(`🎯 [VendorSummaryTable] RENDERING ROW ${index + 1}: "${summary.vendedor_nome}" with ${summary.total_ajustes} adjustments`);
                  
                  // Special logging for Mais Real
                  if (summary.vendedor_nome.includes('Mais Real')) {
                    console.log(`🎯 [VendorSummaryTable] RENDERING MAIS REAL ROW: ${summary.total_ajustes} adjustments, +${summary.pontos_adicionados} points`);
                  }
                  
                  return (
                    <TableRow 
                      key={summary.vendedor_id} 
                      className={`hover:bg-gray-50 ${summary.vendedor_nome.includes('Mais Real') ? 'bg-yellow-50 border-l-4 border-yellow-400' : ''}`}
                    >
                      <TableCell>
                        <div className="font-medium flex items-center gap-2">
                          {summary.vendedor_nome}
                          {summary.vendedor_nome.includes('Mais Real') && (
                            <Badge variant="outline" className="bg-yellow-100 text-yellow-800 text-xs">
                              🎯 Mais Real
                            </Badge>
                          )}
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
                  );
                })}
              </TableBody>
            </Table>
          </>
        ) : (
          <div className="text-center py-8">
            <div className="flex flex-col items-center gap-4">
              <AlertTriangle className="h-12 w-12 text-orange-500" />
              <div>
                <p className="text-gray-500 font-medium">Nenhum ajuste de pontos encontrado</p>
                <p className="text-sm text-gray-400 mt-1">Verifique se existem vendedores com ajustes</p>
              </div>
              
              {/* ENHANCED DEBUG INFO */}
              <div className="text-xs text-red-600 bg-red-50 p-4 rounded border font-mono max-w-md">
                <div className="font-bold mb-2">DEBUG DETALHADO:</div>
                <div>summaries = {JSON.stringify(summaries)}</div>
                <div>summaries.length = {summaries?.length || 0}</div>
                <div>isLoading = {isLoading.toString()}</div>
                <div>Array.isArray(summaries) = {Array.isArray(summaries).toString()}</div>
                <div>typeof summaries = {typeof summaries}</div>
                <div>summaries === null = {(summaries === null).toString()}</div>
                <div>summaries === undefined = {(summaries === undefined).toString()}</div>
                <div>Timestamp = {new Date().toISOString()}</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VendorAdjustmentsSummaryTable;
