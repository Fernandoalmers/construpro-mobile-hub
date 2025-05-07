
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
      // Try to get data from vendedores table first (preferred)
      const { data: vendedoresData, error: vendedoresError } = await supabase
        .from('vendedores')
        .select('id, nome_loja, logo')
        .in('id', storeIds);
          
      if (vendedoresError) {
        console.error("Error fetching vendedores:", vendedoresError);
      }
      
      // Create initial store map with consistent defaults
      const initialStoreMap = storeIds.reduce((acc, id) => {
        acc[id] = {
          id: id,
          nome: `Loja ${id.substring(0, 4)}`,
          logo_url: null
        };
        return acc;
      }, {} as Record<string, any>);
      
      // If we got data from vendedores, use that to update our base map
      if (vendedoresData && vendedoresData.length > 0) {
        vendedoresData.forEach(store => {
          initialStoreMap[store.id] = {
            id: store.id,
            nome: store.nome_loja || initialStoreMap[store.id].nome, // Fallback to default if null
            logo_url: store.logo || null
          };
        });
        
        console.log("Store info updated with vendedores data:", initialStoreMap);
      }
      
      // Fallback to stores table for any remaining stores without info
      const remainingIds = Object.keys(initialStoreMap).filter(id => 
        !initialStoreMap[id].nome || initialStoreMap[id].nome.startsWith('Loja ')
      );
      
      if (remainingIds.length > 0) {
        const { data: storesData } = await supabase
          .from('stores')
          .select('id, nome, logo_url')
          .in('id', remainingIds);
          
        if (storesData && storesData.length > 0) {
          storesData.forEach(store => {
            if (initialStoreMap[store.id]) {
              initialStoreMap[store.id] = {
                ...initialStoreMap[store.id],
                nome: store.nome || initialStoreMap[store.id].nome,
                logo_url: store.logo_url || initialStoreMap[store.id].logo_url
              };
            }
          });
          
          console.log("Store info updated with stores data:", initialStoreMap);
        }
      }
      
      // Set the final store info in one update to prevent flickering
      setStoreInfo(initialStoreMap);
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
