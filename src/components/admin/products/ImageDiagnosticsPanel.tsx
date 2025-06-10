
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, Clock, Image as ImageIcon, RefreshCw, Wrench, AlertCircle } from 'lucide-react';
import { useImageDiagnostics } from '@/hooks/useImageDiagnostics';
import LoadingState from '@/components/common/LoadingState';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ImageCorrectionPanel from './ImageCorrectionPanel';

interface ImageDiagnosticsPanelProps {
  products: any[];
  onRefresh?: () => void;
}

const ImageDiagnosticsPanel: React.FC<ImageDiagnosticsPanelProps> = ({ 
  products, 
  onRefresh 
}) => {
  const { 
    diagnostics, 
    isRunning, 
    runDiagnostics, 
    getProblematicImages, 
    getImagesThatNeedCorrection,
    getStatistics 
  } = useImageDiagnostics();

  const handleRunDiagnostics = async () => {
    await runDiagnostics(products);
  };

  const stats = getStatistics();
  const problematicImages = getProblematicImages();
  const imagesThatNeedCorrection = getImagesThatNeedCorrection();

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <ImageIcon size={20} />
          Diagnóstico Completo de Imagens
        </h3>
        <div className="flex gap-2">
          <Button
            onClick={handleRunDiagnostics}
            disabled={isRunning}
            variant="outline"
            size="sm"
          >
            {isRunning ? (
              <>
                <RefreshCw size={16} className="animate-spin mr-2" />
                Verificando...
              </>
            ) : (
              <>
                <RefreshCw size={16} className="mr-2" />
                Verificar Imagens
              </>
            )}
          </Button>
          {onRefresh && (
            <Button onClick={onRefresh} variant="outline" size="sm">
              Atualizar Dados
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="diagnostics" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="diagnostics">Diagnóstico de URLs</TabsTrigger>
          <TabsTrigger value="correction">Correção de Dados</TabsTrigger>
        </TabsList>

        <TabsContent value="diagnostics" className="space-y-4">
          {isRunning ? (
            <LoadingState text="Verificando imagens dos produtos..." />
          ) : diagnostics.length > 0 ? (
            <div className="space-y-4">
              {/* Enhanced Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                  <div className="text-sm text-blue-600">Total</div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{stats.valid}</div>
                  <div className="text-sm text-green-600">Válidas ({stats.validPercentage}%)</div>
                </div>
                <div className="bg-red-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{stats.invalid}</div>
                  <div className="text-sm text-red-600">Com Problemas</div>
                </div>
                <div className="bg-orange-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{stats.needsCorrection}</div>
                  <div className="text-sm text-orange-600">Precisam Correção</div>
                </div>
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{stats.avgResponseTime}ms</div>
                  <div className="text-sm text-yellow-600">Tempo Médio</div>
                </div>
              </div>

              {/* Images that need correction */}
              {imagesThatNeedCorrection.length > 0 && (
                <div>
                  <h4 className="text-md font-semibold mb-3 flex items-center gap-2 text-orange-600">
                    <Wrench size={18} />
                    Produtos com Dados Malformados ({imagesThatNeedCorrection.length})
                  </h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {imagesThatNeedCorrection.map((diagnostic) => (
                      <div key={diagnostic.productId} className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-sm">{diagnostic.productName}</div>
                            <div className="text-xs text-gray-600 mt-1">
                              ID: {diagnostic.productId}
                            </div>
                            <div className="text-xs text-orange-600 mt-1">
                              Formato: {diagnostic.originalFormat}
                            </div>
                            {diagnostic.parseErrors && diagnostic.parseErrors.length > 0 && (
                              <div className="text-xs text-red-500 mt-1">
                                Erros: {diagnostic.parseErrors.join(', ')}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-orange-500">
                            <AlertCircle size={16} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Problematic Images */}
              {problematicImages.length > 0 && (
                <div>
                  <h4 className="text-md font-semibold mb-3 flex items-center gap-2 text-red-600">
                    <AlertTriangle size={18} />
                    Produtos com URLs Inválidas ({problematicImages.length})
                  </h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {problematicImages.map((diagnostic) => (
                      <div key={diagnostic.productId} className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-sm">{diagnostic.productName}</div>
                            <div className="text-xs text-gray-600 mt-1">
                              ID: {diagnostic.productId}
                            </div>
                            <div className="text-xs text-red-600 mt-1">
                              {diagnostic.errorMessage}
                            </div>
                            {diagnostic.imageUrl && (
                              <div className="text-xs text-gray-500 mt-1 break-all">
                                URL: {diagnostic.imageUrl.length > 60 
                                  ? diagnostic.imageUrl.substring(0, 60) + '...' 
                                  : diagnostic.imageUrl}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-red-500">
                            <AlertTriangle size={16} />
                            {diagnostic.responseTime && (
                              <span className="text-xs">{diagnostic.responseTime}ms</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Success message if all images are valid */}
              {problematicImages.length === 0 && imagesThatNeedCorrection.length === 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                  <CheckCircle size={20} className="text-green-600" />
                  <div>
                    <div className="font-medium text-green-800">Todas as imagens estão funcionando perfeitamente!</div>
                    <div className="text-sm text-green-600">
                      Nenhum problema encontrado nas {stats.total} imagens verificadas.
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <ImageIcon size={48} className="mx-auto text-gray-400 mb-4" />
              <div className="text-gray-600 mb-4">
                Clique em "Verificar Imagens" para analisar a saúde das imagens dos produtos.
              </div>
              <div className="text-sm text-gray-500">
                Esta ferramenta irá verificar se todas as URLs de imagem estão funcionando corretamente e identificar dados malformados.
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="correction">
          <ImageCorrectionPanel onRefresh={onRefresh} />
        </TabsContent>
      </Tabs>
    </Card>
  );
};

export default ImageDiagnosticsPanel;
