
import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface ProductFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  filterStatus: string | null;
  setFilterStatus: (status: string | null) => void;
}

const ProductFilters: React.FC<ProductFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  filterStatus,
  setFilterStatus
}) => {
  const statusOptions = [
    { value: null, label: 'Todos' },
    { value: 'pendente', label: 'Pendente' },
    { value: 'aprovado', label: 'Aprovado' },
    { value: 'inativo', label: 'Inativo' }
  ];

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        <Input
          placeholder="Buscar produtos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>
      
      {/* Status Filters */}
      <div className="flex space-x-2 overflow-x-auto pb-1">
        {statusOptions.map((option) => (
          <Button
            key={option.label}
            variant={filterStatus === option.value ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus(option.value)}
            className="whitespace-nowrap"
          >
            {option.label}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default ProductFilters;
