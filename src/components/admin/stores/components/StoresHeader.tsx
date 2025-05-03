
import React from 'react';
import StoreFilters from './StoreFilters';
import StoreSearchBar from './StoreSearchBar';
import { AdminStore } from '@/types/admin';

interface StoresHeaderProps {
  stores: AdminStore[];
  filter: string;
  setFilter: (filter: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

const StoresHeader: React.FC<StoresHeaderProps> = ({ 
  stores, 
  filter, 
  setFilter, 
  searchTerm, 
  setSearchTerm 
}) => {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Gerenciar Lojas</h1>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            {stores.length} {stores.length === 1 ? 'loja' : 'lojas'} encontradas
          </span>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <StoreFilters 
          filter={filter} 
          setFilter={setFilter} 
          stores={stores}
        />
        
        <StoreSearchBar 
          searchTerm={searchTerm} 
          setSearchTerm={setSearchTerm}
        />
      </div>
    </>
  );
};

export default StoresHeader;
