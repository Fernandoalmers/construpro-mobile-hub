
import { useState, useEffect } from 'react';

export function useProductSearch(fetchProducts: (term: string) => void) {
  const [term, setTerm] = useState('');
  
  useEffect(() => {
    const timeout = setTimeout(() => fetchProducts(term), 300);
    return () => clearTimeout(timeout);
  }, [term, fetchProducts]);
  
  const handleSubmit = () => fetchProducts(term);
  
  return { term, setTerm, handleSubmit };
}
