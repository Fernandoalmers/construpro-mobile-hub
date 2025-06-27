
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

class RobustErrorBoundary extends Component<Props, State> {
  private retryTimeout: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('🚨 [RobustErrorBoundary] Error capturado:', error);
    console.error('🚨 [RobustErrorBoundary] Error info:', errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Log para debugging
    if (error.message.includes('Minified React error #426')) {
      console.error('🔥 [RobustErrorBoundary] React error #426 detectado - possível loop de renderização');
    }
  }

  handleRetry = (): void => {
    console.log('🔄 [RobustErrorBoundary] Tentativa de recuperação...');
    
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));
    
    if (this.props.onReset) {
      this.props.onReset();
    }
    
    // Auto-refresh da página se muitas tentativas falharam
    if (this.state.retryCount >= 3) {
      console.warn('🔄 [RobustErrorBoundary] Muitas tentativas, recarregando página...');
      this.retryTimeout = setTimeout(() => {
        window.location.reload();
      }, 2000);
    }
  };

  handleGoHome = (): void => {
    window.location.href = '/';
  };

  componentWillUnmount(): void {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isReactError426 = this.state.error?.message.includes('Minified React error #426');
      const isRenderLoop = isReactError426 || this.state.error?.message.includes('Maximum update depth');

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardContent className="p-6 text-center space-y-4">
              <div className="flex justify-center">
                <AlertTriangle className="h-16 w-16 text-red-500" />
              </div>
              
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  {isRenderLoop ? 'Erro de Renderização' : 'Algo deu errado'}
                </h2>
                <p className="text-gray-600 mb-4">
                  {isRenderLoop 
                    ? 'Detectamos um problema de renderização. Vamos tentar corrigir automaticamente.'
                    : 'Ocorreu um erro inesperado. Você pode tentar novamente ou voltar ao início.'
                  }
                </p>
                
                {this.props.showDetails && this.state.error && (
                  <details className="text-left text-xs bg-gray-100 p-2 rounded mt-2">
                    <summary className="cursor-pointer font-semibold">
                      Detalhes técnicos
                    </summary>
                    <pre className="mt-2 whitespace-pre-wrap break-all">
                      {this.state.error.message}
                      {this.state.errorInfo?.componentStack}
                    </pre>
                  </details>
                )}
              </div>

              <div className="flex gap-2 justify-center">
                <Button onClick={this.handleRetry} className="gap-2" variant="default">
                  <RefreshCw className="h-4 w-4" />
                  Tentar novamente
                  {this.state.retryCount > 0 && ` (${this.state.retryCount})`}
                </Button>
                
                <Button onClick={this.handleGoHome} variant="outline" className="gap-2">
                  <Home className="h-4 w-4" />
                  Ir ao início
                </Button>
              </div>
              
              {this.state.retryCount >= 2 && (
                <p className="text-sm text-orange-600">
                  Se o problema persistir, a página será recarregada automaticamente.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default RobustErrorBoundary;
