
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
      // Create initial store map with consistent defaults
      const initialStoreMap = validStoreIds.reduce((acc, id) => {
        if (!id) return acc; // Skip null/undefined ids
        
        // Use default store name format for new stores
        acc[id] = {
          id: id,
          nome: `Loja ${id.substring(0, 4)}`, // Shorter initial name
          logo_url: null
        };
        return acc;
      }, {} as Record<string, any>);
      
      // Using functional update to avoid stateInfo dependency
      setStoreInfo(initialStoreMap); 
      
      try {
        // Try to get data from vendedores table first (preferred)
        const { data: vendedoresData, error: vendedoresError } = await supabase
          .from('vendedores')
          .select('id, nome_loja, logo')
          .in('id', validStoreIds);
              
        if (vendedoresError) {
          console.error("Error fetching vendedores:", vendedoresError);
          // Don't throw - continue with initialStoreMap and try stores table
        }
        
        // If we got data from vendedores, use that to update our base map
        if (vendedoresData && vendedoresData.length > 0) {
          // Using functional update to safely access previous state
          setStoreInfo(prevState => {
            const updatedMap = {...prevState};
            
            vendedoresData.forEach(store => {
              if (store.id) {
                updatedMap[store.id] = {
                  id: store.id,
                  nome: store.nome_loja || updatedMap[store.id]?.nome || `Loja ${store.id.substring(0, 4)}`,
                  logo_url: store.logo || null
                };
              }
            });
            
            return updatedMap;
          });
          
          console.log("Store info updated with vendedores data");
        }
      } catch (err) {
        console.log("Failed to fetch vendedores data, continuing with fallback:", err);
        // Continue with stores table fallback
      }
      
      // Try stores table for any remaining stores without info
      try {
        const { data: storesData, error: storesError } = await supabase
          .from('stores')
          .select('id, nome, logo_url')
          .in('id', validStoreIds);
            
        if (storesError) {
          console.error("Error fetching stores:", storesError);
          // Continue with current state
        }
            
        if (storesData && storesData.length > 0) {
          // Using functional update to safely access previous state
          setStoreInfo(prevState => {
            const updatedMap = {...prevState};
            
            storesData.forEach(store => {
              if (store.id) {
                updatedMap[store.id] = {
                  ...updatedMap[store.id],
                  nome: store.nome || updatedMap[store.id]?.nome || `Loja ${store.id.substring(0, 4)}`,
                  logo_url: store.logo_url || updatedMap[store.id]?.logo_url || null
                };
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
  }, [storeIds]); // Remove storeInfo dependency
    
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
