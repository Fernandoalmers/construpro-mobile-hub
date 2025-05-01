
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Plus, Edit2, Archive, Tag } from 'lucide-react';
import { Card } from '@/components/ui/card';
import CustomInput from '../common/CustomInput';
import CustomButton from '../common/CustomButton';
import ListEmptyState from '../common/ListEmptyState';
import produtos from '../../data/produtos.json';
import { toast } from '@/components/ui/use-toast';

const ProdutosVendorScreen: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  
  // Simulate logged-in vendor's store
  const currentLojaId = "1"; // Just for simulation purposes
  
  // Filter products for current store only
  const storeProdutos = produtos.filter(produto => produto.lojaId === currentLojaId);
  
  // Get unique categories
  const categories = Array.from(new Set(storeProdutos.map(produto => produto.categoria)));
  
  // Filter products based on search and category
  const filteredProducts = storeProdutos.filter(produto => {
    const matchesSearch = searchTerm === '' || 
      produto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      produto.descricao?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !filterCategory || produto.categoria === filterCategory;
    
    return matchesSearch && matchesCategory;
  });

  const handleNewProduct = () => {
    navigate('/vendor/produtos/novo');
  };
  
  const handleEditProduct = (productId: string) => {
    navigate(`/vendor/produtos/editar/${productId}`);
  };
  
  const handleArchiveProduct = (productId: string, productName: string) => {
    // In a real app, this would open a confirmation dialog and then archive the product
    toast({
      title: "Produto arquivado",
      description: `O produto "${productName}" foi arquivado com sucesso.`
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 pb-20">
      {/* Header */}
      <div className="bg-white p-4 flex items-center shadow-sm">
        <button onClick={() => navigate('/vendor')} className="mr-4">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold">Produtos</h1>
      </div>
      
      <div className="p-6 space-y-6">
        {/* Search and filters */}
        <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
          <CustomInput
            placeholder="Buscar por nome ou descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            isSearch
            className="w-full sm:w-2/3"
          />
          
          <div className="flex overflow-x-auto gap-2 pb-1">
            <button
              onClick={() => setFilterCategory(null)}
              className={`whitespace-nowrap px-3 py-1 text-sm rounded-full ${
                filterCategory === null 
                  ? 'bg-construPro-blue text-white' 
                  : 'bg-gray-200 text-gray-800'
              }`}
            >
              Todas
            </button>
            
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setFilterCategory(category === filterCategory ? null : category)}
                className={`whitespace-nowrap px-3 py-1 text-sm rounded-full ${
                  category === filterCategory 
                    ? 'bg-construPro-blue text-white' 
                    : 'bg-gray-200 text-gray-800'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
        
        {/* Add New Product Button */}
        <CustomButton
          variant="primary"
          icon={<Plus size={18} />}
          onClick={handleNewProduct}
        >
          Adicionar novo produto
        </CustomButton>
        
        {/* Product List */}
        <div className="space-y-4">
          <h2 className="font-bold text-lg">Lista de produtos</h2>
          
          {filteredProducts.length > 0 ? (
            <div className="space-y-3">
              {filteredProducts.map(produto => (
                <Card key={produto.id} className="p-4">
                  <div className="flex">
                    <div 
                      className="w-20 h-20 bg-gray-200 rounded-md mr-4 flex-shrink-0 bg-center bg-cover"
                      style={{ backgroundImage: `url(${produto.imagemUrl || ''})` }}
                    />
                    
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold">{produto.nome}</h3>
                          <p className="text-sm text-gray-600 line-clamp-1">{produto.descricao}</p>
                        </div>
                        
                        <div className="flex">
                          <button
                            onClick={() => handleEditProduct(produto.id)}
                            className="p-2 mr-2 text-blue-600 hover:bg-blue-50 rounded"
                            title="Editar produto"
                          >
                            <Edit2 size={18} />
                          </button>
                          
                          <button
                            onClick={() => handleArchiveProduct(produto.id, produto.nome)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded"
                            title="Arquivar produto"
                          >
                            <Archive size={18} />
                          </button>
                        </div>
                      </div>
                      
                      <div className="mt-3 flex flex-wrap gap-2 text-sm">
                        <div className="bg-gray-100 px-2 py-1 rounded">
                          <span className="font-medium">Preço:</span>{' '}
                          <span>R$ {produto.preco.toFixed(2)}</span>
                        </div>
                        
                        <div className="bg-gray-100 px-2 py-1 rounded">
                          <span className="font-medium">Estoque:</span>{' '}
                          <span>{produto.estoque || 0}</span>
                        </div>
                        
                        <div className="bg-gray-100 px-2 py-1 rounded">
                          <span className="font-medium">Categoria:</span>{' '}
                          <span>{produto.categoria}</span>
                        </div>
                        
                        <div className="bg-construPro-orange/10 text-construPro-orange px-2 py-1 rounded flex items-center">
                          <Tag size={14} className="mr-1" />
                          <span>Pontos: </span>
                          <span className="ml-1">{produto.pontos}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <ListEmptyState
              icon={<Search className="h-12 w-12 text-gray-400" />}
              title="Nenhum produto encontrado"
              description="Tente ajustar os filtros de busca ou adicione novos produtos"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ProdutosVendorScreen;
