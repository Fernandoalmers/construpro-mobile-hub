
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomInput from '../common/CustomInput';
import FilterChips from '../common/FilterChips';
import Card from '../common/Card';
import ListEmptyState from '../common/ListEmptyState';
import { Search, ShoppingBag } from 'lucide-react';
import produtos from '../../data/produtos.json';
import lojas from '../../data/lojas.json';
import ProdutoCard from './ProdutoCard';

interface FilterOption {
  id: string;
  label: string;
}

const MarketplaceScreen: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedLojas, setSelectedLojas] = useState<string[]>([]);

  // Extract unique categories from products
  const allCategories = Array.from(new Set(produtos.map(produto => produto.categoria)))
    .map(category => ({
      id: category,
      label: category
    }));

  // Prepare lojas for filter
  const lojasOptions: FilterOption[] = lojas.map(loja => ({
    id: loja.id,
    label: loja.nome
  }));

  // Filter products based on search term and filters
  const filteredProdutos = produtos.filter(produto => {
    // Search term filter
    const matchesSearch = searchTerm === '' || 
      produto.nome.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Category filter
    const matchesCategory = selectedCategories.length === 0 || 
      selectedCategories.includes(produto.categoria);
    
    // Loja filter
    const matchesLoja = selectedLojas.length === 0 || 
      selectedLojas.includes(produto.lojaId);
    
    return matchesSearch && matchesCategory && matchesLoja;
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 pb-20">
      {/* Header */}
      <div className="bg-construPro-blue p-6 pt-12">
        <h1 className="text-2xl font-bold text-white mb-4">Marketplace</h1>
        
        <CustomInput
          isSearch
          placeholder="Buscar produtos"
          value={searchTerm}
          onChange={handleSearchChange}
          className="mb-4"
        />

        <div className="space-y-4">
          <div>
            <p className="text-white text-sm mb-2">Filtrar por categoria</p>
            <div className="overflow-x-auto">
              <div className="inline-flex pb-2">
                <FilterChips
                  items={allCategories}
                  selectedIds={selectedCategories}
                  onChange={setSelectedCategories}
                  allowMultiple
                />
              </div>
            </div>
          </div>
          
          <div>
            <p className="text-white text-sm mb-2">Filtrar por loja</p>
            <div className="overflow-x-auto">
              <div className="inline-flex pb-2">
                <FilterChips
                  items={lojasOptions}
                  selectedIds={selectedLojas}
                  onChange={setSelectedLojas}
                  allowMultiple
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Product List */}
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-lg text-gray-800">
            {filteredProdutos.length} produtos encontrados
          </h2>
        </div>

        {filteredProdutos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredProdutos.map(produto => {
              const loja = lojas.find(l => l.id === produto.lojaId);
              return (
                <ProdutoCard
                  key={produto.id}
                  produto={produto}
                  loja={loja}
                  onClick={() => navigate(`/produto/${produto.id}`)}
                />
              );
            })}
          </div>
        ) : (
          <ListEmptyState
            title="Nenhum produto encontrado"
            description="Tente mudar os filtros ou buscar por outro termo."
            icon={<ShoppingBag size={40} />}
            action={{
              label: "Limpar filtros",
              onClick: () => {
                setSearchTerm('');
                setSelectedCategories([]);
                setSelectedLojas([]);
              }
            }}
          />
        )}
      </div>
    </div>
  );
};

export default MarketplaceScreen;
