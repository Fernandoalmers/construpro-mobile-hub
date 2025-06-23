
import { useState, useCallback } from 'react';
import { lookupCepEnhanced, EnhancedCepData } from '@/lib/enhancedCep';

export interface CepError {
  type: 'validation' | 'not_found' | 'network' | 'timeout' | 'api_error';
  message: string;
  details?: string;
  canRetry: boolean;
  suggestManual: boolean;
}

interface UseEnhancedCepLookupReturn {
  isLoading: boolean;
  error: CepError | null;
  cepData: EnhancedCepData | null;
  lookupAddress: (cep: string) => Promise<EnhancedCepData | null>;
  clearData: () => void;
  retryLookup: () => Promise<void>;
  lastSearchedCep: string | null;
  searchHistory: string[];
}

export const useEnhancedCepLookup = (): UseEnhancedCepLookupReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<CepError | null>(null);
  const [cepData, setCepData] = useState<EnhancedCepData | null>(null);
  const [lastSearchedCep, setLastSearchedCep] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

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
          message: 'CEP não encontrado em nenhuma base de dados oficial. Confirme se digitou corretamente.'
        };
      case 'network':
        return { 
          ...baseError, 
          canRetry: true, 
          suggestManual: true,
          message: 'Problema de conectividade. Verifique sua internet e tente novamente.'
        };
      case 'timeout':
        return { 
          ...baseError, 
          canRetry: true, 
          suggestManual: true,
          message: 'Busca demorou muito para responder. APIs podem estar sobrecarregadas.'
        };
      case 'api_error':
        return { 
          ...baseError, 
          canRetry: true, 
          suggestManual: true,
          message: 'Serviços de CEP temporariamente indisponíveis. Tente novamente em alguns minutos.'
        };
      default:
        return { ...baseError, canRetry: true, suggestManual: true };
    }
  };

  const lookupAddress = useCallback(async (cep: string): Promise<EnhancedCepData | null> => {
    const sanitizedCep = cep.replace(/\D/g, '');
    
    if (!sanitizedCep || sanitizedCep.length !== 8) {
      const error = createError('validation', 'CEP deve ter 8 dígitos');
      setError(error);
      setCepData(null);
      setLastSearchedCep(null);
      return null;
    }

    console.log('[useEnhancedCepLookup] 🚀 INICIANDO BUSCA COM SISTEMA APRIMORADO:', {
      cep: sanitizedCep,
      timestamp: new Date().toISOString(),
      searchCount: searchHistory.length + 1
    });

    setIsLoading(true);
    setError(null);
    setCepData(null);
    setLastSearchedCep(sanitizedCep);

    // Add to search history
    setSearchHistory(prev => {
      const updated = [sanitizedCep, ...prev.filter(c => c !== sanitizedCep)];
      return updated.slice(0, 10); // Keep only last 10 searches
    });

    try {
      const startTime = Date.now();
      const data = await lookupCepEnhanced(sanitizedCep);
      const endTime = Date.now();
      
      console.log('[useEnhancedCepLookup] ⏱️ TEMPO DE RESPOSTA SISTEMA APRIMORADO:', {
        cep: sanitizedCep,
        duration: `${endTime - startTime}ms`,
        success: !!data,
        source: data?.source || 'none',
        confidence: data?.confidence || 'none'
      });
      
      if (data) {
        setCepData(data);
        setError(null);
        console.log('[useEnhancedCepLookup] ✅ SUCESSO COM SISTEMA APRIMORADO:', {
          cep: sanitizedCep,
          cidade: data.localidade,
          uf: data.uf,
          zona: data.zona_entrega,
          source: data.source,
          confidence: data.confidence
        });
        return data;
      } else {
        console.warn('[useEnhancedCepLookup] ❌ CEP NÃO ENCONTRADO MESMO COM SISTEMA APRIMORADO:', sanitizedCep);
        const error = createError('not_found', '', `CEP ${sanitizedCep} consultado no sistema aprimorado com múltiplas APIs e fallbacks`);
        setError(error);
        setCepData(null);
        return null;
      }
    } catch (err) {
      console.error('[useEnhancedCepLookup] 💥 ERRO NO SISTEMA APRIMORADO:', {
        cep: sanitizedCep,
        error: err?.message || err,
        stack: err?.stack
      });
      
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
  }, [searchHistory]);

  const retryLookup = useCallback(async () => {
    if (lastSearchedCep) {
      console.log('[useEnhancedCepLookup] 🔄 RETRY COM SISTEMA APRIMORADO:', lastSearchedCep);
      await lookupAddress(lastSearchedCep);
    }
  }, [lastSearchedCep, lookupAddress]);

  const clearData = useCallback(() => {
    setCepData(null);
    setError(null);
    setIsLoading(false);
    setLastSearchedCep(null);
    console.log('[useEnhancedCepLookup] 🧹 DADOS LIMPOS DO SISTEMA APRIMORADO');
  }, []);

  return {
    isLoading,
    error,
    cepData,
    lookupAddress,
    clearData,
    retryLookup,
    lastSearchedCep,
    searchHistory,
  };
};
