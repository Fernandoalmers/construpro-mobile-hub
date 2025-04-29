
import React from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface FilterChipsProps {
  items: Array<{
    id: string;
    label: string;
  }>;
  selectedIds: string[];
  onChange: (selectedIds: string[]) => void;
  allowMultiple?: boolean;
  className?: string;
}

const FilterChips: React.FC<FilterChipsProps> = ({
  items,
  selectedIds,
  onChange,
  allowMultiple = true,
  className,
}) => {
  const handleToggle = (id: string) => {
    if (selectedIds.includes(id)) {
      // Remove from selection
      onChange(selectedIds.filter(selectedId => selectedId !== id));
    } else {
      // Add to selection
      if (allowMultiple) {
        onChange([...selectedIds, id]);
      } else {
        onChange([id]);
      }
    }
  };

  const clearAll = () => {
    onChange([]);
  };

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => handleToggle(item.id)}
          className={cn(
            "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
            selectedIds.includes(item.id)
              ? "bg-construPro-orange text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          )}
        >
          {item.label}
        </button>
      ))}
      
      {selectedIds.length > 0 && (
        <button
          onClick={clearAll}
          className="px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1 bg-gray-200 text-gray-700 hover:bg-gray-300"
        >
          Limpar <X size={14} />
        </button>
      )}
    </div>
  );
};

export default FilterChips;
