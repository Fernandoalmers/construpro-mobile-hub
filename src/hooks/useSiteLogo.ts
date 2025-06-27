
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { updateFavicon } from '@/utils/faviconUtils';

export const useSiteLogo = () => {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const updateLogoAndFavicon = (newLogoUrl: string | null) => {
    setLogoUrl(newLogoUrl);
    if (newLogoUrl) {
      updateFavicon(newLogoUrl);
    }
  };

  const fetchLogo = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('logo_url')
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching logo:', error);
        return;
      }

      const fetchedLogoUrl = data?.logo_url || null;
      updateLogoAndFavicon(fetchedLogoUrl);
    } catch (error) {
      console.error('Error fetching logo:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogo();

    // Escutar mudanças em tempo real
    const subscription = supabase
      .channel('site_settings_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'site_settings'
        },
        (payload) => {
          console.log('Site settings changed:', payload);
          if (payload.new && 'logo_url' in payload.new) {
            updateLogoAndFavicon(payload.new.logo_url);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    logoUrl,
    isLoading,
    refetch: fetchLogo
  };
};
