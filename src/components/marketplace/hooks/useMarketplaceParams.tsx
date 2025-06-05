
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export function useMarketplaceParams() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Parse query parameters on component mount
  const searchParams = new URLSearchParams(location.search);
  const categoryParam = searchParams.get('categoria');
  const searchQuery = searchParams.get('search');
  const segmentIdParam = searchParams.get('segmento_id');
  
  // Only initialize categories from URL if we have a categoria param
  const initialCategories = categoryParam ? [categoryParam] : [];
  
  // State for segment selection
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(segmentIdParam);
  const [selectedSegments, setSelectedSegments] = useState<string[]>(
    segmentIdParam ? [segmentIdParam] : []
  );
  
  // Debug logging
  useEffect(() => {
    console.log('[useMarketplaceParams] URL parameters:', {
      categoria: categoryParam,
      segmento_id: segmentIdParam,
      search: searchQuery
    });
    
    if (segmentIdParam) {
      console.log(`[useMarketplaceParams] Initializing with segment_id: ${segmentIdParam}`);
    }
  }, [categoryParam, segmentIdParam, searchQuery]);
  
  // Update URL with segment ID
  const updateSegmentURL = (segmentId: string | null) => {
    const newSearchParams = new URLSearchParams(searchParams);
    
    if (categoryParam) {
      newSearchParams.delete('categoria');
    }
    
    if (segmentId) {
      newSearchParams.set('segmento_id', segmentId);
    } else {
      newSearchParams.delete('segmento_id');
    }
    
    navigate(`${location.pathname}?${newSearchParams.toString()}`, { replace: true });
  };
  
  return {
    searchParams,
    categoryParam,
    searchQuery,
    segmentIdParam,
    initialCategories,
    selectedSegmentId,
    setSelectedSegmentId,
    selectedSegments,
    setSelectedSegments,
    updateSegmentURL
  };
}
