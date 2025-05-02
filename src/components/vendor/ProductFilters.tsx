
import React from 'react';
import CustomInput from '../common/CustomInput';
import CustomButton from '../common/CustomButton';

interface ProductFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filterStatus: string | null;
  setFilterStatus: (status: string | null) => void;
}

const ProductFilters: React.FC<ProductFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  filterStatus,
  setFilterStatus,
}) => {
  return (
    <div className="space-y-4">
      <CustomInput
        isSearch
        placeholder="Buscar produtos"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      
      <div className="flex gap-2 overflow-x-auto pb-2">
        <CustomButton
          variant={filterStatus === null ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setFilterStatus(null)}
        >
          Todos
        </CustomButton>
        <CustomButton
          variant={filterStatus === 'ativo' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setFilterStatus('ativo')}
        >
          Ativos
        </CustomButton>
        <CustomButton
          variant={filterStatus === 'inativo' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setFilterStatus('inativo')}
        >
          Inativos
        </CustomButton>
        <CustomButton
          variant={filterStatus === 'pendente' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setFilterStatus('pendente')}
        >
          Pendentes
        </CustomButton>
      </div>
    </div>
  );
};

export default ProductFilters;
