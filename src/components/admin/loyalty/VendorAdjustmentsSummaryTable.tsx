
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
  console.log('🚨 [VendorSummaryTable] === INVESTIGAÇÃO CRÍTICA DA UI ===');
  console.log('🚨 [VendorSummaryTable] Timestamp:', new Date().toISOString());
  console.log('🚨 [VendorSummaryTable] PROPS RECEBIDOS:');
  console.log('  - summaries type:', typeof summaries);
  console.log('  - summaries is array:', Array.isArray(summaries));
  console.log('  - summaries length:', summaries?.length || 0);
  console.log('  - isLoading:', isLoading);
  console.log('  - summaries value:', summaries);

  // INVESTIGAÇÃO CRÍTICA: Análise detalhada dos dados recebidos
  if (summaries) {
    console.log('🔍 [VendorSummaryTable] INVESTIGAÇÃO DETALHADA DOS DADOS:');
    console.log('  - Raw summaries object:', JSON.stringify(summaries, null, 2));
    
    if (Array.isArray(summaries)) {
      console.log(`  - Array válido com ${summaries.length} itens`);
      
      summaries.forEach((summary, index) => {
        console.log(`  📋 Item ${index + 1}:`, {
          vendedor_id: summary.vendedor_id,
          vendedor_nome: summary.vendedor_nome,
          total_ajustes: summary.total_ajustes,
          pontos_adicionados: summary.pontos_adicionados,
          pontos_removidos: summary.pontos_removidos,
          ultimo_ajuste: summary.ultimo_ajuste
        });
        
        // BUSCA ESPECÍFICA POR MAIS REAL
        if (summary.vendedor_nome && summary.vendedor_nome.toLowerCase().includes('mais real')) {
          console.log('🎯 [VendorSummaryTable] *** MAIS REAL ENCONTRADO NA UI! ***');
          console.log('🎯 [VendorSummaryTable] Dados do Mais Real:', summary);
        }
        
        // BUSCA ESPECÍFICA POR BEABA
        if (summary.vendedor_nome && summary.vendedor_nome.toLowerCase().includes('beaba')) {
          console.log('🎯 [VendorSummaryTable] *** BEABA ENCONTRADO NA UI! ***');
          console.log('🎯 [VendorSummaryTable] Dados do Beaba:', summary);
        }
        
        // BUSCA POR NOMES SIMILARES
        if (summary.vendedor_nome && (
          summary.vendedor_nome.toLowerCase().includes('real') ||
          summary.vendedor_nome.toLowerCase().includes('mais')
        )) {
          console.log('🔍 [VendorSummaryTable] Possível match para Mais Real:', summary.vendedor_nome);
        }
      });
      
      // ANÁLISE DE COMPLETUDE DOS DADOS
      const vendorNames = summaries.map(s => s.vendedor_nome);
      console.log('📋 [VendorSummaryTable] Todos os nomes de vendedores:', vendorNames);
      
      const maisRealFound = summaries.find(s => 
        s.vendedor_nome && s.vendedor_nome.toLowerCase().includes('mais real')
      );
      const beabaFound = summaries.find(s => 
        s.vendedor_nome && s.vendedor_nome.toLowerCase().includes('beaba')
      );
      
      console.log('🚨 [VendorSummaryTable] RESULTADO DA BUSCA:');
      console.log(`  - Mais Real encontrado: ${!!maisRealFound}`);
      console.log(`  - Beaba encontrado: ${!!beabaFound}`);
      
      if (maisRealFound) {
        console.log('✅ [VendorSummaryTable] MAIS REAL CONFIRMADO NA UI:', maisRealFound);
      } else {
        console.log('❌ [VendorSummaryTable] MAIS REAL NÃO ENCONTRADO NA UI!');
        console.log('🔍 [VendorSummaryTable] Verificando nomes similares...');
        summaries.forEach(s => {
          if (s.vendedor_nome && (
            s.vendedor_nome.includes('Real') ||
            s.vendedor_nome.includes('Mais') ||
            s.vendedor_nome.includes('real') ||
            s.vendedor_nome.includes('mais')
          )) {
            console.log(`🔍 [VendorSummaryTable] Nome similar encontrado: "${s.vendedor_nome}"`);
          }
        });
      }
    } else {
      console.log('❌ [VendorSummaryTable] ERRO: summaries não é um array!');
      console.log('  - Tipo recebido:', typeof summaries);
      console.log('  - Valor:', summaries);
    }
  } else {
    console.log('❌ [VendorSummaryTable] ERRO: summaries é null/undefined!');
  }

  // INVESTIGAÇÃO DO ESTADO DE LOADING
  console.log('⏳ [VendorSummaryTable] Estado de loading:', isLoading);
  
  if (isLoading) {
    console.log('⏳ [VendorSummaryTable] Componente em estado de loading - dados podem não ter chegado ainda');
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Resumo de Ajustes por Vendedor
            <Badge variant="outline" className="ml-2 bg-yellow-100 text-yellow-800">
              🔄 Investigando dados...
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
            <strong>🔍 Investigação:</strong> Aguardando dados do servidor...
          </div>
        </CardContent>
      </Card>
    );
  }

  // VALIDAÇÃO FINAL ANTES DA RENDERIZAÇÃO
  const hasValidData = summaries && Array.isArray(summaries) && summaries.length > 0;
  console.log('🚨 [VendorSummaryTable] DECISÃO FINAL DE RENDERIZAÇÃO:');
  console.log(`  - hasValidData: ${hasValidData}`);
  console.log(`  - summaries exists: ${!!summaries}`);
  console.log(`  - is array: ${Array.isArray(summaries)}`);
  console.log(`  - length > 0: ${summaries && summaries.length > 0}`);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Resumo de Ajustes por Vendedor
          <Badge variant="outline" className="ml-2">
            {summaries?.length || 0} vendedores
          </Badge>
          
          {/* INDICADORES DE INVESTIGAÇÃO */}
          {hasValidData && (
            <Badge variant="default" className="ml-2 bg-green-100 text-green-800">
              ✅ {summaries.length} dados carregados
            </Badge>
          )}
          {!hasValidData && (
            <Badge variant="destructive" className="ml-2">
              🚨 DADOS INVÁLIDOS
            </Badge>
          )}
          
          {/* INDICADOR ESPECÍFICO PARA MAIS REAL */}
          {hasValidData && summaries.find(s => s.vendedor_nome?.toLowerCase().includes('mais real')) && (
            <Badge variant="default" className="ml-2 bg-blue-100 text-blue-800">
              🎯 Mais Real DETECTADO
            </Badge>
          )}
          
          {/* INDICADOR DE PROBLEMA COM MAIS REAL */}
          {hasValidData && !summaries.find(s => s.vendedor_nome?.toLowerCase().includes('mais real')) && (
            <Badge variant="destructive" className="ml-2">
              ⚠️ Mais Real AUSENTE
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hasValidData ? (
          <>
            {/* PAINEL DE INVESTIGAÇÃO DETALHADO */}
            <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 text-blue-800 text-sm font-bold mb-3">
                <Bug className="h-5 w-5" />
                🚨 INVESTIGAÇÃO CRÍTICA DA UI - DADOS RECEBIDOS
              </div>
              <div className="text-xs text-blue-700 space-y-2 font-mono">
                <div><strong>Total de vendedores recebidos:</strong> {summaries.length}</div>
                <div><strong>Nomes dos vendedores:</strong> {summaries.map(s => `"${s.vendedor_nome}"`).join(', ')}</div>
                <div><strong>Mais Real encontrado:</strong> {summaries.find(s => s.vendedor_nome?.toLowerCase().includes('mais real')) ? 'SIM ✅' : 'NÃO ❌'}</div>
                <div><strong>Beaba encontrado:</strong> {summaries.find(s => s.vendedor_nome?.toLowerCase().includes('beaba')) ? 'SIM ✅' : 'NÃO ❌'}</div>
                <div><strong>Timestamp da renderização:</strong> {new Date().toISOString()}</div>
                <div><strong>Props summaries type:</strong> {typeof summaries} (length: {summaries.length})</div>
                
                {/* ANÁLISE ESPECÍFICA DE CADA VENDEDOR */}
                <div className="mt-3 pt-2 border-t border-blue-300">
                  <strong>Análise individual:</strong>
                  {summaries.map((summary, idx) => (
                    <div key={idx} className="ml-2">
                      • [{idx + 1}] "{summary.vendedor_nome}" - {summary.total_ajustes} ajustes
                      {summary.vendedor_nome?.toLowerCase().includes('mais real') && ' 🎯 MAIS REAL!'}
                      {summary.vendedor_nome?.toLowerCase().includes('beaba') && ' 🎯 BEABA!'}
                    </div>
                  ))}
                </div>
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
                  const isMaisReal = summary.vendedor_nome?.toLowerCase().includes('mais real');
                  const isBeaba = summary.vendedor_nome?.toLowerCase().includes('beaba');
                  
                  console.log(`🎨 [VendorSummaryTable] RENDERIZANDO LINHA ${index + 1}:`, {
                    vendedor_nome: summary.vendedor_nome,
                    total_ajustes: summary.total_ajustes,
                    isMaisReal,
                    isBeaba
                  });
                  
                  if (isMaisReal) {
                    console.log('🎯 [VendorSummaryTable] *** RENDERIZANDO MAIS REAL! ***', summary);
                  }
                  
                  return (
                    <TableRow 
                      key={summary.vendedor_id} 
                      className={`hover:bg-gray-50 ${
                        isMaisReal ? 'bg-yellow-50 border-l-4 border-yellow-400' : 
                        isBeaba ? 'bg-green-50 border-l-4 border-green-400' : ''
                      }`}
                    >
                      <TableCell>
                        <div className="font-medium flex items-center gap-2">
                          {summary.vendedor_nome}
                          {isMaisReal && (
                            <Badge variant="outline" className="bg-yellow-100 text-yellow-800 text-xs">
                              🎯 Mais Real
                            </Badge>
                          )}
                          {isBeaba && (
                            <Badge variant="outline" className="bg-green-100 text-green-800 text-xs">
                              🎯 Beaba
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
              <AlertTriangle className="h-12 w-12 text-red-500" />
              <div>
                <p className="text-gray-500 font-medium">🚨 INVESTIGAÇÃO: Problema detectado nos dados</p>
                <p className="text-sm text-gray-400 mt-1">Os dados não chegaram corretamente ao componente</p>
              </div>
              
              {/* PAINEL DE DIAGNÓSTICO DETALHADO */}
              <div className="text-xs text-red-700 bg-red-50 p-4 rounded border font-mono max-w-2xl">
                <div className="font-bold mb-3 text-center">🚨 DIAGNÓSTICO CRÍTICO DE DADOS 🚨</div>
                <div className="space-y-1">
                  <div><strong>summaries recebido:</strong> {JSON.stringify(summaries)}</div>
                  <div><strong>tipo de summaries:</strong> {typeof summaries}</div>
                  <div><strong>summaries é array:</strong> {Array.isArray(summaries).toString()}</div>
                  <div><strong>length de summaries:</strong> {summaries?.length || 'N/A'}</div>
                  <div><strong>isLoading:</strong> {isLoading.toString()}</div>
                  <div><strong>summaries === null:</strong> {(summaries === null).toString()}</div>
                  <div><strong>summaries === undefined:</strong> {(summaries === undefined).toString()}</div>
                  <div><strong>hasValidData calculado:</strong> {hasValidData.toString()}</div>
                  <div><strong>Timestamp do erro:</strong> {new Date().toISOString()}</div>
                </div>
                
                <div className="mt-3 pt-2 border-t border-red-300">
                  <div className="text-red-800 font-bold">🔍 POSSÍVEIS CAUSAS:</div>
                  <div className="text-red-700 text-xs mt-1">
                    • Dados não foram fetched corretamente do backend<br/>
                    • React Query retornou dados em formato incorreto<br/>
                    • Cache corrompido ou desatualizado<br/>
                    • Erro no processamento dos dados antes de chegar na UI<br/>
                    • Problema na query ou no service layer
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VendorAdjustmentsSummaryTable;
