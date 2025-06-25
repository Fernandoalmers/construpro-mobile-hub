
import { useState, useEffect, useCallback } from 'react';

export function useProductSearch(fetchProducts: (term: string) => void) {
  const [term, setTerm] = useState('');
  const [lastFetchedTerm, setLastFetchedTerm] = useState('');
  
  // CORRIGIDO: Memoizar fetchProducts para evitar dependência instável
  const memoizedFetchProducts = useCallback((searchTerm: string) => {
    console.log('[useProductSearch] 🔍 Executing search for:', searchTerm);
    fetchProducts(searchTerm);
    setLastFetchedTerm(searchTerm);
  }, [fetchProducts]);
  
  // CORRIGIDO: Debounce effect mais controlado - evita execução excessiva
  useEffect(() => {
    // Não executar se o termo não mudou desde a última busca
    if (term === lastFetchedTerm) {
      console.log('[useProductSearch] ⏭️ Skipping search - term unchanged:', term);
      return;
    }
    
    console.log('[useProductSearch] 📝 Term changed to:', term, 'Last fetched:', lastFetchedTerm);
    
    const timeout = setTimeout(() => {
      const trimmedTerm = term.trim();
      
      if (trimmedTerm.length >= 2) {
        console.log('[useProductSearch] 🔍 Searching for term:', trimmedTerm);
        memoizedFetchProducts(trimmedTerm);
      } else if (trimmedTerm.length === 0) {
        console.log('[useProductSearch] 🔄 Search cleared, resetting products');
        memoizedFetchProducts('');
      }
      // Note: We don't call fetchProducts for terms with length 1 to avoid unnecessary searches
    }, 500); // AUMENTADO: debounce de 300ms para 500ms para reduzir execuções
    
    return () => clearTimeout(timeout);
  }, [term, lastFetchedTerm, memoizedFetchProducts]);
  
  // CORRIGIDO: Handle explicit search submission with better validation
  const handleSubmit = useCallback(() => {
    const trimmedTerm = term.trim();
    console.log('[useProductSearch] 📤 Search submitted with term:', trimmedTerm);
    
    if (trimmedTerm !== lastFetchedTerm) {
      if (trimmedTerm.length >= 2) {
        memoizedFetchProducts(trimmedTerm);
      } else if (trimmedTerm.length === 0) {
        memoizedFetchProducts('');
      }
    } else {
      console.log('[useProductSearch] ⏭️ Skipping submit - already fetched:', trimmedTerm);
    }
  }, [term, lastFetchedTerm, memoizedFetchProducts]);
  
  return { term, setTerm, handleSubmit };
}
