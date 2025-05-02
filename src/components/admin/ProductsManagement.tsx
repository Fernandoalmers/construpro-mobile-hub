
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

interface ProductData {
  id: string;
  nome: string;
  imagemUrl: string;
  preco: number;
  pontos: number;
  categoria: string;
  lojaId: string;
  lojaNome?: string;
  status?: string;
}

const ProductsManagement: React.FC = () => {
  const [products, setProducts] = useState<ProductData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [storeFilter, setStoreFilter] = useState('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [stores, setStores] = useState<{id: string, nome: string}[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        
        // For demo purposes, we'll use mock data
        const productData = (await import('../../data/produtos.json')).default;
        const storeData = (await import('../../data/lojas.json')).default;
        
        // Add store name and random status to products
        const enhancedProducts = productData.map((product: any) => {
          const store = storeData.find(store => store.id === product.lojaId);
          return {
            ...product,
            lojaNome: store?.nome || 'Loja desconhecida',
            // Random status for demo
            status: ['ativo', 'pendente', 'inativo'][Math.floor(Math.random() * 3)]
          };
        });
        
        setProducts(enhancedProducts);
        
        // Extract categories
        const uniqueCategories = Array.from(
          new Set(enhancedProducts.map((product: ProductData) => product.categoria))
        );
        setCategories(uniqueCategories);
        
        // Extract stores
        setStores(storeData.map(store => ({
          id: store.id,
          nome: store.nome
        })));
        
      } catch (error) {
        console.error('Error fetching products:', error);
        toast.error('Erro ao carregar produtos');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProducts();
  }, []);

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
    try {
      setProducts(prevProducts =>
        prevProducts.map(product =>
          product.id === productId ? { ...product, status: 'ativo' } : product
        )
      );
      
      toast.success('Produto aprovado com sucesso');
    } catch (error) {
      console.error('Error approving product:', error);
      toast.error('Erro ao aprovar produto');
    }
  };

  const handleRejectProduct = async (productId: string) => {
    try {
      setProducts(prevProducts =>
        prevProducts.map(product =>
          product.id === productId ? { ...product, status: 'inativo' } : product
        )
      );
      
      toast.success('Produto recusado');
    } catch (error) {
      console.error('Error rejecting product:', error);
      toast.error('Erro ao recusar produto');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este produto?')) {
      return;
    }
    
    try {
      setProducts(prevProducts => 
        prevProducts.filter(product => product.id !== productId)
      );
      
      toast.success('Produto excluído com sucesso');
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Erro ao excluir produto');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

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
                  <SelectItem value="ativo">Ativos</SelectItem>
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
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-construPro-blue"></div>
              <p className="mt-2 text-gray-500">Carregando produtos...</p>
            </div>
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
                          <img 
                            src={product.imagemUrl} 
                            alt={product.nome}
                            className="h-12 w-12 rounded object-cover"
                          />
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
                          <ProductStatusBadge status={product.status || 'pendente'} />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => handleApproveProduct(product.id)}
                            >
                              <Check size={16} className="text-green-600" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => handleRejectProduct(product.id)}
                            >
                              <X size={16} className="text-red-600" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost"
                            >
                              <Edit size={16} className="text-blue-600" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => handleDeleteProduct(product.id)}
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
        </CardFooter>
      </Card>
    </AdminLayout>
  );
};

export default ProductsManagement;
