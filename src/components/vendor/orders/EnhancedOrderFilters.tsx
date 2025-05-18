
import React from 'react';
import { Search, SortAsc, SortDesc, FilterX } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { OrderSortField, SortDirection } from '@/hooks/vendor/useOrderSort';

interface OrderStatus {
  value: string;
  label: string;
}

interface EnhancedOrderFiltersProps {
  searchTerm: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  filterStatus: string | null;
  setFilterStatus: (status: string | null) => void;
  orderStatuses: OrderStatus[];
  sortField: OrderSortField;
  sortDirection: SortDirection;
  onSortChange: (field: OrderSortField) => void;
  hasFilters: boolean;
  onClearFilters: () => void;
}

const EnhancedOrderFilters: React.FC<EnhancedOrderFiltersProps> = ({
  searchTerm,
  onSearchChange,
  filterStatus,
  setFilterStatus,
  orderStatuses,
  sortField,
  sortDirection,
  onSortChange,
  hasFilters,
  onClearFilters,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            type="text"
            placeholder="Buscar por nome do cliente ou ID do pedido"
            value={searchTerm}
            onChange={onSearchChange}
            className="pl-10 bg-white"
          />
        </div>

        {/* Status Filter */}
        <div className="w-full md:w-64">
          <Select
            value={filterStatus || ''}
            onValueChange={(value) => setFilterStatus(value === '' ? null : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos os status</SelectItem>
              {orderStatuses.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {hasFilters && (
          <Button 
            variant="outline" 
            onClick={onClearFilters}
            className="flex items-center gap-2"
          >
            <FilterX size={16} />
            Limpar filtros
          </Button>
        )}
      </div>
      
      {/* Sorting Options */}
      <div className="flex flex-wrap gap-2">
        <SortButton 
          label="Data"
          field="created_at"
          currentField={sortField}
          direction={sortDirection}
          onClick={() => onSortChange('created_at')}
        />
        <SortButton 
          label="Valor"
          field="valor_total"
          currentField={sortField}
          direction={sortDirection}
          onClick={() => onSortChange('valor_total')}
        />
        <SortButton 
          label="Status"
          field="status"
          currentField={sortField}
          direction={sortDirection}
          onClick={() => onSortChange('status')}
        />
      </div>
    </div>
  );
};

interface SortButtonProps {
  label: string;
  field: OrderSortField;
  currentField: OrderSortField;
  direction: SortDirection;
  onClick: () => void;
}

const SortButton: React.FC<SortButtonProps> = ({ label, field, currentField, direction, onClick }) => {
  const isActive = field === currentField;
  
  return (
    <Button 
      variant={isActive ? "secondary" : "outline"} 
      size="sm"
      onClick={onClick}
      className={`flex items-center gap-1 ${isActive ? 'bg-gray-200' : ''}`}
    >
      {label}
      {isActive && (
        direction === 'asc' ? 
          <SortAsc size={16} className="text-gray-600" /> : 
          <SortDesc size={16} className="text-gray-600" />
      )}
    </Button>
  );
};

export default EnhancedOrderFilters;
