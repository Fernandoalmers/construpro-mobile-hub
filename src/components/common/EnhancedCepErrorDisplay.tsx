
import React, { useState } from 'react';
import { AlertCircle, Wifi, RefreshCw, Edit3, ExternalLink, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useCepDiagnostics } from '@/hooks/useCepDiagnostics';
import type { CepError } from '@/hooks/useCepLookup';

interface EnhancedCepErrorDisplayProps {
  error: CepError;
  onRetry?: () => void;
  onManualEntry?: () => void;
  onCepSuggestion?: (cep: string) => void;
  isRetrying?: boolean;
  searchedCep?: string;
}

const EnhancedCepErrorDisplay: React.FC<EnhancedCepErrorDisplayProps> = ({
  error,
  onRetry,
  onManualEntry,
  onCepSuggestion,
  isRetrying = false,
  searchedCep
}) => {
  const { diagnostic, isRunning, runDiagnostic } = useCepDiagnostics();
  const [showDiagnostic, setShowDiagnostic] = useState(false);

  const getErrorIcon = () => {
    switch (error.type) {
      case 'network':
      case 'timeout':
        return <Wifi className="h-4 w-4" />;
      case 'not_found':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getErrorVariant = () => {
    switch (error.type) {
      case 'validation':
        return 'default';
      case 'not_found':
        return 'default';
      case 'network':
      case 'timeout':
      case 'api_error':
        return 'destructive';
      default:
        return 'destructive';
    }
  };

  const getErrorBadge = () => {
    const badgeConfig = {
      validation: { label: 'Formato inválido', color: 'bg-yellow-500' },
      not_found: { label: 'CEP não encontrado', color: 'bg-orange-500' },
      network: { label: 'Erro de conexão', color: 'bg-red-500' },
      timeout: { label: 'Timeout', color: 'bg-red-500' },
      api_error: { label: 'Erro do serviço', color: 'bg-red-500' },
    };

    const config = badgeConfig[error.type];
    return (
      <Badge className={`${config.color} text-white text-xs`}>
        {config.label}
      </Badge>
    );
  };

  const handleRunDiagnostic = async () => {
    if (searchedCep) {
      await runDiagnostic(searchedCep);
      setShowDiagnostic(true);
    }
  };

  const handleCepSuggestionClick = (cep: string) => {
    if (onCepSuggestion) {
      onCepSuggestion(cep);
    }
  };

  const getApiStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return '✅';
      case 'not_found':
        return '❌';
      case 'error':
        return '💥';
      default:
        return '⏳';
    }
  };

  return (
    <Alert variant={getErrorVariant()} className="mb-4">
      <div className="flex items-start gap-3">
        {getErrorIcon()}
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <AlertTitle className="text-sm font-medium">
              Erro ao buscar CEP {searchedCep && `"${searchedCep}"`}
            </AlertTitle>
            {getErrorBadge()}
          </div>
          
          <AlertDescription className="text-sm">
            {error.message}
          </AlertDescription>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2">
            {error.canRetry && onRetry && (
              <Button
                size="sm"
                variant="outline"
                onClick={onRetry}
                disabled={isRetrying}
                className="h-8 text-xs"
              >
                {isRetrying ? (
                  <>
                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                    Tentando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Tentar Novamente
                  </>
                )}
              </Button>
            )}

            {searchedCep && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleRunDiagnostic}
                disabled={isRunning}
                className="h-8 text-xs bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                {isRunning ? (
                  <>
                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                    Diagnosticando...
                  </>
                ) : (
                  <>
                    <Search className="h-3 w-3 mr-1" />
                    Diagnóstico Completo
                  </>
                )}
              </Button>
            )}

            {error.suggestManual && onManualEntry && (
              <Button
                size="sm"
                variant="outline"
                onClick={onManualEntry}
                className="h-8 text-xs bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100"
              >
                <Edit3 className="h-3 w-3 mr-1" />
                Preencher Manualmente
              </Button>
            )}

            <Button
              size="sm"
              variant="ghost"
              className="h-8 text-xs"
              onClick={() => window.open('https://buscacepinter.correios.com.br/app/endereco/index.php', '_blank')}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Consultar Correios
            </Button>
          </div>

          {/* Diagnostic Results */}
          {diagnostic && showDiagnostic && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-sm">Diagnóstico Detalhado</h4>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowDiagnostic(false)}
                  className="h-6 w-6 p-0"
                >
                  <ChevronUp className="h-3 w-3" />
                </Button>
              </div>
              
              <div className="space-y-2 text-xs">
                <p className="font-medium">{diagnostic.diagnosticMessage}</p>
                
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <span>{getApiStatusIcon(diagnostic.viacepStatus)}</span>
                    <span>ViaCEP</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>{getApiStatusIcon(diagnostic.brasilApiStatus)}</span>
                    <span>BrasilAPI</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>{diagnostic.isValidFormat ? '✅' : '❌'}</span>
                    <span>Formato</span>
                  </div>
                </div>

                {diagnostic.suggestedCeps.length > 0 && (
                  <div className="mt-3">
                    <p className="font-medium mb-2">CEPs similares para tentar:</p>
                    <div className="flex flex-wrap gap-1">
                      {diagnostic.suggestedCeps.map((cep) => (
                        <Button
                          key={cep}
                          size="sm"
                          variant="outline"
                          onClick={() => handleCepSuggestionClick(cep)}
                          className="h-6 px-2 text-xs"
                        >
                          {cep.replace(/(\d{5})(\d{3})/, '$1-$2')}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Collapsed Diagnostic Button */}
          {diagnostic && !showDiagnostic && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowDiagnostic(true)}
              className="h-8 text-xs text-gray-600"
            >
              <ChevronDown className="h-3 w-3 mr-1" />
              Ver diagnóstico completo
            </Button>
          )}
        </div>
      </div>
    </Alert>
  );
};

export default EnhancedCepErrorDisplay;
