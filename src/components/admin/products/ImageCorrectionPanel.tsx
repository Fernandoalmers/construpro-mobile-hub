
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, RefreshCw, Wrench, Eye, EyeOff } from 'lucide-react';
import { 
  scanProductImageIssues, 
  autoCorrectProductImages, 
  correctProductImage,
  type ProductImageIssue,
  type ImageCorrectionResult
} from '@/services/admin/products/imageCorrection';
import LoadingState from '@/components/common/LoadingState';
import { toast } from '@/components/ui/sonner';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface ImageCorrectionPanelProps {
  onRefresh?: () => void;
}

const ImageCorrectionPanel: React.FC<ImageCorrectionPanelProps> = ({ onRefresh }) => {
  const [issues, setIssues] = useState<ProductImageIssue[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isCorrecting, setIsCorrecting] = useState(false);
  const [correctionResult, setCorrectionResult] = useState<ImageCorrectionResult | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const handleScanIssues = async () => {
    setIsScanning(true);
    try {
      const foundIssues = await scanProductImageIssues();
      setIssues(foundIssues);
      toast.success(`Encontrados ${foundIssues.length} produtos com problemas de imagem`);
    } catch (error) {
      console.error('Error scanning issues:', error);
      toast.error('Erro ao escanear problemas de imagem');
    } finally {
      setIsScanning(false);
    }
  };

  const handleAutoCorrect = async () => {
    setIsCorrecting(true);
    try {
      const result = await autoCorrectProductImages();
      setCorrectionResult(result);
      
      if (result.corrected > 0) {
        toast.success(`${result.corrected} produtos corrigidos com sucesso!`);
        // Refresh the issues list
        await handleScanIssues();
        // Refresh parent data
        if (onRefresh) {
          onRefresh();
        }
      } else {
        toast.info('Nenhum produto foi corrigido automaticamente');
      }
    } catch (error) {
      console.error('Error auto-correcting:', error);
      toast.error('Erro durante a correção automática');
    } finally {
      setIsCorrecting(false);
    }
  };

  const handleCorrectSingle = async (issue: ProductImageIssue) => {
    try {
      const success = await correctProductImage(issue.id, issue.suggestedData);
      if (success) {
        toast.success(`Produto "${issue.nome}" corrigido com sucesso!`);
        // Remove from issues list
        setIssues(prev => prev.filter(i => i.id !== issue.id));
        if (onRefresh) {
          onRefresh();
        }
      } else {
        toast.error(`Erro ao corrigir produto "${issue.nome}"`);
      }
    } catch (error) {
      console.error('Error correcting single product:', error);
      toast.error('Erro inesperado ao corrigir produto');
    }
  };

  const toggleExpanded = (issueId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(issueId)) {
        newSet.delete(issueId);
      } else {
        newSet.add(issueId);
      }
      return newSet;
    });
  };

  const autoFixableIssues = issues.filter(issue => issue.canAutoFix);
  const manualFixIssues = issues.filter(issue => !issue.canAutoFix);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Wrench size={20} />
          Correção de Dados de Imagem
        </h3>
        <div className="flex gap-2">
          <Button
            onClick={handleScanIssues}
            disabled={isScanning}
            variant="outline"
            size="sm"
          >
            {isScanning ? (
              <>
                <RefreshCw size={16} className="animate-spin mr-2" />
                Escaneando...
              </>
            ) : (
              <>
                <RefreshCw size={16} className="mr-2" />
                Escanear Problemas
              </>
            )}
          </Button>
          {autoFixableIssues.length > 0 && (
            <Button
              onClick={handleAutoCorrect}
              disabled={isCorrecting}
              size="sm"
            >
              {isCorrecting ? (
                <>
                  <RefreshCw size={16} className="animate-spin mr-2" />
                  Corrigindo...
                </>
              ) : (
                <>
                  <Wrench size={16} className="mr-2" />
                  Corrigir Automaticamente ({autoFixableIssues.length})
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {isScanning ? (
        <LoadingState text="Escaneando produtos para problemas de imagem..." />
      ) : issues.length > 0 ? (
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-red-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{issues.length}</div>
              <div className="text-sm text-red-600">Total de Problemas</div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{autoFixableIssues.length}</div>
              <div className="text-sm text-green-600">Correção Automática</div>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{manualFixIssues.length}</div>
              <div className="text-sm text-yellow-600">Correção Manual</div>
            </div>
            {correctionResult && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{correctionResult.corrected}</div>
                <div className="text-sm text-blue-600">Último Resultado</div>
              </div>
            )}
          </div>

          {/* Auto-fixable Issues */}
          {autoFixableIssues.length > 0 && (
            <div>
              <h4 className="text-md font-semibold mb-3 flex items-center gap-2 text-green-600">
                <CheckCircle size={18} />
                Problemas com Correção Automática ({autoFixableIssues.length})
              </h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {autoFixableIssues.map((issue) => (
                  <Collapsible key={issue.id}>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{issue.nome}</div>
                          <div className="text-xs text-gray-600 mt-1">
                            ID: {issue.id}
                          </div>
                          <div className="text-xs text-green-600 mt-1">
                            {issue.errorType}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <CollapsibleTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleExpanded(issue.id)}
                            >
                              {expandedItems.has(issue.id) ? (
                                <EyeOff size={16} />
                              ) : (
                                <Eye size={16} />
                              )}
                            </Button>
                          </CollapsibleTrigger>
                          <Button
                            onClick={() => handleCorrectSingle(issue)}
                            size="sm"
                            variant="outline"
                          >
                            Corrigir
                          </Button>
                        </div>
                      </div>
                      <CollapsibleContent>
                        <div className="mt-3 pt-3 border-t border-green-200">
                          <div className="text-xs">
                            <div className="mb-2">
                              <strong>Dados Atuais:</strong>
                              <pre className="bg-gray-100 p-2 rounded mt-1 text-xs overflow-x-auto">
                                {JSON.stringify(issue.currentData, null, 2)}
                              </pre>
                            </div>
                            <div>
                              <strong>Dados Corrigidos:</strong>
                              <pre className="bg-green-100 p-2 rounded mt-1 text-xs overflow-x-auto">
                                {issue.suggestedData}
                              </pre>
                            </div>
                          </div>
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                ))}
              </div>
            </div>
          )}

          {/* Manual fix issues */}
          {manualFixIssues.length > 0 && (
            <div>
              <h4 className="text-md font-semibold mb-3 flex items-center gap-2 text-yellow-600">
                <AlertTriangle size={18} />
                Problemas que Precisam de Correção Manual ({manualFixIssues.length})
              </h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {manualFixIssues.map((issue) => (
                  <div key={issue.id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="font-medium text-sm">{issue.nome}</div>
                    <div className="text-xs text-gray-600 mt-1">
                      ID: {issue.id}
                    </div>
                    <div className="text-xs text-yellow-600 mt-1">
                      {issue.errorType}
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      <strong>Dados:</strong> {JSON.stringify(issue.currentData)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Correction Result */}
          {correctionResult && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-2">Resultado da Última Correção:</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                <div>Processados: <strong>{correctionResult.totalProcessed}</strong></div>
                <div>Corrigidos: <strong className="text-green-600">{correctionResult.corrected}</strong></div>
                <div>Falharam: <strong className="text-red-600">{correctionResult.failed}</strong></div>
                <div>Ignorados: <strong className="text-yellow-600">{correctionResult.skipped}</strong></div>
              </div>
              {correctionResult.errors.length > 0 && (
                <div className="mt-2">
                  <strong>Erros:</strong>
                  <ul className="list-disc list-inside text-sm text-red-600 mt-1">
                    {correctionResult.errors.slice(0, 5).map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                    {correctionResult.errors.length > 5 && (
                      <li>... e mais {correctionResult.errors.length - 5} erros</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8">
          <Wrench size={48} className="mx-auto text-gray-400 mb-4" />
          <div className="text-gray-600 mb-4">
            Clique em "Escanear Problemas" para identificar produtos com dados de imagem malformados.
          </div>
          <div className="text-sm text-gray-500">
            Esta ferramenta pode corrigir automaticamente arrays JSON malformados e outras inconsistências nos dados de imagem.
          </div>
        </div>
      )}
    </Card>
  );
};

export default ImageCorrectionPanel;
