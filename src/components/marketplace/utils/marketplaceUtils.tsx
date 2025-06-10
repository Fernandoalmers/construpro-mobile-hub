
export const getCurrentDisplayName = (
  selectedSegmentId: string | null,
  segmentOptions: any[],
  selectedCategories: string[],
  categories: any[]
) => {
  if (selectedSegmentId && Array.isArray(segmentOptions)) {
    const segmentName = segmentOptions.find(s => s?.id === selectedSegmentId)?.label;
    if (segmentName) return segmentName;
  }
  
  if (Array.isArray(selectedCategories) && selectedCategories.length === 1 && Array.isArray(categories)) {
    const categoryName = categories.find(cat => cat?.id === selectedCategories[0])?.label;
    if (categoryName) return categoryName;
  }
  
  return "Todos os Produtos";
};

export const logDebugInfo = (safeProducts: any[], isLoading: boolean) => {
  console.log('[MarketplaceScreen] Products loaded for ALL users:', safeProducts.length);
  
  if (safeProducts.length === 0 && !isLoading) {
    console.warn('[MarketplaceScreen] NO PRODUCTS FOUND! This could indicate:');
    console.warn('1. No approved products in database');
    console.warn('2. Segment filter is too restrictive');
    console.warn('3. Database connection issue');
    console.warn('4. RLS policy blocking access');
  }
};
