
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useSiteLogo = () => {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const updateLogo = (newLogoUrl: string | null) => {
    console.log('🔄 [useSiteLogo] Atualizando logo:', newLogoUrl);
    setLogoUrl(newLogoUrl);
  };

  const fetchLogo = async () => {
    try {
      console.log('🔍 [useSiteLogo] Buscando logo do banco...');
      const { data, error } = await supabase
        .from('site_settings')
        .select('logo_url')
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('❌ [useSiteLogo] Erro ao buscar logo:', error);
        return;
      }

      const fetchedLogoUrl = data?.logo_url || null;
      console.log('✅ [useSiteLogo] Logo encontrada:', fetchedLogoUrl);
      updateLogo(fetchedLogoUrl);
    } catch (error) {
      console.error('❌ [useSiteLogo] Erro inesperado:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogo();

    // Canal específico para mudanças na logo
    const subscription = supabase
      .channel('site_settings_logo_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'site_settings'
        },
        (payload) => {
          console.log('🔔 [useSiteLogo] Mudança detectada:', payload);
          if (payload.new && 'logo_url' in payload.new) {
            console.log('📝 [useSiteLogo] Nova logo URL:', payload.new.logo_url);
            updateLogo(payload.new.logo_url);
          }
        }
      )
      .subscribe();

    console.log('👂 [useSiteLogo] Escutando mudanças no canal site_settings_logo_changes');

    return () => {
      console.log('🔇 [useSiteLogo] Desconectando do canal');
      subscription.unsubscribe();
    };
  }, []);

  return {
    logoUrl,
    isLoading,
    refetch: fetchLogo
  };
};
