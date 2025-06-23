
import React from 'react';
import { AlertCircle, Wifi, RefreshCw, Edit3, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import type { CepError } from '@/hooks/useCepLookup';

interface CepErrorDisplayProps {
  error: CepError;
  onRetry?: () => void;
  onManualEntry?: () => void;
  isRetrying?: boolean;
  searchedCep?: string;
}

const CepErrorDisplay: React.FC<CepErrorDisplayProps> = ({
  error,
  onRetry,
  onManualEntry,
  isRetrying = false,
  searchedCep
}) => {
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

  const getSuggestions = () => {
    switch (error.type) {
      case 'validation':
        return [
          'Verifique se o CEP tem 8 dígitos',
          'Use apenas números (ex: 39685000)',
        ];
      case 'not_found':
        return [
          'Confirme se o CEP foi digitado corretamente',
          'Verifique se é um CEP válido nos Correios',
          'Tente um CEP próximo da sua região',
        ];
      case 'network':
      case 'timeout':
        return [
          'Verifique sua conexão com a internet',
          'Tente novamente em alguns segundos',
          'Se persistir, use a entrada manual',
        ];
      case 'api_error':
        return [
          'Os serviços de CEP estão temporariamente indisponíveis',
          'Tente novamente em alguns minutos',
          'Use a entrada manual enquanto isso',
        ];
      default:
        return ['Tente novamente ou use a entrada manual'];
    }
  };

  return (
    <Alert variant={getErrorVariant()} className="mb-4">
      <div className="flex items-start gap-3">
        {getErrorIcon()}
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <AlertTitle className="text-sm font-medium">
              Erro ao buscar CEP {searchedCep && `"${searchedCep}"`}
            </AlertTitle>
            {getErrorBadge()}
          </div>
          
          <AlertDescription className="text-sm">
            {error.message}
          </AlertDescription>

          {error.details && (
            <details className="text-xs opacity-75">
              <summary className="cursor-pointer">Detalhes técnicos</summary>
              <p className="mt-1 font-mono">{error.details}</p>
            </details>
          )}

          <div className="space-y-2">
            <p className="text-xs font-medium">Sugestões:</p>
            <ul className="text-xs space-y-1">
              {getSuggestions().map((suggestion, index) => (
                <li key={index} className="flex items-start gap-1">
                  <span className="text-blue-500 font-bold">•</span>
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex gap-2 pt-2">
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
        </div>
      </div>
    </Alert>
  );
};

export default CepErrorDisplay;
