
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useLogoVariant = () => {
  const [logoVariantUrl, setLogoVariantUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogoVariant = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('logo_variant_url')
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching logo variant:', error);
        return;
      }

      const fetchedLogoVariantUrl = data?.logo_variant_url || null;
      setLogoVariantUrl(fetchedLogoVariantUrl);
    } catch (error) {
      console.error('Error fetching logo variant:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogoVariant();

    // Escutar mudanças em tempo real
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
          console.log('Site settings changed (logo variant):', payload);
          if (payload.new && 'logo_variant_url' in payload.new) {
            setLogoVariantUrl(payload.new.logo_variant_url);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    logoVariantUrl,
    isLoading,
    refetch: fetchLogoVariant
  };
};
