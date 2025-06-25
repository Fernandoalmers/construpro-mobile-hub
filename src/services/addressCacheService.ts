
export interface CachedAddressData {
  addresses: any[];
  timestamp: number;
  version: string;
}

const CACHE_KEY = 'matershop_addresses_cache';
const CACHE_VERSION = '1.0';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutos

export const addressCacheService = {
  /**
   * Salva endereços no cache localStorage
   */
  saveToCache(addresses: any[]): void {
    try {
      const cacheData: CachedAddressData = {
        addresses,
        timestamp: Date.now(),
        version: CACHE_VERSION
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
      console.log('[AddressCache] Endereços salvos no cache:', addresses.length);
    } catch (error) {
      console.warn('[AddressCache] Erro ao salvar cache:', error);
    }
  },

  /**
   * Carrega endereços do cache se válido
   */
  loadFromCache(): any[] | null {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;

      const cacheData: CachedAddressData = JSON.parse(cached);
      
      // Verificar versão e expiração
      if (cacheData.version !== CACHE_VERSION) {
        console.log('[AddressCache] Versão do cache desatualizada');
        this.clearCache();
        return null;
      }

      const isExpired = Date.now() - cacheData.timestamp > CACHE_EXPIRY;
      if (isExpired) {
        console.log('[AddressCache] Cache expirado');
        this.clearCache();
        return null;
      }

      console.log('[AddressCache] Endereços carregados do cache:', cacheData.addresses.length);
      return cacheData.addresses;
    } catch (error) {
      console.warn('[AddressCache] Erro ao carregar cache:', error);
      this.clearCache();
      return null;
    }
  },

  /**
   * Limpa o cache
   */
  clearCache(): void {
    try {
      localStorage.removeItem(CACHE_KEY);
      console.log('[AddressCache] Cache limpo');
    } catch (error) {
      console.warn('[AddressCache] Erro ao limpar cache:', error);
    }
  },

  /**
   * Verifica se o cache está válido
   */
  isCacheValid(): boolean {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return false;

      const cacheData: CachedAddressData = JSON.parse(cached);
      const isVersionValid = cacheData.version === CACHE_VERSION;
      const isNotExpired = Date.now() - cacheData.timestamp <= CACHE_EXPIRY;
      
      return isVersionValid && isNotExpired;
    } catch {
      return false;
    }
  }
};
