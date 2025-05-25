
import { useState, useEffect } from 'react';

export function useProductSearch(fetchProducts: (term: string) => void) {
  const [term, setTerm] = useState('');
  
  // Debounce effect for search input - FIXED to handle empty search
  useEffect(() => {
    console.log('[useProductSearch] Term changed to:', term);
    
    const timeout = setTimeout(() => {
      if (term.trim().length >= 2) {
        console.log('[useProductSearch] Searching for term:', term);
        fetchProducts(term);
      } else if (term.trim().length === 0) {
        // CRUCIAL: When search is cleared, reset to show all products
        console.log('[useProductSearch] Search cleared, resetting products');
        fetchProducts('');
      }
      // Note: We don't call fetchProducts for terms with length 1 to avoid unnecessary searches
    }, 300);
    
    return () => clearTimeout(timeout);
  }, [term, fetchProducts]);
  
  // Handle explicit search submission with validation
  const handleSubmit = () => {
    console.log('[useProductSearch] Search submitted with term:', term);
    if (term.trim().length >= 2) {
      fetchProducts(term);
    } else if (term.trim().length === 0) {
      // Handle explicit search with empty term
      fetchProducts('');
    }
  };
  
  return { term, setTerm, handleSubmit };
}
