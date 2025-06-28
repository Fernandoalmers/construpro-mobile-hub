
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useFavicon = () => {
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const updateFavicon = (newFaviconUrl: string | null) => {
    setFaviconUrl(newFaviconUrl);
    
    if (newFaviconUrl) {
      // Remover favicon existente
      const existingFavicons = document.querySelectorAll('link[rel*="icon"]');
      existingFavicons.forEach(favicon => favicon.remove());

      // Criar novo favicon
      const favicon = document.createElement('link');
      favicon.rel = 'icon';
      favicon.type = 'image/png';
      favicon.href = newFaviconUrl;

      // Adicionar ao head
      document.head.appendChild(favicon);
      
      console.log('✅ [useFavicon] Favicon atualizado:', newFaviconUrl);
    }
  };

  const fetchFavicon = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('favicon_url')
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching favicon:', error);
        return;
      }

      const fetchedFaviconUrl = data?.favicon_url || null;
      updateFavicon(fetchedFaviconUrl);
    } catch (error) {
      console.error('Error fetching favicon:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFavicon();

    // Escutar mudanças em tempo real
    const subscription = supabase
      .channel('site_settings_favicon_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'site_settings'
        },
        (payload) => {
          console.log('Site settings changed (favicon):', payload);
          if (payload.new && 'favicon_url' in payload.new) {
            updateFavicon(payload.new.favicon_url);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    faviconUrl,
    isLoading,
    refetch: fetchFavicon
  };
};
