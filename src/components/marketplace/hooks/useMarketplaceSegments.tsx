
import { useState, useEffect } from 'react';
import { getProductSegments } from '@/services/admin/productSegmentsService';

export function useMarketplaceSegments() {
  const [segmentOptions, setSegmentOptions] = useState<any[]>([]);
  
  // Fetch segments for filter options
  useEffect(() => {
    const fetchSegments = async () => {
      try {
        const segmentsData = await getProductSegments();
        console.log('[useMarketplaceSegments] Fetched segments:', segmentsData);
        const options = segmentsData.map(segment => ({
          id: segment.id,
          label: segment.nome
        }));
        setSegmentOptions(options);
      } catch (error) {
        console.error('[useMarketplaceSegments] Error fetching segments:', error);
      }
    };
    
    fetchSegments();
  }, []);
  
  return { segmentOptions };
}
