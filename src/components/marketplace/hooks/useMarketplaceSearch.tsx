
import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useProductSearch } from '@/hooks/useProductSearch';
import { supabase } from '@/integrations/supabase/client';

export function useMarketplaceSearch() {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const searchQuery = searchParams.get('search');
  const lastNavigatedTermRef = useRef<string>('');
  const isInitializedRef = useRef(false);
  
  // CORRIGIDO: Enhanced search functionality com proteção contra loops
  const fetchProducts = useCallback((term: string) => {
    const trimmedTerm = term.trim();
    console.log('[useMarketplaceSearch] 🔍 Searching for:', trimmedTerm);
    
    // PROTEÇÃO: Evitar navegação se o termo é o mesmo que já foi navegado
    if (trimmedTerm === lastNavigatedTermRef.current) {
      console.log('[useMarketplaceSearch] ⏭️ Skipping navigation - same term:', trimmedTerm);
      return;
    }
    
    const newSearchParams = new URLSearchParams(searchParams);
    let shouldNavigate = false;
    
    if (trimmedTerm && trimmedTerm.length >= 2) {
      newSearchParams.set('search', trimmedTerm);
      shouldNavigate = true;
    } else if (trimmedTerm.length === 0) {
      newSearchParams.delete('search');
      shouldNavigate = true;
    }
    
    if (shouldNavigate) {
      lastNavigatedTermRef.current = trimmedTerm;
      const newUrl = `${location.pathname}?${newSearchParams.toString()}`;
      console.log('[useMarketplaceSearch] 🧭 Navigating to:', newUrl);
      navigate(newUrl, { replace: true });
    }
  }, [location.pathname, navigate, searchParams]);
  
  const { term, setTerm, handleSubmit } = useProductSearch(fetchProducts);
  
  // Quick search functionality
  const handleQuickSearch = async (term: string) => {
    console.log('[useMarketplaceSearch] ⚡ Quick search for:', term);
    if (!term || term.trim().length < 2) {
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('produtos')
        .select('id')
        .ilike('nome', `%${term}%`)
        .eq('status', 'aprovado')
        .limit(1)
        .single();
      
      if (error || !data) {
        console.error('[useMarketplaceSearch] Quick search error:', error);
        return;
      }
      
      navigate(`/produto/${data.id}`);
    } catch (error) {
      console.error('[useMarketplaceSearch] Error in quick search:', error);
    }
  };
  
  // CORRIGIDO: Initialize search term from URL apenas uma vez
  useEffect(() => {
    if (!isInitializedRef.current && searchQuery && searchQuery !== term) {
      console.log('[useMarketplaceSearch] 🚀 Initializing term from URL:', searchQuery);
      setTerm(searchQuery);
      lastNavigatedTermRef.current = searchQuery;
      isInitializedRef.current = true;
    }
  }, [searchQuery, setTerm, term]);
  
  return {
    term,
    setTerm,
    handleSubmit,
    handleQuickSearch,
    fetchProducts
  };
}
