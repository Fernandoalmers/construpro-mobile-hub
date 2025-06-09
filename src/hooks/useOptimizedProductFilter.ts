
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
      return { ...state, selectedLojas: action.payload, page: 1 };
    case 'CLEAR_FILTERS':
      return { ...initialState };
    default:
      return state;
  }
}

const PRODUCTS_PER_PAGE = 12;

export const useOptimizedProductFilter = (products: any[] = []) => {
  const [state, dispatch] = useReducer(filterReducer, initialState);
  const [displayedProducts, setDisplayedProducts] = useState<any[]>([]);

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

  // Memoized filtered products with optimized filtering
  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Search filter
    if (state.searchTerm.trim()) {
      const searchLower = state.searchTerm.toLowerCase();
      filtered = filtered.filter(produto => 
        produto.nome?.toLowerCase().includes(searchLower) ||
        produto.categoria?.toLowerCase().includes(searchLower)
      );
    }

    // Category filter
    if (state.selectedCategories.length > 0) {
      filtered = filtered.filter(produto => 
        state.selectedCategories.includes(produto.categoria)
      );
    }

    // Store filter
    if (state.selectedLojas.length > 0) {
      filtered = filtered.filter(produto => {
        const storeId = produto.loja_id || produto.vendedor_id || 
                       produto.stores?.id || (produto.vendedores && produto.vendedores.id);
        return state.selectedLojas.includes(storeId);
      });
    }

    // Price range filter
    if (state.selectedPriceRanges.length > 0) {
      filtered = filtered.filter(produto => {
        const preco = produto.preco_normal || produto.preco || 0;
        return state.selectedPriceRanges.some(rangeId => isPriceInRange(preco, rangeId));
      });
    }

    // Rating filter
    if (state.selectedRatings.length > 0) {
      filtered = filtered.filter(produto => {
        const rating = parseFloat(produto.avaliacao);
        return state.selectedRatings.some(r => {
          const minRating = parseFloat(r);
          return !isNaN(minRating) && rating >= minRating;
        });
      });
    }

    // Segment filter
    if (state.selectedSegments.length > 0) {
      filtered = filtered.filter(produto => 
        state.selectedSegments.includes(produto.segmento_id)
      );
    }

    return filtered;
  }, [products, state, isPriceInRange]);

  // Update displayed products based on pagination
  useEffect(() => {
    const startIndex = 0;
    const endIndex = state.page * PRODUCTS_PER_PAGE;
    setDisplayedProducts(filteredProducts.slice(startIndex, endIndex));
  }, [filteredProducts, state.page]);

  // Action creators
  const actions = useMemo(() => ({
    setSearchTerm: (term: string) => dispatch({ type: 'SET_SEARCH', payload: term }),
    toggleCategory: (categoryId: string) => dispatch({ type: 'TOGGLE_CATEGORY', payload: categoryId }),
    toggleLoja: (lojaId: string) => dispatch({ type: 'TOGGLE_LOJA', payload: lojaId }),
    toggleRating: (ratingId: string) => dispatch({ type: 'TOGGLE_RATING', payload: ratingId }),
    togglePriceRange: (rangeId: string) => dispatch({ type: 'TOGGLE_PRICE_RANGE', payload: rangeId }),
    toggleSegment: (segmentId: string) => dispatch({ type: 'TOGGLE_SEGMENT', payload: segmentId }),
    setPage: (page: number) => dispatch({ type: 'SET_PAGE', payload: page }),
    setLojas: (lojas: string[]) => dispatch({ type: 'SET_LOJAS', payload: lojas }),
    clearFilters: () => dispatch({ type: 'CLEAR_FILTERS' }),
    loadMore: useCallback(() => {
      if (displayedProducts.length < filteredProducts.length) {
        dispatch({ type: 'SET_PAGE', payload: state.page + 1 });
      }
    }, [displayedProducts.length, filteredProducts.length, state.page])
  }), [displayedProducts.length, filteredProducts.length, state.page]);

  return {
    ...state,
    filteredProducts,
    displayedProducts,
    hasMore: displayedProducts.length < filteredProducts.length,
    isLoadingMore: false,
    actions
  };
};
