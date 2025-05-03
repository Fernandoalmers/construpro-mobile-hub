
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';
import { AdminProduct } from '@/types/admin';

interface ProductFiltersProps {
  filter: string;
  setFilter: (filter: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  products: AdminProduct[];
}

const ProductFilters: React.FC<ProductFiltersProps> = ({
  filter,
  setFilter,
  searchTerm,
  setSearchTerm,
  products
}) => {
  return (
    <div className="flex flex-wrap gap-4 items-center justify-between">
      <div className="flex flex-wrap gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
          className="min-w-24"
        >
          Todos
          {filter === 'all' && (
            <Badge variant="secondary" className="ml-2 bg-white/20">
              {products.length}
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
              {products.filter(product => product.status === 'pendente').length}
            </Badge>
          )}
        </Button>
        <Button
          variant={filter === 'aprovado' ? 'default' : 'outline'}
          onClick={() => setFilter('aprovado')}
          className="min-w-24"
        >
          Aprovados
          {filter === 'aprovado' && (
            <Badge variant="secondary" className="ml-2 bg-white/20">
              {products.filter(product => product.status === 'aprovado').length}
            </Badge>
          )}
        </Button>
        <Button
          variant={filter === 'inativo' ? 'default' : 'outline'}
          onClick={() => setFilter('inativo')}
          className="min-w-24"
        >
          Inativos
          {filter === 'inativo' && (
            <Badge variant="secondary" className="ml-2 bg-white/20">
              {products.filter(product => product.status === 'inativo').length}
            </Badge>
          )}
        </Button>
      </div>
      
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar produtos..."
          className="pl-8 w-[250px]"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
    </div>
  );
};

export default ProductFilters;
