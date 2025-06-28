
import { useState, useEffect } from 'react';

interface LogoCacheEntry {
  url: string;
  timestamp: number;
  preloaded: boolean;
}

interface LogoCache {
  main_logo?: LogoCacheEntry;
  variant_logo?: LogoCacheEntry;
}

const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 horas em ms
const CACHE_KEY = 'matershop_logo_cache';

export const useLogoCache = () => {
  const [cache, setCache] = useState<LogoCache>({});

  // Carregar cache do localStorage
  useEffect(() => {
    try {
      const cachedData = localStorage.getItem(CACHE_KEY);
      if (cachedData) {
        const parsedCache: LogoCache = JSON.parse(cachedData);
        // Verificar se não expirou
        const now = Date.now();
        const validCache: LogoCache = {};
        
        Object.entries(parsedCache).forEach(([key, entry]) => {
          if (entry && now - entry.timestamp < CACHE_EXPIRY) {
            validCache[key as keyof LogoCache] = entry;
          }
        });
        
        setCache(validCache);
        console.log('🗂️ [useLogoCache] Cache carregado:', validCache);
      }
    } catch (error) {
      console.error('❌ [useLogoCache] Erro ao carregar cache:', error);
    }
  }, []);

  // Precarregar imagem
  const preloadImage = (url: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        console.log('✅ [useLogoCache] Imagem precarregada:', url);
        resolve(true);
      };
      img.onerror = () => {
        console.log('❌ [useLogoCache] Erro ao precarregar:', url);
        resolve(false);
      };
      img.src = url;
    });
  };

  // Salvar logo no cache
  const cacheLogo = async (type: 'main_logo' | 'variant_logo', url: string) => {
    console.log(`🔄 [useLogoCache] Salvando ${type} no cache:`, url);
    
    // Precarregar a imagem
    const preloaded = await preloadImage(url);
    
    const entry: LogoCacheEntry = {
      url,
      timestamp: Date.now(),
      preloaded
    };

    const newCache = { ...cache, [type]: entry };
    setCache(newCache);

    // Salvar no localStorage
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(newCache));
      console.log(`✅ [useLogoCache] ${type} salva no cache com sucesso`);
    } catch (error) {
      console.error('❌ [useLogoCache] Erro ao salvar cache:', error);
    }
  };

  // Obter logo do cache
  const getCachedLogo = (type: 'main_logo' | 'variant_logo'): string | null => {
    const entry = cache[type];
    if (entry && entry.preloaded) {
      console.log(`📦 [useLogoCache] Logo ${type} encontrada no cache:`, entry.url);
      return entry.url;
    }
    return null;
  };

  // Verificar se logo está em cache
  const isLogoCached = (type: 'main_logo' | 'variant_logo'): boolean => {
    return !!cache[type]?.preloaded;
  };

  return {
    cacheLogo,
    getCachedLogo,
    isLogoCached,
    preloadImage
  };
};
