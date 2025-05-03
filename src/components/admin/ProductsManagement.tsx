
import React from 'react';
import AdminLayout from './AdminLayout';
import { useAdminProducts } from '@/hooks/useAdminProducts';
import { useTitle } from '@/hooks/use-title';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Search, Check, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import LoadingState from '@/components/common/LoadingState';

const ProductsManagementScreen: React.FC = () => {
  useTitle('ConstruPro Admin - Produtos');
  
  const {
    products,
    loading,
    filter,
    setFilter,
    searchTerm,
    setSearchTerm,
    handleApproveProduct,
    handleRejectProduct
  } = useAdminProducts();

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'aprovado': return 'bg-green-100 text-green-800';
      case 'pendente': return 'bg-yellow-100 text-yellow-800';
      case 'inativo': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <AdminLayout currentSection="produtos">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Gerenciar Produtos</h1>
        
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
            >
              Todos
            </Button>
            <Button
              variant={filter === 'pendente' ? 'default' : 'outline'}
              onClick={() => setFilter('pendente')}
            >
              Pendentes
            </Button>
            <Button
              variant={filter === 'aprovado' ? 'default' : 'outline'}
              onClick={() => setFilter('aprovado')}
            >
              Aprovados
            </Button>
            <Button
              variant={filter === 'inativo' ? 'default' : 'outline'}
              onClick={() => setFilter('inativo')}
            >
              Inativos
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
        
        <Card>
          {loading ? (
            <div className="p-6">
              <LoadingState text="Carregando produtos..." />
            </div>
          ) : products.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-gray-500">Nenhum produto encontrado.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Vendedor</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Pontos</TableHead>
                  <TableHead>Estoque</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        {product.imagemUrl && (
                          <img 
                            src={product.imagemUrl} 
                            alt={product.nome}
                            className="w-10 h-10 object-cover rounded"
                          />
                        )}
                        <div>
                          <div className="font-medium">{product.nome}</div>
                          <div className="text-xs text-gray-500">{product.categoria}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{product.lojaNome}</TableCell>
                    <TableCell>R$ {product.preco.toFixed(2)}</TableCell>
                    <TableCell>{product.pontos}</TableCell>
                    <TableCell>{product.estoque}</TableCell>
                    <TableCell>
                      <Badge className={getStatusBadgeClass(product.status)}>
                        {product.status === 'pendente' ? 'Pendente' : 
                         product.status === 'aprovado' ? 'Aprovado' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      {product.status === 'pendente' && (
                        <>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-8 w-8 p-0 text-green-600"
                            onClick={() => handleApproveProduct(product.id)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-8 w-8 p-0 text-red-600"
                            onClick={() => handleRejectProduct(product.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {product.status === 'aprovado' && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-8 w-8 p-0 text-red-600"
                          onClick={() => handleRejectProduct(product.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                      {product.status === 'inativo' && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-8 w-8 p-0 text-green-600"
                          onClick={() => handleApproveProduct(product.id)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
};

export default ProductsManagementScreen;
