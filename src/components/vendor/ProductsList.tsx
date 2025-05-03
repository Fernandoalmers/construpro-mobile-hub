
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { 
  Plus, Search, Edit, Trash2, Check, X, Copy, Filter, Package
} from 'lucide-react';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { toast } from '@/components/ui/use-toast';
import { getVendorProducts, deleteProduct, updateProductStatus } from '@/services/vendorProductService';

const ProductsList: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Load products
  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      try {
        const productsData = await getVendorProducts();
        setProducts(productsData);
        setFilteredProducts(productsData);
      } catch (error) {
        console.error('Error loading products:', error);
        toast({
          title: "Erro ao carregar produtos",
          description: "Não foi possível carregar a lista de produtos.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadProducts();
  }, []);
  
  // Filter products when search or status filter changes
  useEffect(() => {
    let result = [...products];
    
    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(product => product.status === statusFilter);
    }
    
    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(product => 
        product.nome.toLowerCase().includes(searchLower) || 
        product.sku?.toLowerCase().includes(searchLower) ||
        product.codigo_barras?.toLowerCase().includes(searchLower)
      );
    }
    
    setFilteredProducts(result);
  }, [searchTerm, statusFilter, products]);
  
  // Handle status change
  const handleStatusChange = async (id: string, status: 'pendente' | 'aprovado' | 'inativo') => {
    try {
      const result = await updateProductStatus(id, status);
      if (result.success) {
        // Update local state
        setProducts(prev => prev.map(product => 
          product.id === id ? { ...product, status } : product
        ));
        
        toast({
          title: "Status atualizado",
          description: `O produto foi ${status === 'aprovado' ? 'aprovado' : status === 'pendente' ? 'marcado como pendente' : 'inativado'}.`
        });
      } else {
        toast({
          title: "Erro",
          description: result.error || "Não foi possível atualizar o status.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status.",
        variant: "destructive"
      });
    }
  };
  
  // Handle delete product
  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.')) {
      return;
    }
    
    try {
      const result = await deleteProduct(id);
      if (result.success) {
        // Remove from local state
        setProducts(prev => prev.filter(product => product.id !== id));
        
        toast({
          title: "Produto excluído",
          description: "O produto foi excluído com sucesso."
        });
      } else {
        toast({
          title: "Erro",
          description: result.error || "Não foi possível excluir o produto.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o produto.",
        variant: "destructive"
      });
    }
  };
  
  // Handle duplicate product (navigate to form with copied data)
  const handleDuplicate = (product: any) => {
    const productCopy = { ...product };
    delete productCopy.id; // Remove id to create a new product
    navigate('/vendor/products/new', { state: { initialData: productCopy } });
  };
  
  // Format price as currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  
  // Render status badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'aprovado':
        return <Badge className="bg-green-500">Aprovado</Badge>;
      case 'pendente':
        return <Badge variant="outline" className="text-amber-500 border-amber-500">Pendente</Badge>;
      case 'inativo':
        return <Badge variant="secondary">Inativo</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Meus Produtos</h1>
        <Button onClick={() => navigate('/vendor/products/new')} className="md:w-auto w-full">
          <Plus size={16} className="mr-2" />
          Novo Produto
        </Button>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            placeholder="Buscar por nome, SKU ou código de barras..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="w-full md:w-auto">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <div className="flex items-center">
                <Filter size={16} className="mr-2" />
                <SelectValue placeholder="Status" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="aprovado">Aprovados</SelectItem>
              <SelectItem value="pendente">Pendentes</SelectItem>
              <SelectItem value="inativo">Inativos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center p-8">
          <div className="w-6 h-6 border-2 border-t-construPro-blue rounded-full animate-spin"></div>
          <span className="ml-2">Carregando produtos...</span>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center p-8 border border-dashed rounded-lg">
          {products.length === 0 ? (
            <>
              <Package size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-lg font-medium text-gray-500">Você ainda não possui produtos cadastrados</p>
              <p className="text-gray-400 mt-1 mb-4">Adicione seu primeiro produto para começar a vender</p>
              <Button onClick={() => navigate('/vendor/products/new')}>
                <Plus size={16} className="mr-2" />
                Adicionar Produto
              </Button>
            </>
          ) : (
            <>
              <Package size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-lg font-medium text-gray-500">Nenhum produto encontrado</p>
              <p className="text-gray-400 mt-1">Tente modificar os filtros de busca</p>
            </>
          )}
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableCaption>Lista de produtos ({filteredProducts.length})</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Produto</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Preço</TableHead>
                <TableHead className="text-center">Estoque</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.nome}</TableCell>
                  <TableCell>{product.sku}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(product.preco)}
                  </TableCell>
                  <TableCell className="text-center">
                    {product.estoque > 0 ? (
                      product.estoque
                    ) : (
                      <span className="text-red-500">Esgotado</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {renderStatusBadge(product.status)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end">
                      <Button
                        variant="ghost" 
                        size="sm"
                        onClick={() => navigate(`/vendor/products/edit/${product.id}`)}
                      >
                        <Edit size={16} />
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            •••
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleStatusChange(product.id, 'aprovado')}>
                            <Check size={16} className="mr-2 text-green-600" />
                            Aprovar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(product.id, 'pendente')}>
                            <Filter size={16} className="mr-2 text-amber-600" />
                            Marcar como pendente
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(product.id, 'inativo')}>
                            <X size={16} className="mr-2 text-gray-600" />
                            Inativar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicate(product)}>
                            <Copy size={16} className="mr-2 text-blue-600" />
                            Duplicar
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDelete(product.id)}
                            className="text-red-600"
                          >
                            <Trash2 size={16} className="mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default ProductsList;
