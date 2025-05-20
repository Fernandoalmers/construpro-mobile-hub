
import React from 'react';
import ErrorState from '@/components/common/ErrorState';
import { AlertCircle, RefreshCw, ShieldAlert, Wifi, WifiOff } from 'lucide-react';

interface CheckoutErrorStateProps {
  error: string;
  attemptCount: number;
  onRetry: () => void;
}

const CheckoutErrorState: React.FC<CheckoutErrorStateProps> = ({
  error,
  attemptCount,
  onRetry
}) => {
  // Determine if device is currently online
  const isDeviceOnline = navigator.onLine;
  
  // Determine error type for better user guidance
  const isPermissionError = 
    error.toLowerCase().includes('permissão') || 
    error.toLowerCase().includes('security policy') || 
    error.toLowerCase().includes('authorized') ||
    error.toLowerCase().includes('token');
  
  const isNetworkError = 
    error.toLowerCase().includes('network') || 
    error.toLowerCase().includes('connection') || 
    error.toLowerCase().includes('comunicar') ||
    error.toLowerCase().includes('conexão') ||
    error.toLowerCase().includes('internet') ||
    error.toLowerCase().includes('offline') ||
    error.toLowerCase().includes('timeout') ||
    error.toLowerCase().includes('failed to fetch') ||
    error.toLowerCase().includes('failed to send') ||
    !isDeviceOnline;
    
  const isServerError =
    error.toLowerCase().includes('servidor') ||
    error.toLowerCase().includes('500') ||
    error.toLowerCase().includes('internal');
  
  // Create user-friendly error message
  const getFriendlyErrorMessage = () => {
    if (!isDeviceOnline) {
      return "Seu dispositivo está offline. Conecte-se à internet para finalizar seu pedido.";
    } else if (isPermissionError) {
      return "Problema de autorização. Você pode precisar fazer login novamente.";
    } else if (isNetworkError) {
      return "Problema de conexão. Verifique sua internet e tente novamente em alguns instantes.";
    } else if (isServerError) {
      return "Nosso servidor está enfrentando problemas temporários. Por favor, tente novamente em alguns instantes.";
    } else if (error.toLowerCase().includes('points_transactions')) {
      return "Erro ao processar pontos da compra. Estamos trabalhando para resolver este problema.";
    } else {
      return "Ocorreu um erro ao processar seu pedido.";
    }
  };

  const getErrorIcon = () => {
    if (!isDeviceOnline || isNetworkError) {
      return <WifiOff className="h-5 w-5" />;
    } else if (isPermissionError) {
      return <ShieldAlert className="h-5 w-5" />;
    } else {
      return <AlertCircle className="h-5 w-5" />;
    }
  };
  
  // Determine if retry button should be disabled
  const shouldDisableRetry = !isDeviceOnline;

  return (
    <div className="p-4 border rounded-md bg-red-50 border-red-200 mb-4 animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="mb-3 flex items-center gap-2 text-red-700">
        {getErrorIcon()}
        <h3 className="font-semibold">Erro ao processar pedido</h3>
      </div>
      
      <div className="text-sm text-red-600 mb-3">
        <p className="mb-2 font-medium">{getFriendlyErrorMessage()}</p>
        
        {!isDeviceOnline && (
          <div className="bg-red-100 rounded-md p-3 flex items-center gap-2 my-2">
            <WifiOff size={16} />
            <span className="text-xs">Você está offline. Conecte-se à internet para concluir esta operação.</span>
          </div>
        )}
        
        <details className="mt-2">
          <summary className="cursor-pointer text-xs font-medium">
            Ver detalhes técnicos
          </summary>
          <p className="font-mono bg-red-100 p-2 mt-1 rounded text-xs overflow-auto max-h-28">
            {error}
          </p>
        </details>
        
        {attemptCount > 1 && (
          <p className="mt-2 text-xs">
            <span className="font-semibold">Tentativas anteriores:</span> {attemptCount}
          </p>
        )}
      </div>
      
      <div className="mt-3 flex flex-col sm:flex-row gap-2">
        <button
          onClick={onRetry}
          disabled={shouldDisableRetry}
          className={`${
            shouldDisableRetry 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-red-600 hover:bg-red-700'
          } text-white py-2 px-4 rounded text-sm transition-colors flex items-center justify-center gap-1`}
        >
          <RefreshCw size={16} className={shouldDisableRetry ? 'opacity-50' : ''} />
          {shouldDisableRetry ? 'Conecte-se à internet' : 'Tentar novamente'}
        </button>
      </div>
    </div>
  );
};

export default CheckoutErrorState;
