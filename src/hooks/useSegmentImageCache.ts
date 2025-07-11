
import { useState, useEffect, useCallback } from 'react';

interface SegmentCacheEntry {
  url: string;
  timestamp: number;
  preloaded: boolean;
}

interface SegmentCache {
  [segmentId: string]: SegmentCacheEntry;
}

const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 horas em ms
const CACHE_KEY = 'matershop_segment_cache';

export const useSegmentImageCache = () => {
  const [cache, setCache] = useState<SegmentCache>({});

  // Carregar cache do localStorage
  useEffect(() => {
    try {
      const cachedData = localStorage.getItem(CACHE_KEY);
      if (cachedData) {
        const parsedCache: SegmentCache = JSON.parse(cachedData);
        // Verificar se não expirou
        const now = Date.now();
        const validCache: SegmentCache = {};
        
        Object.entries(parsedCache).forEach(([key, entry]) => {
          if (entry && now - entry.timestamp < CACHE_EXPIRY) {
            validCache[key] = entry;
          }
        });
        
        setCache(validCache);
        console.log('🗂️ [useSegmentImageCache] Cache carregado:', validCache);
      }
    } catch (error) {
      console.error('❌ [useSegmentImageCache] Erro ao carregar cache:', error);
    }
  }, []);

  // Precarregar imagem - MEMOIZADA para evitar recriação
  const preloadImage = useCallback((url: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        console.log('✅ [useSegmentImageCache] Imagem precarregada:', url);
        resolve(true);
      };
      img.onerror = () => {
        console.log('❌ [useSegmentImageCache] Erro ao precarregar:', url);
        resolve(false);
      };
      img.src = url;
    });
  }, []);

  // Salvar segmento no cache - MEMOIZADA para evitar recriação
  const cacheSegmentImage = useCallback(async (segmentId: string, url: string) => {
    console.log(`🔄 [useSegmentImageCache] Salvando segmento ${segmentId} no cache:`, url);
    
    // Precarregar a imagem
    const preloaded = await preloadImage(url);
    
    const entry: SegmentCacheEntry = {
      url,
      timestamp: Date.now(),
      preloaded
    };

    setCache(prevCache => {
      const newCache = { ...prevCache, [segmentId]: entry };
      
      // Salvar no localStorage
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(newCache));
        console.log(`✅ [useSegmentImageCache] Segmento ${segmentId} salvo no cache com sucesso`);
      } catch (error) {
        console.error('❌ [useSegmentImageCache] Erro ao salvar cache:', error);
      }
      
      return newCache;
    });
  }, [preloadImage]);

  // Obter imagem do cache - MEMOIZADA
  const getCachedSegmentImage = useCallback((segmentId: string): string | null => {
    const entry = cache[segmentId];
    if (entry && entry.preloaded) {
      console.log(`📦 [useSegmentImageCache] Segmento ${segmentId} encontrado no cache:`, entry.url);
      return entry.url;
    }
    return null;
  }, [cache]);

  // Verificar se segmento está em cache - MEMOIZADA
  const isSegmentCached = useCallback((segmentId: string): boolean => {
    return !!cache[segmentId]?.preloaded;
  }, [cache]);

  // Precarregar múltiplas imagens - MEMOIZADA
  const preloadSegmentImages = useCallback(async (segments: Array<{ id: string; image_url?: string | null }>) => {
    console.log('🚀 [useSegmentImageCache] Precarregando imagens de segmentos:', segments.length);
    
    const promises = segments
      .filter(segment => segment.image_url && !isSegmentCached(segment.id))
      .map(segment => cacheSegmentImage(segment.id, segment.image_url!));
    
    await Promise.all(promises);
  }, [isSegmentCached, cacheSegmentImage]);

  return {
    cacheSegmentImage,
    getCachedSegmentImage,
    isSegmentCached,
    preloadSegmentImages,
    preloadImage
  };
};
