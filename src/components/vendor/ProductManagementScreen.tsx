
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Plus, Filter, Tag, Box, ShoppingBag } from 'lucide-react';
import Card from '../common/Card';
import CustomInput from '../common/CustomInput';
import ListEmptyState from '../common/ListEmptyState';
import CustomButton from '../common/CustomButton';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import produtos from '../../data/produtos.json';

interface ProdutoVendor {
  id: string;
  nome: string;
  preco: number;
  estoque: number;
  imagemUrl: string;
  status: 'ativo' | 'inativo' | 'pendente';
}

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

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'ativo':
        return <Badge className="bg-green-100 text-green-800">Ativo</Badge>;
      case 'inativo':
        return <Badge className="bg-gray-100 text-gray-800">Inativo</Badge>;
      case 'pendente':
        return <Badge className="bg-amber-100 text-amber-800">Pendente aprovação</Badge>;
      default:
        return null;
    }
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
      
      {/* Filters */}
      <div className="p-6 space-y-4">
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
        
        <CustomButton
          variant="primary"
          icon={<Plus size={18} />}
          onClick={() => navigate('/vendor/product-form')}
          fullWidth
        >
          Adicionar novo produto
        </CustomButton>

        <CustomButton
          variant="outline"
          icon={<Box size={18} />}
          onClick={() => navigate('/vendor/product-clone')}
          fullWidth
        >
          Clonar produto existente
        </CustomButton>
        
        {/* Products List */}
        {filteredProducts.length === 0 ? (
          <ListEmptyState
            title="Nenhum produto encontrado"
            description="Tente mudar os filtros ou buscar por outro termo."
            icon={<ShoppingBag size={40} />}
            action={{
              label: "Limpar filtros",
              onClick: () => {
                setSearchTerm('');
                setFilterStatus(null);
              }
            }}
          />
        ) : (
          <div className="space-y-4 mt-4">
            {filteredProducts.map(produto => (
              <Card key={produto.id} className="p-4">
                <div className="flex gap-3">
                  <div className="w-16 h-16 bg-gray-200 rounded-md overflow-hidden">
                    <img 
                      src={produto.imagemUrl}
                      alt={produto.nome}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <h3 className="font-medium line-clamp-1">{produto.nome}</h3>
                      {produto.status !== 'pendente' && (
                        <Switch
                          checked={produto.status === 'ativo'}
                          onCheckedChange={() => handleToggleStatus(produto.id)}
                        />
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 mt-1">
                      {getStatusBadge(produto.status)}
                      <span className="text-sm text-gray-500">
                        <Tag size={12} className="inline mr-1" />
                        R$ {produto.preco.toFixed(2)}
                      </span>
                    </div>
                    
                    <div className="mt-2 flex justify-between items-center">
                      <span className="text-xs text-gray-500">
                        Estoque: {produto.estoque} unid.
                      </span>
                      <CustomButton
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/vendor/product-edit/${produto.id}`)}
                      >
                        Editar
                      </CustomButton>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductManagementScreen;
