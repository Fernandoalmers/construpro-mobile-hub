import { useQuery } from '@tanstack/react-query';
import { getProductSegments, ProductSegment } from '@/services/admin/productSegmentsService';

// Segmentos de fallback com imagens reais e gradientes temáticos
const ENHANCED_FALLBACK_SEGMENTS: ProductSegment[] = [
  {
    id: 'material-construcao',
    nome: 'Material de Construção',
    status: 'ativo',
    image_url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80',
    categorias_count: 0
  },
  {
    id: 'eletrica', 
    nome: 'Elétrica',
    status: 'ativo',
    image_url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&q=80',
    categorias_count: 0
  },
  {
    id: 'vidracaria',
    nome: 'Vidraçaria', 
    status: 'ativo',
    image_url: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800&q=80',
    categorias_count: 0
  },
  {
    id: 'marmoraria',
    nome: 'Marmoraria',
    status: 'ativo', 
    image_url: 'https://images.unsplash.com/photo-1615971677499-5467cbab01c0?w=800&q=80',
    categorias_count: 0
  },
  {
    id: 'equipamentos',
    nome: 'Aluguel de Equipamentos',
    status: 'ativo',
    image_url: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800&q=80', 
    categorias_count: 0
  }
];

// Mapeamento de gradientes por segmento
export const getSegmentGradient = (segmentName: string): string => {
  const nameToLower = segmentName.toLowerCase();
  
  if (nameToLower.includes('material') && nameToLower.includes('constru')) {
    return 'from-orange-500 to-orange-700';
  } else if (nameToLower.includes('elétri') || nameToLower.includes('eletri')) {
    return 'from-yellow-500 to-yellow-700';
  } else if (nameToLower.includes('vidro') || nameToLower.includes('vidraç')) {
    return 'from-cyan-500 to-cyan-700';
  } else if (nameToLower.includes('marmor')) {
    return 'from-gray-500 to-gray-700';
  } else if (nameToLower.includes('aluguel') || nameToLower.includes('equipamento')) {
    return 'from-green-500 to-green-700';
  } else {
    return 'from-construPro-blue to-construPro-blue/80';
  }
};

export const useMarketplaceSegments = () => {
  return useQuery({
    queryKey: ['marketplace-segments'],
    queryFn: async (): Promise<ProductSegment[]> => {
      console.log('🔄 [useMarketplaceSegments] Carregando segmentos...');
      
      try {
        const segments = await getProductSegments();
        console.log('✅ [useMarketplaceSegments] Segmentos carregados:', segments.length);
        
        if (segments && segments.length > 0) {
          return segments.filter(segment => segment.status === 'ativo');
        }
        
        // Se não há segmentos ou falha, usar fallback aprimorado
        console.log('🔄 [useMarketplaceSegments] Usando fallback aprimorado');
        return ENHANCED_FALLBACK_SEGMENTS;
        
      } catch (error) {
        console.warn('⚠️ [useMarketplaceSegments] Erro, usando fallback:', error);
        return ENHANCED_FALLBACK_SEGMENTS;
      }
    },
    initialData: ENHANCED_FALLBACK_SEGMENTS, // Dados imediatos para evitar loading
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 15 * 60 * 1000, // 15 minutos
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: (failureCount, error) => {
      if (failureCount >= 2) return false;
      return true;
    },
  });
};