
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Plus, Edit, Archive, Filter } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import CustomInput from '../common/CustomInput';
import CustomButton from '../common/CustomButton';
import produtos from '../../data/produtos.json';
import lojas from '../../data/lojas.json';

const ProdutosVendorScreen: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Simulate logged-in vendor's store
  const currentLojaId = "1"; // Just for simulation purposes
  const currentLoja = lojas.find(loja => loja.id === currentLojaId);
  
  const storeProducts = produtos.filter(produto => produto.lojaId === currentLojaId);
  
  // Get unique categories from products
  const categories = Array.from(new Set(storeProducts.map(produto => produto.categoria)));
  
  // Filter products based on search term and category
  const filteredProducts = storeProducts.filter(produto => {
    const matchesSearch = searchTerm === '' || 
      produto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      produto.descricao.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesCategory = selectedCategory === null || produto.categoria === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const handleAddProduct = () => {
    navigate('/vendor/produtos/novo');
  };
  
  const handleEditProduct = (productId: string) => {
    navigate(`/vendor/produtos/${productId}/editar`);
  };
  
  const handleArchiveProduct = (productId: string) => {
    // In a real app, this would update the product status in the database
    alert(`Produto ${productId} arquivado com sucesso!`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 pb-20">
      {/* Header */}
      <div className="bg-white p-4 flex items-center shadow-sm">
        <button onClick={() => navigate('/vendor')} className="mr-4">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold">Gerenciar Produtos</h1>
      </div>
      
      <div className="p-6 space-y-6">
        {/* Loja info */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold">{currentLoja?.nome}</h2>
            <p className="text-sm text-gray-500">{storeProducts.length} produtos cadastrados</p>
          </div>
          <CustomButton
            variant="primary"
            onClick={handleAddProduct}
            icon={<Plus size={18} />}
          >
            Adicionar produto
          </CustomButton>
        </div>
        
        {/* Search and filters */}
        <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
          <CustomInput
            placeholder="Buscar produtos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            isSearch
            className="w-full sm:w-2/3"
          />
          
          <div className="flex space-x-2 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-3 py-1 text-sm rounded-full whitespace-nowrap ${
                selectedCategory === null 
                  ? 'bg-construPro-blue text-white' 
                  : 'bg-gray-200 text-gray-800'
              }`}
            >
              Todas
            </button>
            
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1 text-sm rounded-full whitespace-nowrap ${
                  selectedCategory === category 
                    ? 'bg-construPro-blue text-white' 
                    : 'bg-gray-200 text-gray-800'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
        
        {/* Products table */}
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-right">Preço</TableHead>
                  <TableHead className="text-right">Estoque</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Pontos</TableHead>
                  <TableHead className="text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length > 0 ? (
                  filteredProducts.map(produto => (
                    <TableRow key={produto.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <img 
                            src={produto.imagemUrl} 
                            alt={produto.nome} 
                            className="w-10 h-10 object-cover rounded-md mr-3"
                          />
                          <div className="truncate max-w-[200px]">{produto.nome}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        R$ {produto.preco.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={produto.estoque < 5 ? 'text-red-500 font-medium' : ''}>
                          {produto.estoque}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
                          {produto.categoria}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {produto.pontos}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center space-x-2">
                          <button 
                            onClick={() => handleEditProduct(produto.id)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded-full"
                          >
                            <Edit size={18} />
                          </button>
                          <button 
                            onClick={() => handleArchiveProduct(produto.id)}
                            className="p-1 text-gray-600 hover:bg-gray-50 rounded-full"
                          >
                            <Archive size={18} />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      Nenhum produto encontrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ProdutosVendorScreen;
