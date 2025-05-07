
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useStoreInfo = (storeIds: string[]) => {
  const [storeInfo, setStoreInfo] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  
  // Use memoized function to avoid recreating it on every render
  const fetchStoreInfo = useCallback(async () => {
    if (!storeIds || storeIds.length === 0) return;
    
    setLoading(true);
    console.log("Fetching store info for:", storeIds);
    
    try {
      // Create initial store map with consistent defaults
      const initialStoreMap = storeIds.reduce((acc, id) => {
        acc[id] = {
          id: id,
          nome: `Loja ${id.substring(0, 4)}...`,
          logo_url: null
        };
        return acc;
      }, {} as Record<string, any>);
      
      // Try to get data from vendedores table first (preferred)
      const { data: vendedoresData, error: vendedoresError } = await supabase
        .from('vendedores')
        .select('id, nome_loja, logo')
        .in('id', storeIds);
          
      if (vendedoresError) {
        console.error("Error fetching vendedores:", vendedoresError);
      }
      
      // If we got data from vendedores, use that to update our base map
      if (vendedoresData && vendedoresData.length > 0) {
        const updatedMap = {...initialStoreMap};
        
        vendedoresData.forEach(store => {
          if (store.id) {
            updatedMap[store.id] = {
              id: store.id,
              nome: store.nome_loja || updatedMap[store.id].nome,
              logo_url: store.logo || null
            };
          }
        });
        
        setStoreInfo(updatedMap);
        console.log("Store info updated with vendedores data:", updatedMap);
        setLoading(false);
        return; // Early return to avoid flickering
      }
      
      // Fallback to stores table for any remaining stores without info
      const remainingIds = Object.keys(initialStoreMap);
      
      if (remainingIds.length > 0) {
        const { data: storesData } = await supabase
          .from('stores')
          .select('id, nome, logo_url')
          .in('id', remainingIds);
          
        if (storesData && storesData.length > 0) {
          const updatedMap = {...initialStoreMap};
          
          storesData.forEach(store => {
            if (store.id && updatedMap[store.id]) {
              updatedMap[store.id] = {
                ...updatedMap[store.id],
                nome: store.nome || updatedMap[store.id].nome,
                logo_url: store.logo_url || updatedMap[store.id].logo_url
              };
            }
          });
          
          // Set final store info
          setStoreInfo(updatedMap);
          console.log("Store info updated with stores data:", updatedMap);
        } else {
          // If no data from either source, still use our initial placeholders
          setStoreInfo(initialStoreMap);
        }
      }
    } catch (err) {
      console.error("Error fetching store info:", err);
      // On error, still provide a default map instead of empty state
      const fallbackMap = storeIds.reduce((acc, id) => {
        acc[id] = { id, nome: `Loja ${id.substring(0, 4)}...`, logo_url: null };
        return acc;
      }, {} as Record<string, any>);
      setStoreInfo(fallbackMap);
    } finally {
      setLoading(false);
    }
  }, [storeIds]);
    
  // Call the fetch function when store IDs change
  useEffect(() => {
    if (storeIds?.length) {
      fetchStoreInfo();
    }
  }, [storeIds, fetchStoreInfo]);

  return { storeInfo, loading };
};
