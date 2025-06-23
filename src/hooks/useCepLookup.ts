
import { useState, useCallback } from 'react';
import { lookupCep, CepData } from '@/lib/cep';

export interface CepError {
  type: 'validation' | 'not_found' | 'network' | 'timeout' | 'api_error';
  message: string;
  details?: string;
  canRetry: boolean;
  suggestManual: boolean;
}

interface UseCepLookupReturn {
  isLoading: boolean;
  error: CepError | null;
  cepData: CepData | null;
  lookupAddress: (cep: string) => Promise<CepData | null>;
  clearData: () => void;
  retryLookup: () => Promise<void>;
  lastSearchedCep: string | null;
}

export const useCepLookup = (): UseCepLookupReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<CepError | null>(null);
  const [cepData, setCepData] = useState<CepData | null>(null);
  const [lastSearchedCep, setLastSearchedCep] = useState<string | null>(null);

  const createError = (type: CepError['type'], message: string, details?: string): CepError => {
    const baseError = { type, message, details };
    
    switch (type) {
      case 'validation':
        return { ...baseError, canRetry: false, suggestManual: false };
      case 'not_found':
        return { 
          ...baseError, 
          canRetry: true, 
          suggestManual: true,
          message: 'CEP não encontrado ou inexistente. Verifique se digitou corretamente.'
        };
      case 'network':
        return { 
          ...baseError, 
          canRetry: true, 
          suggestManual: true,
          message: 'Erro de conexão. Verifique sua internet e tente novamente.'
        };
      case 'timeout':
        return { 
          ...baseError, 
          canRetry: true, 
          suggestManual: true,
          message: 'Busca demorou muito para responder. Tente novamente.'
        };
      case 'api_error':
        return { 
          ...baseError, 
          canRetry: true, 
          suggestManual: true,
          message: 'Erro nos serviços de CEP. Tente novamente em alguns minutos.'
        };
      default:
        return { ...baseError, canRetry: true, suggestManual: true };
    }
  };

  const lookupAddress = useCallback(async (cep: string): Promise<CepData | null> => {
    const sanitizedCep = cep.replace(/\D/g, '');
    
    if (!sanitizedCep || sanitizedCep.length !== 8) {
      const error = createError('validation', 'CEP deve ter 8 dígitos');
      setError(error);
      setCepData(null);
      setLastSearchedCep(null);
      return null;
    }

    console.log('[useCepLookup] Iniciando busca diagnóstica do CEP:', sanitizedCep);
    setIsLoading(true);
    setError(null);
    setCepData(null);
    setLastSearchedCep(sanitizedCep);

    try {
      // Test connectivity first
      console.log('[useCepLookup] Testando conectividade...');
      
      const data = await lookupCep(sanitizedCep);
      
      if (data) {
        setCepData(data);
        setError(null);
        console.log('[useCepLookup] ✅ CEP encontrado com sucesso:', data);
        return data;
      } else {
        console.warn('[useCepLookup] ⚠️ CEP não encontrado:', sanitizedCep);
        
        // Try to determine the specific reason for failure
        const detailedError = await diagnoseCepFailure(sanitizedCep);
        setError(detailedError);
        setCepData(null);
        return null;
      }
    } catch (err) {
      console.error('[useCepLookup] 💥 Erro na busca:', err);
      
      let errorType: CepError['type'] = 'api_error';
      let details = '';
      
      if (err instanceof Error) {
        if (err.name === 'AbortError' || err.message.includes('timeout')) {
          errorType = 'timeout';
        } else if (err.message.includes('fetch') || err.message.includes('network')) {
          errorType = 'network';
        }
        details = err.message;
      }
      
      const error = createError(errorType, '', details);
      setError(error);
      setCepData(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const diagnoseCepFailure = async (cep: string): Promise<CepError> => {
    console.log('[useCepLookup] 🔍 Diagnosticando falha do CEP:', cep);
    
    // Test individual APIs to see which ones are failing
    try {
      console.log('[useCepLookup] Testando ViaCEP...');
      const viacepResponse = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
        signal: AbortSignal.timeout(5000)
      });
      
      if (viacepResponse.ok) {
        const viacepData = await viacepResponse.json();
        if (viacepData.erro) {
          console.log('[useCepLookup] ViaCEP confirma: CEP não existe');
          return createError('not_found', '', 'ViaCEP confirmou que o CEP não existe');
        }
      }
    } catch (viacepError) {
      console.log('[useCepLookup] ViaCEP falhou:', viacepError);
    }
    
    try {
      console.log('[useCepLookup] Testando BrasilAPI...');
      const brasilApiResponse = await fetch(`https://brasilapi.com.br/api/cep/v1/${cep}`, {
        signal: AbortSignal.timeout(5000)
      });
      
      if (!brasilApiResponse.ok) {
        if (brasilApiResponse.status === 404) {
          console.log('[useCepLookup] BrasilAPI confirma: CEP não existe');
          return createError('not_found', '', 'BrasilAPI confirmou que o CEP não existe');
        }
      }
    } catch (brasilApiError) {
      console.log('[useCepLookup] BrasilAPI falhou:', brasilApiError);
    }
    
    // If we reach here, it's likely a network or API issue
    return createError('api_error', '', 'Ambas as APIs de CEP estão indisponíveis');
  };

  const retryLookup = useCallback(async () => {
    if (lastSearchedCep) {
      console.log('[useCepLookup] Tentando novamente o CEP:', lastSearchedCep);
      await lookupAddress(lastSearchedCep);
    }
  }, [lastSearchedCep, lookupAddress]);

  const clearData = useCallback(() => {
    setCepData(null);
    setError(null);
    setIsLoading(false);
    setLastSearchedCep(null);
    console.log('[useCepLookup] Dados limpos');
  }, []);

  return {
    isLoading,
    error,
    cepData,
    lookupAddress,
    clearData,
    retryLookup,
    lastSearchedCep,
  };
};
