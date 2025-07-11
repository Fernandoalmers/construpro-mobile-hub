
import { useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export function useUserAddress() {
  const { profile, isAuthenticated } = useAuth();
  const [currentUserCep, setCurrentUserCep] = useState<string | null>(null);

  // Enhanced function to get user's main address with CORRECT prioritization
  const getUserMainAddress = useCallback(async () => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [useUserAddress] Getting user main address for user:`, profile?.id);
    
    // Only proceed if user is authenticated
    if (!isAuthenticated || !profile?.id) {
      console.log(`[${timestamp}] [useUserAddress] User not authenticated or no profile ID`);
      return null;
    }

    try {
      // FIRST: Check profile.endereco_principal (most common and reliable)
      console.log(`[${timestamp}] [useUserAddress] Step 1: Checking profile.endereco_principal`);
      
      if (profile?.endereco_principal && profile.endereco_principal.cep) {
        console.log(`[${timestamp}] [useUserAddress] ✅ Found endereco_principal in profile:`, {
          cep: profile.endereco_principal.cep,
          cidade: profile.endereco_principal.cidade,
          estado: profile.endereco_principal.estado
        });
        
        setCurrentUserCep(profile.endereco_principal.cep);
        return profile.endereco_principal;
      }

      console.log(`[${timestamp}] [useUserAddress] Step 2: No endereco_principal found, checking user_addresses table`);
      
      // SECOND: Try to get main address from user_addresses table
      const { data: mainAddress, error: mainError } = await supabase
        .from('user_addresses')
        .select('*')
        .eq('user_id', profile.id)
        .eq('principal', true)
        .maybeSingle();

      if (!mainError && mainAddress && mainAddress.cep) {
        console.log(`[${timestamp}] [useUserAddress] ✅ Found main address from user_addresses:`, {
          cep: mainAddress.cep,
          cidade: mainAddress.cidade,
          estado: mainAddress.estado
        });
        
        const addressData = {
          logradouro: mainAddress.logradouro,
          numero: mainAddress.numero,
          complemento: mainAddress.complemento,
          bairro: mainAddress.bairro,
          cidade: mainAddress.cidade,
          estado: mainAddress.estado,
          cep: mainAddress.cep
        };
        
        setCurrentUserCep(mainAddress.cep);
        
        // Sync to profile for future use
        try {
          console.log(`[${timestamp}] [useUserAddress] Syncing endereco_principal to profile`);
          await supabase
            .from('profiles')
            .update({
              endereco_principal: addressData,
              updated_at: new Date().toISOString()
            })
            .eq('id', profile.id);
        } catch (syncError) {
          console.error(`[${timestamp}] [useUserAddress] Error syncing endereco_principal:`, syncError);
        }
        
        return addressData;
      }

      // THIRD: If no main address, try to get first available address
      console.log(`[${timestamp}] [useUserAddress] Step 3: No main address found, trying first available address`);
      
      const { data: firstAddress, error: firstError } = await supabase
        .from('user_addresses')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (!firstError && firstAddress && firstAddress.cep) {
        console.log(`[${timestamp}] [useUserAddress] ✅ Using first available address:`, {
          cep: firstAddress.cep,
          cidade: firstAddress.cidade,
          estado: firstAddress.estado
        });
        
        const addressData = {
          logradouro: firstAddress.logradouro,
          numero: firstAddress.numero,
          complemento: firstAddress.complemento,
          bairro: firstAddress.bairro,
          cidade: firstAddress.cidade,
          estado: firstAddress.estado,
          cep: firstAddress.cep
        };
        
        setCurrentUserCep(firstAddress.cep);
        return addressData;
      }

      console.log(`[${timestamp}] [useUserAddress] ❌ No address found anywhere`);
      setCurrentUserCep(null);
      return null;

    } catch (error) {
      console.error(`[${timestamp}] [useUserAddress] Exception fetching user address:`, error);
      setCurrentUserCep(null);
      return null;
    }
  }, [profile?.id, profile?.endereco_principal, isAuthenticated]);

  return {
    getUserMainAddress,
    currentUserCep,
    setCurrentUserCep
  };
}
