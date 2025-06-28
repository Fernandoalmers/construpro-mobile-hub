
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useFavicon = () => {
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const updateFavicon = (newFaviconUrl: string | null) => {
    console.log('🔄 [useFavicon] Atualizando favicon:', newFaviconUrl);
    setFaviconUrl(newFaviconUrl);
    
    if (newFaviconUrl) {
      // Remover favicon existente
      const existingFavicons = document.querySelectorAll('link[rel*="icon"]');
      existingFavicons.forEach(favicon => favicon.remove());

      // Criar novo favicon com cache busting
      const favicon = document.createElement('link');
      favicon.rel = 'icon';
      favicon.type = 'image/png';
      // Adicionar timestamp para evitar cache
      const cacheBuster = `?v=${Date.now()}`;
      favicon.href = newFaviconUrl + cacheBuster;

      // Adicionar ao head
      document.head.appendChild(favicon);
      
      console.log('✅ [useFavicon] Favicon atualizado com cache busting:', newFaviconUrl + cacheBuster);
    }
  };

  const fetchFavicon = async () => {
    try {
      console.log('🔍 [useFavicon] Buscando favicon do banco...');
      const { data, error } = await supabase
        .from('site_settings')
        .select('favicon_url')
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('❌ [useFavicon] Erro ao buscar favicon:', error);
        return;
      }

      const fetchedFaviconUrl = data?.favicon_url || null;
      console.log('✅ [useFavicon] Favicon encontrado:', fetchedFaviconUrl);
      updateFavicon(fetchedFaviconUrl);
    } catch (error) {
      console.error('❌ [useFavicon] Erro inesperado:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFavicon();

    // Canal específico para mudanças no favicon
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
          console.log('🔔 [useFavicon] Mudança detectada:', payload);
          if (payload.new && 'favicon_url' in payload.new) {
            console.log('📝 [useFavicon] Nova favicon URL:', payload.new.favicon_url);
            updateFavicon(payload.new.favicon_url);
          }
        }
      )
      .subscribe();

    console.log('👂 [useFavicon] Escutando mudanças no canal site_settings_favicon_changes');

    return () => {
      console.log('🔇 [useFavicon] Desconectando do canal');
      subscription.unsubscribe();
    };
  }, []);

  return {
    faviconUrl,
    isLoading,
    refetch: fetchFavicon
  };
};
