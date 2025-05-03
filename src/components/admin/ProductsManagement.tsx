
import React, { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import { 
  Table, TableBody, TableCaption, TableCell, 
  TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Check, X, Search, 
  Filter, Edit, Trash2, Store 
} from 'lucide-react';
import { 
  Card, CardContent, CardDescription, 
  CardFooter, CardHeader, CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ProductStatusBadge from '../vendor/ProductStatusBadge';
import { toast } from '@/components/ui/sonner';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { 
  AdminProduct, 
  fetchAdminProducts, 
  approveProduct, 
  rejectProduct, 
  deleteProduct, 
  getCategories, 
  getVendors 
} from '@/services/adminProductsService';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';

const ProductsManagement: React.FC = () => {
  const { isAdmin, isLoading: isAdminLoading } = useIsAdmin();
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [storeFilter, setStoreFilter] = useState('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [stores, setStores] = useState<{id: string, nome: string}[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isAdminLoading) {
      return; // Wait for admin status check to complete
    }
    
    if (!isAdmin) {
      setError('Unauthorized: Admin access required');
      setIsLoading(false);
      return;
    }
    
    loadProducts();
  }, [isAdmin, isAdminLoading]);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch products
      const productsData = await fetchAdminProducts();
      setProducts(productsData);
      
      // Fetch categories
      const categoriesData = await getCategories();
      setCategories(categoriesData);
      
      // Fetch stores
      const storesData = await getVendors();
      setStores(storesData);
      
    } catch (error) {
      console.error('Error loading products data:', error);
      setError('Failed to load products. Please try again.');
      toast.error('Erro ao carregar produtos');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter products based on search and filters
  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      !searchTerm || 
      product.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.lojaNome?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || product.categoria === categoryFilter;
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
    const matchesStore = storeFilter === 'all' || product.lojaId === storeFilter;
    
    return matchesSearch && matchesCategory && matchesStatus && matchesStore;
  });

  const handleApproveProduct = async (productId: string) => {
    if (isProcessing) return;
    
    try {
      setIsProcessing(true);
      
      await approveProduct(productId);
      
      // Update local state
      setProducts(prevProducts =>
        prevProducts.map(product =>
          product.id === productId ? { ...product, status: 'aprovado' } : product
        )
      );
      
      toast.success('Produto aprovado com sucesso');
    } catch (error) {
      console.error('Error approving product:', error);
      toast.error('Erro ao aprovar produto');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectProduct = async (productId: string) => {
    if (isProcessing) return;
    
    try {
      setIsProcessing(true);
      
      await rejectProduct(productId);
      
      // Update local state
      setProducts(prevProducts =>
        prevProducts.map(product =>
          product.id === productId ? { ...product, status: 'inativo' } : product
        )
      );
      
      toast.success('Produto recusado');
    } catch (error) {
      console.error('Error rejecting product:', error);
      toast.error('Erro ao recusar produto');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (isProcessing) return;
    
    if (!window.confirm('Tem certeza que deseja excluir este produto?')) {
      return;
    }
    
    try {
      setIsProcessing(true);
      
      await deleteProduct(productId);
      
      // Update local state
      setProducts(prevProducts => 
        prevProducts.filter(product => product.id !== productId)
      );
      
      toast.success('Produto excluído com sucesso');
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Erro ao excluir produto');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  // If admin status is still loading
  if (isAdminLoading) {
    return (
      <AdminLayout currentSection="Produtos">
        <LoadingState text="Verificando permissões de administrador..." />
      </AdminLayout>
    );
  }
  
  // If user is not an admin
  if (!isAdmin) {
    return (
      <AdminLayout currentSection="Produtos">
        <ErrorState 
          title="Acesso Negado" 
          message="Você não tem permissões de administrador para acessar este painel."
          onRetry={() => window.location.href = '/profile'}
        />
      </AdminLayout>
    );
  }

  // If there's an error loading the products
  if (error) {
    return (
      <AdminLayout currentSection="Produtos">
        <ErrorState 
          title="Erro ao carregar produtos" 
          message={error}
          onRetry={loadProducts}
        />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout currentSection="Produtos">
      <Card>
        <CardHeader>
          <CardTitle>Gerenciamento de Produtos</CardTitle>
          <CardDescription>
            Visualize e gerencie todos os produtos da plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nome do produto ou loja"
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[160px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="aprovado">Aprovados</SelectItem>
                  <SelectItem value="pendente">Pendentes</SelectItem>
                  <SelectItem value="inativo">Inativos</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={storeFilter} onValueChange={setStoreFilter}>
                <SelectTrigger className="w-[160px]">
                  <Store className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Loja" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as lojas</SelectItem>
                  {stores.map(store => (
                    <SelectItem key={store.id} value={store.id}>{store.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {isLoading ? (
            <LoadingState text="Carregando produtos..." />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Imagem</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Loja</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead>Pontos</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center">
                        Nenhum produto encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          {product.imagemUrl ? (
                            <img 
                              src={product.imagemUrl} 
                              alt={product.nome}
                              className="h-12 w-12 rounded object-cover"
                            />
                          ) : (
                            <div className="h-12 w-12 bg-gray-200 rounded flex items-center justify-center">
                              <Store size={16} className="text-gray-400" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          {product.nome}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {product.categoria}
                          </Badge>
                        </TableCell>
                        <TableCell>{product.lojaNome}</TableCell>
                        <TableCell>{formatPrice(product.preco)}</TableCell>
                        <TableCell>{product.pontos}</TableCell>
                        <TableCell>
                          <ProductStatusBadge status={product.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => handleApproveProduct(product.id)}
                              disabled={isProcessing || product.status === 'aprovado'}
                            >
                              <Check size={16} className="text-green-600" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => handleRejectProduct(product.id)}
                              disabled={isProcessing || product.status === 'inativo'}
                            >
                              <X size={16} className="text-red-600" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => window.location.href = `/admin/product-edit/${product.id}`}
                            >
                              <Edit size={16} className="text-blue-600" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => handleDeleteProduct(product.id)}
                              disabled={isProcessing}
                            >
                              <Trash2 size={16} className="text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <p className="text-sm text-gray-500">
            Exibindo {filteredProducts.length} de {products.length} produtos
          </p>
          <Button 
            variant="outline" 
            onClick={loadProducts}
            disabled={isLoading || isProcessing}
          >
            Atualizar
          </Button>
        </CardFooter>
      </Card>
    </AdminLayout>
  );
};

export default ProductsManagement;
