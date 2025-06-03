
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await fetchCategoriesForDropdown();
        
        // Filter by segment if segmentId is provided
        const filteredData = segmentId 
          ? data.filter(cat => cat.segmento_id === segmentId)
          : data;
        
        setCategories(filteredData);
        
        // Clear selection if current category is not in filtered list
        if (segmentId && value) {
          const isValidCategory = filteredData.some(cat => cat.nome === value);
          if (!isValidCategory) {
            onChange('');
          }
        }
      } catch (err) {
        console.error('Error loading categories:', err);
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, [segmentId, value, onChange]);
  
  return (
    <div>
      <Select
        onValueChange={onChange}
        value={value || ''}
        disabled={loading}
      >
        <SelectTrigger className={error ? 'border-red-500' : ''}>
          <SelectValue placeholder={loading ? "Carregando categorias..." : "Selecione uma categoria"} />
        </SelectTrigger>
        <SelectContent>
          {categories.map((category) => (
            <SelectItem key={category.id} value={category.nome}>
              {category.nome}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
    </div>
  );
};

export default ProductCategorySelect;
