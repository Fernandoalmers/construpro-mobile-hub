
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useProductSearch } from '@/hooks/useProductSearch';
import { supabase } from '@/integrations/supabase/client';

export function useMarketplaceSearch() {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const searchQuery = searchParams.get('search');
  
  // Enhanced search functionality
  const fetchProducts = (term: string) => {
    console.log('[useMarketplaceSearch] Searching for:', term);
    
    const newSearchParams = new URLSearchParams(searchParams);
    if (term && term.trim().length >= 2) {
      newSearchParams.set('search', term);
    } else {
      newSearchParams.delete('search');
    }
    navigate(`${location.pathname}?${newSearchParams.toString()}`, { replace: true });
  };
  
  const { term, setTerm, handleSubmit } = useProductSearch(fetchProducts);
  
  // Quick search functionality
  const handleQuickSearch = async (term: string) => {
    console.log('[useMarketplaceSearch] Quick search for:', term);
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
  
  // Initialize search term from URL
  useEffect(() => {
    if (searchQuery) {
      setTerm(searchQuery);
    }
  }, [searchQuery, setTerm]);
  
  return {
    term,
    setTerm,
    handleSubmit,
    handleQuickSearch,
    fetchProducts
  };
}
