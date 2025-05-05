
import { useState, useEffect } from 'react';

export function useProductSearch(fetchProducts: (term: string) => void) {
  const [term, setTerm] = useState('');
  
  // Debounce effect for search input
  useEffect(() => {
    if (term.trim().length < 2) return;
    
    const timeout = setTimeout(() => fetchProducts(term), 300);
    return () => clearTimeout(timeout);
  }, [term, fetchProducts]);
  
  // Handle explicit search submission
  const handleSubmit = () => {
    if (term.trim().length < 2) return;
    fetchProducts(term);
  };
  
  return { term, setTerm, handleSubmit };
}
