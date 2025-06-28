
import { useEffect } from 'react';
import { useSegmentImageCache } from './useSegmentImageCache';
import { getProductSegments } from '@/services/admin/productSegmentsService';

export const useSegmentPreloader = () => {
  const { preloadSegmentImages } = useSegmentImageCache();

  useEffect(() => {
    const preloadAllSegments = async () => {
      try {
        console.log('🚀 [useSegmentPreloader] Iniciando precarregamento de segmentos...');
        
        // Buscar todos os segmentos ativos
        const segments = await getProductSegments();
        const activeSegments = segments.filter(segment => segment.status === 'ativo');
        
        console.log('📦 [useSegmentPreloader] Segmentos ativos encontrados:', activeSegments.length);
        
        // Precarregar imagens em background
        await preloadSegmentImages(activeSegments);
        
        console.log('✅ [useSegmentPreloader] Precarregamento concluído');
      } catch (error) {
        console.error('❌ [useSegmentPreloader] Erro no precarregamento:', error);
      }
    };

    // Usar setTimeout para não bloquear a renderização inicial
    const timer = setTimeout(preloadAllSegments, 100);
    
    return () => clearTimeout(timer);
  }, [preloadSegmentImages]);
};
