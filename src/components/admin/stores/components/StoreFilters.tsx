
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface StoreFiltersProps {
  filter: string;
  setFilter: (filter: string) => void;
  stores: any[];
}

const StoreFilters: React.FC<StoreFiltersProps> = ({ filter, setFilter, stores }) => {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant={filter === 'all' ? 'default' : 'outline'}
        onClick={() => setFilter('all')}
        className="min-w-24"
      >
        Todas
        {filter === 'all' && (
          <Badge variant="secondary" className="ml-2 bg-white/20">
            {stores.length}
          </Badge>
        )}
      </Button>
      <Button
        variant={filter === 'pendente' ? 'default' : 'outline'}
        onClick={() => setFilter('pendente')}
        className="min-w-24"
      >
        Pendentes
        {filter === 'pendente' && (
          <Badge variant="secondary" className="ml-2 bg-white/20">
            {stores.filter(store => store.status === 'pendente').length}
          </Badge>
        )}
      </Button>
      <Button
        variant={filter === 'aprovado' ? 'default' : 'outline'}
        onClick={() => setFilter('aprovado')}
        className="min-w-24"
      >
        Ativas
        {filter === 'aprovado' && (
          <Badge variant="secondary" className="ml-2 bg-white/20">
            {stores.filter(store => store.status === 'aprovado' || store.status === 'ativa').length}
          </Badge>
        )}
      </Button>
      <Button
        variant={filter === 'inativo' ? 'default' : 'outline'}
        onClick={() => setFilter('inativo')}
        className="min-w-24"
      >
        Inativas
        {filter === 'inativo' && (
          <Badge variant="secondary" className="ml-2 bg-white/20">
            {stores.filter(store => store.status === 'inativo').length}
          </Badge>
        )}
      </Button>
    </div>
  );
};

export default StoreFilters;
