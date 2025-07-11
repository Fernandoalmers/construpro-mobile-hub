
import { useState, useEffect, useMemo, useCallback, useReducer } from 'react';

interface FilterState {
  searchTerm: string;
  selectedCategories: string[];
  selectedLojas: string[];
  selectedRatings: string[];
  selectedPriceRanges: string[];
  selectedSegments: string[];
  page: number;
}

type FilterAction = 
  | { type: 'SET_SEARCH'; payload: string }
  | { type: 'TOGGLE_CATEGORY'; payload: string }
  | { type: 'TOGGLE_LOJA'; payload: string }
  | { type: 'TOGGLE_RATING'; payload: string }
  | { type: 'TOGGLE_PRICE_RANGE'; payload: string }
  | { type: 'TOGGLE_SEGMENT'; payload: string }
  | { type: 'SET_PAGE'; payload: number }
  | { type: 'CLEAR_FILTERS' }
  | { type: 'SET_LOJAS'; payload: string[] };

const initialState: FilterState = {
  searchTerm: '',
  selectedCategories: [],
  selectedLojas: [],
  selectedRatings: [],
  selectedPriceRanges: [],
  selectedSegments: [],
  page: 1
};

function filterReducer(state: FilterState, action: FilterAction): FilterState {
  switch (action.type) {
    case 'SET_SEARCH':
      return { ...state, searchTerm: action.payload, page: 1 };
    case 'TOGGLE_CATEGORY':
      const categories = state.selectedCategories.includes(action.payload)
        ? state.selectedCategories.filter(id => id !== action.payload)
        : [...state.selectedCategories, action.payload];
      return { ...state, selectedCategories: categories, page: 1 };
    case 'TOGGLE_LOJA':
      const lojas = state.selectedLojas.includes(action.payload)
        ? state.selectedLojas.filter(id => id !== action.payload)
        : [...state.selectedLojas, action.payload];
      return { ...state, selectedLojas: lojas, page: 1 };
    case 'TOGGLE_RATING':
      const ratings = state.selectedRatings.includes(action.payload)
        ? state.selectedRatings.filter(id => id !== action.payload)
        : [...state.selectedRatings, action.payload];
      return { ...state, selectedRatings: ratings, page: 1 };
    case 'TOGGLE_PRICE_RANGE':
      const priceRanges = state.selectedPriceRanges.includes(action.payload)
        ? state.selectedPriceRanges.filter(id => id !== action.payload)
        : [...state.selectedPriceRanges, action.payload];
      return { ...state, selectedPriceRanges: priceRanges, page: 1 };
    case 'TOGGLE_SEGMENT':
      const segments = state.selectedSegments.includes(action.payload)
        ? state.selectedSegments.filter(id => id !== action.payload)
        : [...state.selectedSegments, action.payload];
      return { ...state, selectedSegments: segments, page: 1 };
    case 'SET_PAGE':
      return { ...state, page: action.payload };
    case 'SET_LOJAS':
      return { ...state, selectedLojas: action.payload || [], page: 1 };
    case 'CLEAR_FILTERS':
      return { ...initialState };
    default:
      return state;
  }
}

// CORRIGIDO: Aumentar significativamente o limite para garantir que todos os produtos sejam exibidos
const PRODUCTS_PER_PAGE = 100000;

export const useOptimizedProductFilter = (products: any[] = []) => {
  const [state, dispatch] = useReducer(filterReducer, initialState);
  const [displayedProducts, setDisplayedProducts] = useState<any[]>([]);

  // Ensure products is always an array with safety check
  const safeProducts = useMemo(() => {
    console.log('[useOptimizedProductFilter] Input products:', products);
    return Array.isArray(products) ? products : [];
  }, [products]);

  // Price range checker
  const isPriceInRange = useCallback((preco: number, rangeId: string): boolean => {
    switch (rangeId) {
      case 'preco-1': return preco <= 50;
      case 'preco-2': return preco > 50 && preco <= 100;
      case 'preco-3': return preco > 100 && preco <= 200;
      case 'preco-4': return preco > 200 && preco <= 500;
      case 'preco-5': return preco > 500;
      default: return false;
    }
  }, []);

  // FIXED: Memoized filtered products with search ONLY in name and description
  const filteredProducts = useMemo(() => {
    console.log('[useOptimizedProductFilter] Starting filter with products:', safeProducts?.length || 0);
    
    if (!safeProducts || safeProducts.length === 0) {
      console.log('[useOptimizedProductFilter] No products to filter');
      return [];
    }

    let filtered = [...safeProducts];

    // FIXED: Search filter - ONLY search in product name and description, NOT in categories
    if (state.searchTerm?.trim()) {
      const searchLower = state.searchTerm.toLowerCase();
      console.log('[useOptimizedProductFilter] 🔍 Searching for:', searchLower);
      
      filtered = filtered.filter(produto => {
        const nameMatch = produto?.nome?.toLowerCase().includes(searchLower);
        const descriptionMatch = produto?.descricao?.toLowerCase().includes(searchLower);
        
        console.log('[useOptimizedProductFilter] Product:', produto.nome, 'Category:', produto.categoria, 'Name match:', nameMatch, 'Description match:', descriptionMatch);
        
        // ONLY search in name and description, NOT in categories
        return nameMatch || descriptionMatch;
      });
      
      console.log('[useOptimizedProductFilter] ✅ After search filter:', filtered.length, 'products found');
    }

    // Category filter
    if (state.selectedCategories?.length > 0) {
      filtered = filtered.filter(produto => 
        produto?.categoria && state.selectedCategories.includes(produto.categoria)
      );
    }

    // Store filter
    if (state.selectedLojas?.length > 0) {
      filtered = filtered.filter(produto => {
        const storeId = produto?.loja_id || produto?.vendedor_id || 
                       produto?.stores?.id || produto?.vendedores?.id;
        return storeId && state.selectedLojas.includes(storeId);
      });
    }

    // Price range filter
    if (state.selectedPriceRanges?.length > 0) {
      filtered = filtered.filter(produto => {
        const preco = produto?.preco_normal || produto?.preco || 0;
        return state.selectedPriceRanges.some(rangeId => isPriceInRange(preco, rangeId));
      });
    }

    // Rating filter
    if (state.selectedRatings?.length > 0) {
      filtered = filtered.filter(produto => {
        const rating = parseFloat(produto?.avaliacao || '0');
        return state.selectedRatings.some(r => {
          const minRating = parseFloat(r);
          return !isNaN(minRating) && rating >= minRating;
        });
      });
    }

    // Segment filter
    if (state.selectedSegments?.length > 0) {
      filtered = filtered.filter(produto => 
        produto?.segmento_id && state.selectedSegments.includes(produto.segmento_id)
      );
    }

    console.log('[useOptimizedProductFilter] Final filtered products:', filtered?.length || 0);
    return filtered || [];
  }, [safeProducts, state, isPriceInRange]);

  // loadMore callback moved OUTSIDE of useMemo to avoid hooks-in-hooks error
  const loadMore = useCallback(() => {
    const currentDisplayed = Array.isArray(displayedProducts) ? displayedProducts.length : 0;
    const totalFiltered = Array.isArray(filteredProducts) ? filteredProducts.length : 0;
    
    console.log('[useOptimizedProductFilter] 📈 LoadMore called:', {
      currentDisplayed,
      totalFiltered,
      hasMore: currentDisplayed < totalFiltered,
      nextPage: state.page + 1
    });
    
    if (currentDisplayed < totalFiltered) {
      dispatch({ type: 'SET_PAGE', payload: state.page + 1 });
    }
  }, [displayedProducts, filteredProducts, state.page]);

  // CORRIGIDO: Update displayed products to show more products initially and load incrementally
  useEffect(() => {
    if (!Array.isArray(filteredProducts)) {
      console.warn('[useOptimizedProductFilter] filteredProducts is not an array:', filteredProducts);
      setDisplayedProducts([]);
      return;
    }

    const startIndex = 0;
    const endIndex = state.page * PRODUCTS_PER_PAGE;
    const newDisplayedProducts = filteredProducts.slice(startIndex, endIndex);
    
    console.log('[useOptimizedProductFilter] 📊 Setting displayed products:', {
      filteredTotal: filteredProducts.length,
      currentPage: state.page,
      endIndex,
      displayedCount: newDisplayedProducts.length,
      hasMore: newDisplayedProducts.length < filteredProducts.length
    });
    
    setDisplayedProducts(newDisplayedProducts || []);
  }, [filteredProducts, state.page]);

  // Action creators with safety checks
  const actions = useMemo(() => ({
    setSearchTerm: (term: string) => {
      console.log('[useOptimizedProductFilter] 🔍 Setting search term:', term);
      dispatch({ type: 'SET_SEARCH', payload: term || '' });
    },
    toggleCategory: (categoryId: string) => {
      if (categoryId) dispatch({ type: 'TOGGLE_CATEGORY', payload: categoryId });
    },
    toggleLoja: (lojaId: string) => {
      if (lojaId) dispatch({ type: 'TOGGLE_LOJA', payload: lojaId });
    },
    toggleRating: (ratingId: string) => {
      if (ratingId) dispatch({ type: 'TOGGLE_RATING', payload: ratingId });
    },
    togglePriceRange: (rangeId: string) => {
      if (rangeId) dispatch({ type: 'TOGGLE_PRICE_RANGE', payload: rangeId });
    },
    toggleSegment: (segmentId: string) => {
      if (segmentId) dispatch({ type: 'TOGGLE_SEGMENT', payload: segmentId });
    },
    setPage: (page: number) => dispatch({ type: 'SET_PAGE', payload: Math.max(1, page || 1) }),
    setLojas: (lojas: string[]) => dispatch({ type: 'SET_LOJAS', payload: Array.isArray(lojas) ? lojas : [] }),
    clearFilters: () => dispatch({ type: 'CLEAR_FILTERS' }),
    loadMore
  }), [loadMore]);

  const hasMore = (Array.isArray(displayedProducts) ? displayedProducts.length : 0) < (Array.isArray(filteredProducts) ? filteredProducts.length : 0);

  console.log('[useOptimizedProductFilter] 🎯 Final state:', {
    totalProducts: safeProducts.length,
    filteredProducts: filteredProducts.length,
    displayedProducts: displayedProducts.length,
    hasMore,
    currentPage: state.page
  });

  return {
    ...state,
    filteredProducts: Array.isArray(filteredProducts) ? filteredProducts : [],
    displayedProducts: Array.isArray(displayedProducts) ? displayedProducts : [],
    hasMore,
    isLoadingMore: false,
    actions
  };
};
