
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useStoreInfo = (storeIds: string[]) => {
  const [storeInfo, setStoreInfo] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Use ref to track previous IDs to avoid unnecessary fetches
  const prevStoreIdsRef = useRef<string[]>([]);
  
  // Memoized function without storeInfo dependency
  const fetchStoreInfo = useCallback(async () => {
    // Skip fetch if no store IDs are provided
    if (!storeIds || storeIds.length === 0) {
      setStoreInfo({});
      setLoading(false);
      return;
    }
    
    // Filter out any null/undefined IDs
    const validStoreIds = storeIds.filter(id => id);
    
    if (validStoreIds.length === 0) {
      setStoreInfo({});
      setLoading(false);
      return;
    }
    
    // Compare with previous IDs to avoid unnecessary fetches
    const sameIds = 
      validStoreIds.length === prevStoreIdsRef.current.length && 
      validStoreIds.every(id => prevStoreIdsRef.current.includes(id));
      
    if (sameIds) {
      console.log("Same store IDs, skipping fetch");
      return;
    }
    
    // Update ref with current IDs
    prevStoreIdsRef.current = [...validStoreIds];
    
    setLoading(true);
    setError(null);
    console.log("Fetching store info for:", validStoreIds);
    
    try {
      // Create initial store map with improved defaults
      const initialStoreMap = validStoreIds.reduce((acc, id) => {
        if (!id) return acc;
        
        acc[id] = {
          id: id,
          nome: `Loja ${id.substring(0, 4)}`,
          logo_url: null
        };
        return acc;
      }, {} as Record<string, any>);
      
      // Set initial state
      setStoreInfo(initialStoreMap); 
      
      try {
        // First try to get from 'lojas' table (primary source)
        const { data: lojasData, error: lojasError } = await supabase
          .from('lojas')
          .select('id, nome, logo_url')
          .in('id', validStoreIds);
              
        if (lojasError) {
          console.error("Error fetching from lojas:", lojasError);
        }
        
        // Update with data from 'lojas' table if available
        if (lojasData && lojasData.length > 0) {
          setStoreInfo(prevState => {
            const updatedMap = {...prevState};
            
            lojasData.forEach(loja => {
              if (loja.id) {
                updatedMap[loja.id] = {
                  id: loja.id,
                  nome: loja.nome || updatedMap[loja.id]?.nome || `Loja ${loja.id.substring(0, 4)}`,
                  logo_url: loja.logo_url || null
                };
              }
            });
            
            return updatedMap;
          });
          
          console.log("Store info updated with lojas data");
        }
      } catch (err) {
        console.log("Failed to fetch lojas data, trying vendedores:", err);
      }
      
      try {
        // Try to get data from vendedores table as fallback
        const { data: vendedoresData, error: vendedoresError } = await supabase
          .from('vendedores')
          .select('id, nome_loja, logo')
          .in('id', validStoreIds);
              
        if (vendedoresError) {
          console.error("Error fetching vendedores:", vendedoresError);
        }
        
        // Update with vendedores data for any missing stores
        if (vendedoresData && vendedoresData.length > 0) {
          setStoreInfo(prevState => {
            const updatedMap = {...prevState};
            
            vendedoresData.forEach(vendedor => {
              if (vendedor.id) {
                // Only update if we don't have better data already
                if (!updatedMap[vendedor.id]?.nome || updatedMap[vendedor.id]?.nome.startsWith('Loja ')) {
                  updatedMap[vendedor.id] = {
                    ...updatedMap[vendedor.id],
                    nome: vendedor.nome_loja || updatedMap[vendedor.id]?.nome || `Loja ${vendedor.id.substring(0, 4)}`,
                    logo_url: vendedor.logo || updatedMap[vendedor.id]?.logo_url || null
                  };
                }
              }
            });
            
            return updatedMap;
          });
          
          console.log("Store info updated with vendedores data");
        }
      } catch (err) {
        console.log("Failed to fetch vendedores data, trying stores table:", err);
      }
      
      try {
        // Finally try stores table as last fallback
        const { data: storesData, error: storesError } = await supabase
          .from('stores')
          .select('id, nome, logo_url')
          .in('id', validStoreIds);
            
        if (storesError) {
          console.error("Error fetching stores:", storesError);
        }
            
        if (storesData && storesData.length > 0) {
          setStoreInfo(prevState => {
            const updatedMap = {...prevState};
            
            storesData.forEach(store => {
              if (store.id) {
                // Only update if we don't have better data already
                if (!updatedMap[store.id]?.nome || updatedMap[store.id]?.nome.startsWith('Loja ')) {
                  updatedMap[store.id] = {
                    ...updatedMap[store.id],
                    nome: store.nome || updatedMap[store.id]?.nome || `Loja ${store.id.substring(0, 4)}`,
                    logo_url: store.logo_url || updatedMap[store.id]?.logo_url || null
                  };
                }
              }
            });
            
            return updatedMap;
          });
          
          console.log("Store info updated with stores data");
        }
      } catch (err) {
        console.log("Failed to fetch stores data:", err);
        setError("Erro ao carregar informações das lojas");
      }
    } catch (err) {
      console.error("Error in store info processing:", err);
      setError("Erro ao processar informações das lojas");
    } finally {
      setLoading(false);
    }
  }, [storeIds]);
    
  // Call the fetch function when store IDs change
  useEffect(() => {
    if (storeIds?.length) {
      fetchStoreInfo();
    } else {
      setStoreInfo({});
      setLoading(false);
    }
  }, [storeIds, fetchStoreInfo]);

  return { storeInfo, loading, error, refetch: fetchStoreInfo };
};
