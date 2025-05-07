
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useStoreInfo = (storeIds: string[]) => {
  const [storeInfo, setStoreInfo] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  
  // Use memoized function to avoid recreating it on every render
  const fetchStoreInfo = useCallback(async () => {
    if (!storeIds || storeIds.length === 0) return;
    
    setLoading(true);
    
    try {
      // Create initial store map with stable IDs and names
      const initialStoreMap = storeIds.reduce((acc, id) => {
        // Use a stable format for store names - use full ID to avoid truncation
        acc[id] = {
          id: id,
          nome: `Loja ${id}`, // Use full ID for stability until real data loads
          logo_url: null
        };
        return acc;
      }, {} as Record<string, any>);
      
      // Set initial data first to prevent flickering
      setStoreInfo(initialStoreMap);
      
      // Try to get data from vendedores table first
      const { data: vendedoresData, error: vendedoresError } = await supabase
        .from('vendedores')
        .select('id, nome_loja, logo')
        .in('id', storeIds);
          
      if (vendedoresError) {
        console.error("Error fetching vendedores:", vendedoresError);
      }
      
      // If we got data from vendedores, use that
      if (vendedoresData && vendedoresData.length > 0) {
        const updatedMap = {...initialStoreMap};
        
        vendedoresData.forEach(store => {
          if (store.id) {
            updatedMap[store.id] = {
              id: store.id,
              nome: store.nome_loja || initialStoreMap[store.id].nome,
              logo_url: store.logo || null
            };
          }
        });
        
        setStoreInfo(updatedMap);
        console.log("Store info updated with vendedores data:", updatedMap);
      }
      
      // Also try stores table as fallback for any remaining stores
      const remainingIds = Object.keys(initialStoreMap);
      
      if (remainingIds.length > 0) {
        const { data: storesData } = await supabase
          .from('stores')
          .select('id, nome, logo_url')
          .in('id', remainingIds);
          
        if (storesData && storesData.length > 0) {
          const finalMap = {...storeInfo}; // Use current state
          
          storesData.forEach(store => {
            if (store.id && finalMap[store.id]) {
              // Only update if we don't have a name from vendedores already
              if (!vendedoresData?.some(v => v.id === store.id && v.nome_loja)) {
                finalMap[store.id] = {
                  ...finalMap[store.id],
                  nome: store.nome || finalMap[store.id].nome,
                  logo_url: store.logo_url || finalMap[store.id].logo_url
                };
              }
            }
          });
          
          setStoreInfo(finalMap);
        }
      }
    } catch (err) {
      console.error("Error fetching store info:", err);
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
