
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

interface RedemptionFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
}

const RedemptionFilters: React.FC<RedemptionFiltersProps> = React.memo(({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange
}) => {
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      <div className="flex w-full max-w-sm items-center space-x-2">
        <Input
          placeholder="Buscar resgates..."
          value={searchTerm}
          onChange={e => onSearchChange(e.target.value)}
          className="flex-1"
        />
        <Button type="button" size="icon" variant="ghost">
          <Search className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="flex space-x-2 overflow-x-auto pb-2">
        <Button
          variant={statusFilter === 'all' ? 'default' : 'outline'}
          onClick={() => onStatusFilterChange('all')}
          size="sm"
        >
          Todos
        </Button>
        <Button
          variant={statusFilter === 'pendente' ? 'default' : 'outline'}
          onClick={() => onStatusFilterChange('pendente')}
          size="sm"
        >
          Pendentes
        </Button>
        <Button
          variant={statusFilter === 'aprovado' ? 'default' : 'outline'}
          onClick={() => onStatusFilterChange('aprovado')}
          size="sm"
        >
          Aprovados
        </Button>
        <Button
          variant={statusFilter === 'entregue' ? 'default' : 'outline'}
          onClick={() => onStatusFilterChange('entregue')}
          size="sm"
        >
          Entregues
        </Button>
        <Button
          variant={statusFilter === 'recusado' ? 'default' : 'outline'}
          onClick={() => onStatusFilterChange('recusado')}
          size="sm"
        >
          Recusados
        </Button>
      </div>
    </div>
  );
});

RedemptionFilters.displayName = 'RedemptionFilters';

export default RedemptionFilters;
