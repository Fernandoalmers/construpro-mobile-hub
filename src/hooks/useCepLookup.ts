
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
    if (!cep.trim()) {
      setError(null);
      setCepData(null);
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await lookupCep(cep);
      
      if (data) {
        setCepData(data);
        setError(null);
        return data;
      } else {
        setError('CEP não encontrado. Verifique o número digitado.');
        setCepData(null);
        return null;
      }
    } catch (err) {
      console.error('[useCepLookup] Error:', err);
      setError('Erro ao buscar CEP. Tente novamente.');
      setCepData(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearData = useCallback(() => {
    setCepData(null);
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    cepData,
    lookupAddress,
    clearData,
  };
};
