
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useStoreInfo = (storeIds: string[]) => {
  const [storeInfo, setStoreInfo] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    const fetchStoreInfo = async () => {
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
        
        // If we got data from vendedores, use that
        if (vendedoresData && vendedoresData.length > 0) {
          const vendedoresMap = vendedoresData.reduce((acc, store) => {
            acc[store.id] = {
              id: store.id,
              nome: store.nome_loja,
              logo_url: store.logo
            };
            return acc;
          }, {} as Record<string, any>);
          
          setStoreInfo(vendedoresMap);
          console.log("Store info fetched from vendedores:", vendedoresMap);
          setLoading(false);
          return;
        }
        
        // Fallback to stores table
        const { data: storesData, error: storesError } = await supabase
          .from('stores')
          .select('id, nome, logo_url')
          .in('id', storeIds);
          
        if (storesError) {
          throw storesError;
        }
        
        if (storesData) {
          // Create a lookup map of store info
          const storeMap = storesData.reduce((acc, store) => {
            acc[store.id] = store;
            return acc;
          }, {} as Record<string, any>);
          
          setStoreInfo(storeMap);
          console.log("Store info fetched from stores:", storeMap);
        }
      } catch (err) {
        console.error("Error fetching store info:", err);
      } finally {
        setLoading(false);
      }
    };
    
    if (storeIds?.length) {
      fetchStoreInfo();
    }
  }, [storeIds]);

  return { storeInfo, loading };
};
