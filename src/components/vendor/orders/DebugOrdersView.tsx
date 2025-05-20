
import React from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface DebugOrdersViewProps {
  debugData: any;
}

const DebugOrdersView: React.FC<DebugOrdersViewProps> = ({ debugData }) => {
  // Only show debug view if data exists
  if (!debugData) return null;

  const { orders, debug } = debugData;
  
  return (
    <Card className="p-4 mb-6 overflow-auto border-blue-300 bg-blue-50">
      <h2 className="text-lg font-bold mb-4 text-blue-700">Diagnóstico de Pedidos</h2>
      
      <Tabs defaultValue="summary">
        <TabsList className="mb-4">
          <TabsTrigger value="summary">Resumo</TabsTrigger>
          <TabsTrigger value="vendorInfo">Vendedor</TabsTrigger>
          <TabsTrigger value="queries">Consultas</TabsTrigger>
          <TabsTrigger value="data">Dados</TabsTrigger>
        </TabsList>
        
        <TabsContent value="summary" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 border rounded bg-white">
              <h3 className="font-medium text-sm text-blue-800 mb-1">Produtos do Vendedor</h3>
              <p className="text-2xl font-bold">{debug?.vendorProductsCount || 0}</p>
            </div>
            <div className="p-3 border rounded bg-white">
              <h3 className="font-medium text-sm text-blue-800 mb-1">Itens de Pedido</h3>
              <p className="text-2xl font-bold">{debug?.orderItemsCount || 0}</p>
            </div>
            <div className="p-3 border rounded bg-white">
              <h3 className="font-medium text-sm text-blue-800 mb-1">Pedidos Encontrados</h3>
              <p className="text-2xl font-bold">{debug?.ordersCount || 0}</p>
            </div>
            <div className="p-3 border rounded bg-white">
              <h3 className="font-medium text-sm text-blue-800 mb-1">Pedidos Processados</h3>
              <p className="text-2xl font-bold">{debug?.processedOrdersCount || 0}</p>
            </div>
          </div>

          {debug?.error && (
            <div className="p-3 border rounded bg-red-50 border-red-300">
              <h3 className="font-medium text-red-800">Erro Encontrado</h3>
              <p className="text-red-700">{debug.error}</p>
            </div>
          )}

          <Accordion type="single" collapsible className="bg-white border rounded">
            <AccordionItem value="diagnostics">
              <AccordionTrigger className="px-4">Informações de Diagnóstico</AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <ul className="text-sm space-y-1">
                  <li><span className="font-medium">ID do Vendedor:</span> {debug?.vendorId}</li>
                  <li><span className="font-medium">Timestamp:</span> {debug?.timestamp}</li>
                  <li><span className="font-medium">Total de Itens no Sistema:</span> {debug?.totalOrderItemsInSystem || 'N/A'}</li>
                  <li><span className="font-medium">Total de Pedidos no Sistema:</span> {debug?.totalOrdersInSystem || 'N/A'}</li>
                  <li><span className="font-medium">Tabelas Consultadas:</span> {debug?.queriedTables?.join(', ') || 'Nenhuma'}</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </TabsContent>
        
        <TabsContent value="vendorInfo" className="space-y-4">
          <Card className="p-4">
            <h3 className="font-medium mb-2">Produtos do Vendedor</h3>
            <div className="max-h-60 overflow-auto bg-gray-50 p-2 rounded border text-sm">
              <pre>{JSON.stringify(debug?.vendorProductsSample || [], null, 2)}</pre>
            </div>
          </Card>
          
          <Card className="p-4">
            <h3 className="font-medium mb-2">IDs dos Produtos</h3>
            <div className="max-h-60 overflow-auto bg-gray-50 p-2 rounded border text-sm">
              <pre>{debug?.vendorProductIds || 'Nenhum'}</pre>
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="queries" className="space-y-4">
          <Card className="p-4">
            <h3 className="font-medium mb-2">Consultas Realizadas</h3>
            <div className="max-h-96 overflow-auto">
              {debug?.queries?.map((query: any, index: number) => (
                <div key={index} className="p-3 border rounded mb-2 bg-white">
                  <p><span className="font-medium">Tabela:</span> {query.table}</p>
                  <p><span className="font-medium">Operação:</span> {query.operation}</p>
                  <p><span className="font-medium">Filtro:</span> {query.filter}</p>
                  <p><span className="font-medium">Timestamp:</span> {query.timestamp}</p>
                </div>
              ))}
              {(!debug?.queries || debug.queries.length === 0) && (
                <p className="text-gray-500">Nenhuma consulta registrada</p>
              )}
            </div>
          </Card>
          
          {debug?.appliedFilters && (
            <Card className="p-4">
              <h3 className="font-medium mb-2">Filtros Aplicados</h3>
              <div className="bg-gray-50 p-2 rounded border text-sm overflow-auto">
                <pre>{JSON.stringify(debug.appliedFilters, null, 2)}</pre>
              </div>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="data" className="space-y-4">
          <Card className="p-4">
            <h3 className="font-medium mb-2">Amostra de Itens de Pedido</h3>
            <div className="max-h-60 overflow-auto bg-gray-50 p-2 rounded border text-sm">
              <pre>{JSON.stringify(debug?.orderItemsSample || [], null, 2)}</pre>
            </div>
          </Card>
          
          <Card className="p-4">
            <h3 className="font-medium mb-2">Amostra de Pedidos Processados</h3>
            <div className="max-h-60 overflow-auto bg-gray-50 p-2 rounded border text-sm">
              <pre>{JSON.stringify(debug?.processedOrdersSample || [], null, 2)}</pre>
            </div>
          </Card>
          
          {orders?.length > 0 && (
            <Card className="p-4">
              <h3 className="font-medium mb-2">Dados de Pedidos</h3>
              <div className="max-h-96 overflow-auto bg-gray-50 p-2 rounded border text-sm">
                <pre>{JSON.stringify(orders[0], null, 2)}</pre>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </Card>
  );
};

export default DebugOrdersView;
