
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingBag } from 'lucide-react';
import produtos from '../../data/produtos.json';
import { ProdutoVendor } from './ProductItem';
import ProductFilters from './ProductFilters';
import ProductList from './ProductList';
import ProductActions from './ProductActions';

const ProductManagementScreen: React.FC = () => {
  const navigate = useNavigate();
  
  // Convert produtos data to include status
  const [produtosVendor, setProdutosVendor] = useState<ProdutoVendor[]>(
    produtos.map(produto => ({
      ...produto,
      status: Math.random() > 0.3 ? 'ativo' : (Math.random() > 0.5 ? 'inativo' : 'pendente')
    }))
  );
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  
  // Filter products based on search and status
  const filteredProducts = produtosVendor.filter(produto => {
    const matchesSearch = searchTerm === '' || 
      produto.nome.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === null || produto.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const handleToggleStatus = (productId: string) => {
    setProdutosVendor(
      produtosVendor.map(produto => {
        if (produto.id === productId) {
          return {
            ...produto,
            status: produto.status === 'ativo' ? 'inativo' : 'ativo'
          };
        }
        return produto;
      })
    );
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterStatus(null);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 pb-20">
      {/* Header */}
      <div className="bg-construPro-blue p-6 pt-12 flex items-center">
        <button onClick={() => navigate('/vendor')} className="mr-4 text-white">
          <ArrowLeft size={24} />
        </button>
        <ShoppingBag className="text-white mr-2" size={24} />
        <h1 className="text-xl font-bold text-white">Gerenciar Produtos</h1>
      </div>
      
      {/* Content */}
      <div className="p-6 space-y-4">
        <ProductFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
        />
        
        <ProductActions />
        
        <ProductList
          products={filteredProducts}
          onToggleStatus={handleToggleStatus}
          onClearFilters={handleClearFilters}
        />
      </div>
    </div>
  );
};

export default ProductManagementScreen;
