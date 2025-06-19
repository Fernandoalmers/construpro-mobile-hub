
import { useState, useCallback } from 'react';
import { lookupCep, CepData } from '@/lib/cep';

interface UseCepLookupReturn {
  isLoading: boolean;
  error: string | null;
  cepData: CepData | null;
  lookupAddress: (cep: string) => Promise<CepData | null>;
  clearData: () => void;
}

export const useCepLookup = (): UseCepLookupReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cepData, setCepData] = useState<CepData | null>(null);

  const lookupAddress = useCallback(async (cep: string): Promise<CepData | null> => {
    const sanitizedCep = cep.replace(/\D/g, '');
    
    if (!sanitizedCep || sanitizedCep.length !== 8) {
      setError('CEP deve ter 8 dígitos');
      setCepData(null);
      return null;
    }

    console.log('[useCepLookup] Iniciando busca do CEP:', sanitizedCep);
    setIsLoading(true);
    setError(null);
    setCepData(null);

    try {
      const data = await lookupCep(sanitizedCep);
      
      if (data) {
        setCepData(data);
        setError(null);
        console.log('[useCepLookup] CEP encontrado e validado:', data);
        return data;
      } else {
        setError('CEP não encontrado ou desativado. Verifique o número digitado.');
        setCepData(null);
        console.warn('[useCepLookup] CEP não encontrado:', sanitizedCep);
        return null;
      }
    } catch (err) {
      console.error('[useCepLookup] Erro na busca:', err);
      setError('Erro ao buscar CEP. Verifique sua conexão e tente novamente.');
      setCepData(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearData = useCallback(() => {
    setCepData(null);
    setError(null);
    setIsLoading(false);
    console.log('[useCepLookup] Dados limpos');
  }, []);

  return {
    isLoading,
    error,
    cepData,
    lookupAddress,
    clearData,
  };
};
