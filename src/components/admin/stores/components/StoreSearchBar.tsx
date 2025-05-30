
import React from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface StoreSearchBarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

const StoreSearchBar: React.FC<StoreSearchBarProps> = ({ searchTerm, setSearchTerm }) => {
  return (
    <div className="relative">
      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Buscar lojas..."
        className="pl-8 w-full md:w-[250px]"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
    </div>
  );
};

export default StoreSearchBar;
