
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

export interface RedemptionFiltersProps {
  statusFilter: string;
  onStatusChange: (status: string) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

const RedemptionFilters: React.FC<RedemptionFiltersProps> = ({ 
  statusFilter, 
  onStatusChange,
  searchTerm,
  onSearchChange
}) => {
  return (
    <div className="flex flex-wrap gap-4 items-center justify-between">
      <div className="flex flex-wrap gap-2">
        <Button
          variant={statusFilter === 'all' ? 'default' : 'outline'}
          onClick={() => onStatusChange('all')}
        >
          Todos
        </Button>
        <Button
          variant={statusFilter === 'pendente' ? 'default' : 'outline'}
          onClick={() => onStatusChange('pendente')}
        >
          Pendentes
        </Button>
        <Button
          variant={statusFilter === 'aprovado' ? 'default' : 'outline'}
          onClick={() => onStatusChange('aprovado')}
        >
          Aprovados
        </Button>
        <Button
          variant={statusFilter === 'recusado' ? 'default' : 'outline'}
          onClick={() => onStatusChange('recusado')}
        >
          Recusados
        </Button>
        <Button
          variant={statusFilter === 'entregue' ? 'default' : 'outline'}
          onClick={() => onStatusChange('entregue')}
        >
          Entregues
        </Button>
      </div>
      
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, item..."
          className="pl-8 w-[250px]"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
    </div>
  );
};

export default RedemptionFilters;
