
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, Database, AlertTriangle, CheckCircle } from 'lucide-react';

interface DebugOrdersViewProps {
  debugData: any;
}

const DebugOrdersView: React.FC<DebugOrdersViewProps> = ({ debugData }) => {
  const [isOpen, setIsOpen] = useState(true);
  
  if (!debugData) {
    return (
      <Card className="p-4 mb-4 border-orange-300 bg-orange-50">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          <p className="text-orange-700">Nenhum dado de depuração disponível</p>
        </div>
      </Card>
    );
  }
  
  const { orders = [], debug = {} } = debugData;
  
  const hasOrders = orders && orders.length > 0;
  const hasErrors = debug.error || debug.orderItemsError || debug.ordersError || debug.legacyItemsError || debug.legacyOrdersError;
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mb-6">
      <Card className={`p-4 mb-2 ${hasErrors ? 'border-red-300 bg-red-50' : 'border-blue-300 bg-blue-50'}`}>
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-blue-800">Modo de Depuração</h3>
              {hasOrders ? (
                <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                  {orders.length} pedidos encontrados
                </Badge>
              ) : (
                <Badge className="bg-red-100 text-red-800 hover:bg-red-200">
                  Nenhum pedido
                </Badge>
              )}
              {hasErrors && (
                <Badge className="bg-red-100 text-red-800 hover:bg-red-200">
                  Erros encontrados
                </Badge>
              )}
            </div>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" aria-label="Toggle debug panel">
              {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="mt-4">
          <Tabs defaultValue="summary" className="w-full">
            <TabsList>
              <TabsTrigger value="summary">Resumo</TabsTrigger>
              <TabsTrigger value="queries">Consultas</TabsTrigger>
              <TabsTrigger value="raw">Dados brutos</TabsTrigger>
            </TabsList>
            
            <TabsContent value="summary" className="p-4 bg-white rounded-md mt-2">
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">Diagnóstico</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Products Information */}
                  <div className="p-3 border rounded-md">
                    <h5 className="font-medium text-sm mb-2 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      Produtos do Vendedor
                    </h5>
                    <p className="text-sm">
                      {debug.vendorProductsCount ? (
                        <span className="flex items-center gap-1">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          {debug.vendorProductsCount} produtos encontrados
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-600">
                          <AlertTriangle className="h-4 w-4" />
                          Nenhum produto encontrado
                        </span>
                      )}
                    </p>
                  </div>
                  
                  {/* Order Items Information */}
                  <div className="p-3 border rounded-md">
                    <h5 className="font-medium text-sm mb-2 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      Itens de Pedido
                    </h5>
                    <p className="text-sm">
                      {debug.orderItemsCount ? (
                        <span className="flex items-center gap-1">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          {debug.orderItemsCount} itens encontrados em pedidos
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-600">
                          <AlertTriangle className="h-4 w-4" />
                          Nenhum item de pedido encontrado com produtos deste vendedor
                        </span>
                      )}
                    </p>
                  </div>
                  
                  {/* Orders Information */}
                  <div className="p-3 border rounded-md">
                    <h5 className="font-medium text-sm mb-2 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      Pedidos
                    </h5>
                    <p className="text-sm">
                      {debug.ordersCount ? (
                        <span className="flex items-center gap-1">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          {debug.ordersCount} pedidos encontrados
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-600">
                          <AlertTriangle className="h-4 w-4" />
                          Nenhum pedido encontrado
                        </span>
                      )}
                    </p>
                  </div>
                  
                  {/* Processed Orders */}
                  <div className="p-3 border rounded-md">
                    <h5 className="font-medium text-sm mb-2 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      Pedidos Processados
                    </h5>
                    <p className="text-sm">
                      {debug.processedOrdersCount ? (
                        <span className="flex items-center gap-1">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          {debug.processedOrdersCount} pedidos processados com sucesso
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-600">
                          <AlertTriangle className="h-4 w-4" />
                          Nenhum pedido foi processado completamente
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                
                {/* Error Messages */}
                {hasErrors && (
                  <div className="p-3 border border-red-200 rounded-md bg-red-50">
                    <h5 className="font-medium text-sm mb-2 text-red-700">Erros Encontrados</h5>
                    <ul className="text-sm text-red-600 space-y-1">
                      {debug.error && <li>• {debug.error}</li>}
                      {debug.orderItemsError && <li>• Erro ao consultar itens de pedido: {debug.orderItemsError}</li>}
                      {debug.ordersError && <li>• Erro ao consultar pedidos: {debug.ordersError}</li>}
                      {debug.legacyItemsError && <li>• Erro ao consultar itens de pedido antigos: {debug.legacyItemsError}</li>}
                      {debug.legacyOrdersError && <li>• Erro ao consultar pedidos antigos: {debug.legacyOrdersError}</li>}
                    </ul>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="queries" className="p-4 bg-white rounded-md mt-2">
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">Tabelas Consultadas</h4>
                
                <div className="space-y-2">
                  {debug.queriedTables?.map((table: string, index: number) => (
                    <div key={index} className="p-2 border rounded flex items-center gap-2">
                      <Database className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">{table}</span>
                    </div>
                  ))}
                  
                  {(!debug.queriedTables || debug.queriedTables.length === 0) && (
                    <p className="text-sm text-gray-500">Nenhuma tabela consultada</p>
                  )}
                </div>
                
                {debug.vendorProductsSample && (
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold mb-2">Amostra de Produtos do Vendedor</h4>
                    <div className="p-2 border rounded-md overflow-x-auto">
                      <pre className="text-xs">{JSON.stringify(debug.vendorProductsSample, null, 2)}</pre>
                    </div>
                  </div>
                )}
                
                {debug.orderItemsSample && (
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold mb-2">Amostra de Itens de Pedido</h4>
                    <div className="p-2 border rounded-md overflow-x-auto">
                      <pre className="text-xs">{JSON.stringify(debug.orderItemsSample, null, 2)}</pre>
                    </div>
                  </div>
                )}
                
                {debug.ordersSample && (
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold mb-2">Amostra de Pedidos</h4>
                    <div className="p-2 border rounded-md overflow-x-auto">
                      <pre className="text-xs">{JSON.stringify(debug.ordersSample, null, 2)}</pre>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="raw" className="p-4 bg-white rounded-md mt-2">
              <h4 className="text-sm font-semibold mb-2">Dados de Depuração Brutos</h4>
              <div className="p-2 border rounded-md bg-gray-50 overflow-x-auto">
                <pre className="text-xs">{JSON.stringify(debug, null, 2)}</pre>
              </div>
              
              {orders && orders.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-semibold mb-2">Pedidos Processados</h4>
                  <div className="p-2 border rounded-md bg-gray-50 overflow-x-auto">
                    <pre className="text-xs">{JSON.stringify(orders, null, 2)}</pre>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

export default DebugOrdersView;
