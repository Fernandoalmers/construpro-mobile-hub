import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, AlertTriangle, Info, Eye, EyeOff, Bug } from 'lucide-react';
import { useDeliveryZones } from '@/hooks/useDeliveryZones';
import { useMarketplaceFilters } from '@/hooks/useMarketplaceFilters';
import { useQueryClient } from '@tanstack/react-query';

interface MarketplaceDebugPanelProps {
  products: any[];
  stores: any[];
  isLoading: boolean;
  error: string | null;
}

const MarketplaceDebugPanel: React.FC<MarketplaceDebugPanelProps> = ({
  products,
  stores,
  isLoading,
  error
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const queryClient = useQueryClient();
  const { currentZones, currentCep, hasActiveZones } = useDeliveryZones();
  const { shouldShowAllProducts, isFilteredByZone, hasDefinedCepWithoutCoverage, currentZoneInfo } = useMarketplaceFilters();

  // Análise de produtos da Beaba
  const beabaProducts = products.filter(p => 
    p?.store_name?.toLowerCase().includes('beaba') || 
    p?.vendedores?.nome_loja?.toLowerCase().includes('beaba')
  );

  const beabaStores = stores.filter(s => 
    s?.nome?.toLowerCase().includes('beaba') || 
    s?.nome_loja?.toLowerCase().includes('beaba')
  );

  // Análise de zonas
  const beabaVendorIds = beabaStores.map(s => s.id);
  const beabaInZones = currentZones.filter(z => beabaVendorIds.includes(z.vendor_id));

  const handleForceRefresh = () => {
    console.log('[MarketplaceDebugPanel] 🔄 Forçando refresh completo...');
    queryClient.invalidateQueries({ queryKey: ['marketplace-products'] });
    queryClient.invalidateQueries({ queryKey: ['marketplace-stores'] });
    queryClient.refetchQueries({ queryKey: ['marketplace-products'] });
  };

  const handleShowAllProducts = () => {
    console.log('[MarketplaceDebugPanel] 🌍 Forçando exibição de todos os produtos...');
    // Isso pode ser implementado se necessário
  };

  if (!isExpanded) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsExpanded(true)}
          variant="outline"
          size="sm"
          className="bg-yellow-50 border-yellow-300 text-yellow-800 hover:bg-yellow-100"
        >
          <Bug className="w-4 h-4 mr-1" />
          Debug Beaba
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-96 overflow-y-auto">
      <Card className="p-4 bg-white border-2 border-yellow-300 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Bug className="w-4 h-4 text-yellow-600" />
            <h3 className="font-bold text-sm">Debug - Loja Beaba</h3>
          </div>
          <Button
            onClick={() => setIsExpanded(false)}
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
          >
            <EyeOff className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-3 text-xs">
          {/* Status Geral */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Info className="w-3 h-3" />
              <span className="font-semibold">Status Geral</span>
            </div>
            <div className="grid grid-cols-2 gap-1 text-xs">
              <Badge variant={isLoading ? "secondary" : "default"}>
                {isLoading ? "Carregando" : "Carregado"}
              </Badge>
              <Badge variant={error ? "destructive" : "default"}>
                {error ? "Erro" : "OK"}
              </Badge>
            </div>
          </div>

          {/* Produtos */}
          <div>
            <div className="font-semibold mb-1">Produtos</div>
            <div className="space-y-1">
              <div>Total: <span className="font-mono">{products.length}</span></div>
              <div className="flex items-center gap-2">
                <span>Beaba:</span>
                <Badge variant={beabaProducts.length > 0 ? "default" : "destructive"}>
                  {beabaProducts.length}
                </Badge>
              </div>
              {beabaProducts.length > 0 && (
                <div className="text-xs text-gray-600 bg-gray-50 p-1 rounded">
                  {beabaProducts.map(p => p.nome).join(', ')}
                </div>
              )}
            </div>
          </div>

          {/* Lojas */}
          <div>
            <div className="font-semibold mb-1">Lojas</div>
            <div className="space-y-1">
              <div>Total: <span className="font-mono">{stores.length}</span></div>
              <div className="flex items-center gap-2">
                <span>Beaba:</span>
                <Badge variant={beabaStores.length > 0 ? "default" : "destructive"}>
                  {beabaStores.length}
                </Badge>
              </div>
            </div>
          </div>

          {/* Zonas de Entrega */}
          <div>
            <div className="font-semibold mb-1">Zonas de Entrega</div>
            <div className="space-y-1">
              <div>CEP: <span className="font-mono">{currentCep || 'Nenhum'}</span></div>
              <div>Zonas: <span className="font-mono">{currentZones.length}</span></div>
              <div className="flex items-center gap-2">
                <span>Beaba nas zonas:</span>
                <Badge variant={beabaInZones.length > 0 ? "default" : "destructive"}>
                  {beabaInZones.length}
                </Badge>
              </div>
            </div>
          </div>

          {/* Estados do Filtro */}
          <div>
            <div className="font-semibold mb-1">Filtros</div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span>Todos produtos:</span>
                <Badge variant={shouldShowAllProducts ? "default" : "secondary"}>
                  {shouldShowAllProducts ? "Sim" : "Não"}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span>Filtrado por zona:</span>
                <Badge variant={isFilteredByZone ? "default" : "secondary"}>
                  {isFilteredByZone ? "Sim" : "Não"}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span>CEP sem cobertura:</span>
                <Badge variant={hasDefinedCepWithoutCoverage ? "destructive" : "default"}>
                  {hasDefinedCepWithoutCoverage ? "Sim" : "Não"}
                </Badge>
              </div>
            </div>
          </div>

          {/* Diagnóstico */}
          {beabaProducts.length === 0 && beabaStores.length > 0 && (
            <div className="bg-red-50 p-2 rounded">
              <div className="flex items-center gap-1 text-red-700 font-semibold mb-1">
                <AlertTriangle className="w-3 h-3" />
                Problema Detectado
              </div>
              <div className="text-red-600 text-xs">
                Loja Beaba existe mas produtos não aparecem. Provável filtro de zona.
              </div>
            </div>
          )}

          {/* Ações */}
          <div className="space-y-2 pt-2 border-t">
            <Button
              onClick={handleForceRefresh}
              variant="outline"
              size="sm"
              className="w-full"
              disabled={isLoading}
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Forçar Refresh
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default MarketplaceDebugPanel;