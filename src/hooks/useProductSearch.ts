
import { useState, useEffect } from 'react';

export function useProductSearch(fetchProducts: (term: string) => void) {
  const [term, setTerm] = useState('');
  
  // Debounce effect for search input with minimum length check
  useEffect(() => {
    if (term.trim().length < 2) return;
    
    console.log('Debouncing search for term:', term);
    const timeout = setTimeout(() => fetchProducts(term), 300);
    return () => clearTimeout(timeout);
  }, [term, fetchProducts]);
  
  // Handle explicit search submission with validation
  const handleSubmit = () => {
    console.log('Search submitted with term:', term);
    if (term.trim().length < 2) {
      console.log('Search term too short, ignoring submission');
      return;
    }
    fetchProducts(term);
  };
  
  return { term, setTerm, handleSubmit };
}
