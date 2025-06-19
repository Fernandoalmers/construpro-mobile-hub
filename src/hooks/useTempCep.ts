
import { useState, useCallback } from 'react';

export function useTempCep() {
  const [tempCep, setTempCep] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const setTemporaryCep = useCallback((cep: string) => {
    console.log('[useTempCep] Setting temporary CEP:', cep);
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      setTempCep(cleanCep);
      // Store in sessionStorage for persistence during navigation
      sessionStorage.setItem('temp_delivery_cep', cleanCep);
    }
  }, []);

  const clearTemporaryCep = useCallback(() => {
    console.log('[useTempCep] Clearing temporary CEP');
    setTempCep(null);
    sessionStorage.removeItem('temp_delivery_cep');
  }, []);

  // Initialize from sessionStorage on mount
  React.useEffect(() => {
    const stored = sessionStorage.getItem('temp_delivery_cep');
    if (stored && stored.length === 8) {
      setTempCep(stored);
    }
  }, []);

  return {
    tempCep,
    isLoading,
    setIsLoading,
    setTemporaryCep,
    clearTemporaryCep
  };
}
