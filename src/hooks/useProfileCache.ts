
import { useState, useEffect, useCallback } from 'react';
import { UserProfile } from '@/services/userService';

interface ProfileCacheData {
  profile: UserProfile;
  timestamp: number;
  version: number;
}

const CACHE_KEY = 'matershop_profile_cache';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const CACHE_VERSION = 1;

export const useProfileCache = () => {
  const [cachedProfile, setCachedProfile] = useState<UserProfile | null>(null);
  const [cacheTimestamp, setCacheTimestamp] = useState<number | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const data: ProfileCacheData = JSON.parse(cached);
        const now = Date.now();
        
        // Check if cache is still valid and version matches
        if (
          data.version === CACHE_VERSION &&
          (now - data.timestamp) < CACHE_TTL &&
          data.profile
        ) {
          console.log('📦 [useProfileCache] Carregando perfil do cache local');
          setCachedProfile(data.profile);
          setCacheTimestamp(data.timestamp);
        } else {
          console.log('🗑️ [useProfileCache] Cache expirado ou versão incompatível, removendo');
          localStorage.removeItem(CACHE_KEY);
        }
      }
    } catch (error) {
      console.error('❌ [useProfileCache] Erro ao carregar cache:', error);
      localStorage.removeItem(CACHE_KEY);
    }
  }, []);

  const saveToCache = useCallback((profile: UserProfile) => {
    try {
      const data: ProfileCacheData = {
        profile,
        timestamp: Date.now(),
        version: CACHE_VERSION
      };
      
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
      setCachedProfile(profile);
      setCacheTimestamp(data.timestamp);
      console.log('💾 [useProfileCache] Perfil salvo no cache local');
    } catch (error) {
      console.error('❌ [useProfileCache] Erro ao salvar no cache:', error);
    }
  }, []);

  const clearCache = useCallback(() => {
    localStorage.removeItem(CACHE_KEY);
    setCachedProfile(null);
    setCacheTimestamp(null);
    console.log('🗑️ [useProfileCache] Cache limpo');
  }, []);

  const isCacheValid = useCallback(() => {
    if (!cacheTimestamp) return false;
    return (Date.now() - cacheTimestamp) < CACHE_TTL;
  }, [cacheTimestamp]);

  const getCacheAge = useCallback(() => {
    if (!cacheTimestamp) return null;
    return Date.now() - cacheTimestamp;
  }, [cacheTimestamp]);

  return {
    cachedProfile,
    saveToCache,
    clearCache,
    isCacheValid,
    getCacheAge,
    hasCachedData: !!cachedProfile
  };
};
