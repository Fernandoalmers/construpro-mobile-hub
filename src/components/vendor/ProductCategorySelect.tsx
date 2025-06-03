
import React, { useEffect, useState } from 'react';
import { fetchCategoriesForDropdown } from '@/services/admin/categories';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Category {
  id: string;
  nome: string;
  segmento_id: string;
}

interface ProductCategorySelectProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  segmentId?: string; // Filter categories by segment
}

const ProductCategorySelect: React.FC<ProductCategorySelectProps> = ({ 
  value, 
  onChange,
  error,
  required = false,
  segmentId
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  console.log('[ProductCategorySelect] Component rendered with segmentId:', segmentId);
  console.log('[ProductCategorySelect] Current value:', value);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true);
        console.log('[ProductCategorySelect] Loading categories...');
        
        const data = await fetchCategoriesForDropdown();
        console.log('[ProductCategorySelect] All categories loaded:', data);
        
        setCategories(data);
      } catch (err) {
        console.error('[ProductCategorySelect] Error loading categories:', err);
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  // Filter categories when segmentId changes
  useEffect(() => {
    console.log('[ProductCategorySelect] Filtering categories for segmentId:', segmentId);
    
    if (!segmentId || segmentId.trim() === '') {
      console.log('[ProductCategorySelect] No segmentId provided, showing all categories');
      setFilteredCategories(categories);
      return;
    }

    const filtered = categories.filter(cat => {
      const matches = cat.segmento_id === segmentId;
      console.log('[ProductCategorySelect] Category', cat.nome, 'segmento_id:', cat.segmento_id, 'matches:', matches);
      return matches;
    });
    
    console.log('[ProductCategorySelect] Filtered categories:', filtered);
    setFilteredCategories(filtered);

    // Clear selection if current category is not in filtered list
    if (value && value.trim() !== '') {
      const isValidCategory = filtered.some(cat => cat.nome === value);
      console.log('[ProductCategorySelect] Current value', value, 'is valid:', isValidCategory);
      
      if (!isValidCategory) {
        console.log('[ProductCategorySelect] Clearing invalid category selection');
        onChange('');
      }
    }
  }, [segmentId, categories, value, onChange]);
  
  return (
    <div>
      <Select
        onValueChange={onChange}
        value={value || ''}
        disabled={loading}
      >
        <SelectTrigger className={error ? 'border-red-500' : ''}>
          <SelectValue placeholder={
            loading 
              ? "Carregando categorias..." 
              : segmentId 
                ? "Selecione uma categoria" 
                : "Primeiro selecione um segmento"
          } />
        </SelectTrigger>
        <SelectContent>
          {filteredCategories.length === 0 && !loading && segmentId && (
            <div className="p-2 text-sm text-gray-500">
              Nenhuma categoria encontrada para este segmento
            </div>
          )}
          {filteredCategories.map((category) => (
            <SelectItem key={category.id} value={category.nome}>
              {category.nome}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
      {!segmentId && !loading && (
        <p className="text-sm text-gray-500 mt-1">
          Selecione um segmento para ver as categorias disponíveis
        </p>
      )}
    </div>
  );
};

export default ProductCategorySelect;
