
import React from 'react';
import AdminLayout from './AdminLayout';
import { useAdminProducts } from '@/hooks/useAdminProducts';
import { useTitle } from '@/hooks/use-title';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Search, Check, X, Eye, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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

  // Debug function to help troubleshoot data issues
  const debugData = async () => {
    const { debugFetchProducts } = await import('@/services/adminProductsService');
    debugFetchProducts();
  };

  useEffect(() => {
    // Log the number of products loaded
    console.log(`ProductsManagement rendered with ${products.length} products`);
    console.log('Products data:', products);
  }, [products]);

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'aprovado': return 'bg-green-100 text-green-800';
      case 'pendente': return 'bg-yellow-100 text-yellow-800';
      case 'inativo': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <AdminLayout currentSection="produtos">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold">Gerenciar Produtos</h1>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              {products.length} {products.length === 1 ? 'produto' : 'produtos'} encontrados
            </span>
            <Button variant="ghost" size="sm" onClick={debugData} title="Debug data">
              🐞
            </Button>
          </div>
        </div>
        
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
        
        <Card>
          {loading ? (
            <div className="p-6">
              <LoadingState text="Carregando produtos..." />
            </div>
          ) : products.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-gray-500">Nenhum produto encontrado.</p>
              <p className="text-sm text-gray-400 mt-1">
                {filter !== 'all' ? 'Tente selecionar outro filtro acima.' : 'Verifique as configurações de conexão com o banco de dados.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
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
                          {product.imagemUrl ? (
                            <img 
                              src={product.imagemUrl} 
                              alt={product.nome}
                              className="w-10 h-10 object-cover rounded"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                                (e.target as HTMLImageElement).nextElementSibling!.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div 
                            className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center text-gray-400"
                            style={{ display: product.imagemUrl ? 'none' : 'flex' }}
                          >
                            <span className="text-xs">Imagem</span>
                          </div>
                          <div>
                            <div className="font-medium">{product.nome}</div>
                            <div className="text-xs text-gray-500">{product.categoria}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{product.lojaNome || 'N/A'}</TableCell>
                      <TableCell>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <div className="font-medium">{formatCurrency(product.preco)}</div>
                              {product.preco_promocional && (
                                <div className="text-xs line-through text-gray-500">
                                  {formatCurrency(product.preco_promocional)}
                                </div>
                              )}
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Preço regular: {formatCurrency(product.preco)}</p>
                              {product.preco_promocional && (
                                <p>Preço promocional: {formatCurrency(product.preco_promocional)}</p>
                              )}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{product.pontos}</span>
                          {product.pontos_profissional && product.pontos_profissional !== product.pontos && (
                            <span className="text-xs text-gray-500">Prof: {product.pontos_profissional}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{product.estoque}</TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeClass(product.status)}>
                          {product.status === 'pendente' ? 'Pendente' : 
                           product.status === 'aprovado' ? 'Aprovado' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-8 w-8 p-0 text-blue-600"
                          title="Ver detalhes"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        {product.status === 'pendente' && (
                          <>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-8 w-8 p-0 text-green-600"
                              onClick={() => handleApproveProduct(product.id)}
                              title="Aprovar produto"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-8 w-8 p-0 text-red-600"
                              onClick={() => handleRejectProduct(product.id)}
                              title="Rejeitar produto"
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
                            title="Desativar produto"
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
                            title="Reativar produto"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
};

export default ProductsManagementScreen;
