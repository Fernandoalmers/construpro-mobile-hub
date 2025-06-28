
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useLogoVariant = () => {
  const [logoVariantUrl, setLogoVariantUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const updateLogoVariant = (newLogoVariantUrl: string | null) => {
    console.log('🔄 [useLogoVariant] Atualizando logo variante:', newLogoVariantUrl);
    setLogoVariantUrl(newLogoVariantUrl);
  };

  const fetchLogoVariant = async () => {
    try {
      console.log('🔍 [useLogoVariant] Buscando logo variante do banco...');
      const { data, error } = await supabase
        .from('site_settings')
        .select('logo_variant_url')
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('❌ [useLogoVariant] Erro ao buscar logo variante:', error);
        return;
      }

      const fetchedLogoVariantUrl = data?.logo_variant_url || null;
      console.log('✅ [useLogoVariant] Logo variante encontrada:', fetchedLogoVariantUrl);
      updateLogoVariant(fetchedLogoVariantUrl);
    } catch (error) {
      console.error('❌ [useLogoVariant] Erro inesperado:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogoVariant();

    // Canal específico para mudanças na logo variante
    const subscription = supabase
      .channel('site_settings_logo_variant_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'site_settings'
        },
        (payload) => {
          console.log('🔔 [useLogoVariant] Mudança detectada:', payload);
          if (payload.new && 'logo_variant_url' in payload.new) {
            console.log('📝 [useLogoVariant] Nova logo variante URL:', payload.new.logo_variant_url);
            updateLogoVariant(payload.new.logo_variant_url);
          }
        }
      )
      .subscribe();

    console.log('👂 [useLogoVariant] Escutando mudanças no canal site_settings_logo_variant_changes');

    return () => {
      console.log('🔇 [useLogoVariant] Desconectando do canal');
      subscription.unsubscribe();
    };
  }, []);

  return {
    logoVariantUrl,
    isLoading,
    refetch: fetchLogoVariant
  };
};
