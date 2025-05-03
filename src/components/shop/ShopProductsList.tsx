import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProducts } from '@/services/productService';
import { useCart } from '@/hooks/use-cart';
import { toast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, ShoppingCart, Star, Filter, Package } from 'lucide-react';

interface Product {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  preco_anterior?: number;
  pontos: number;
  categoria: string;
  imagem_url?: string;
  loja_id: string;
  loja?: {
    nome: string;
    logo_url?: string;
  };
}

const ShopProductsList: React.FC = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Load products
  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      try {
        const productsData = await getProducts();
        setProducts(productsData);
        setFilteredProducts(productsData);
        
        // Extract unique categories
        const uniqueCategories = Array.from(
          new Set(productsData.map((product: Product) => product.categoria))
        ).filter(Boolean);
        setCategories(uniqueCategories as string[]);
      } catch (error) {
        console.error('Error loading products:', error);
        toast({
          title: "Erro ao carregar produtos",
          description: "Não foi possível carregar os produtos. Tente novamente mais tarde.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadProducts();
  }, []);
  
  // Filter products when search or category changes
  useEffect(() => {
    let result = [...products];
    
    // Apply category filter
    if (categoryFilter !== 'all') {
      result = result.filter(product => product.categoria === categoryFilter);
    }
    
    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(product => 
        product.nome.toLowerCase().includes(searchLower) || 
        product.descricao.toLowerCase().includes(searchLower) ||
        product.categoria.toLowerCase().includes(searchLower) ||
        (product.loja?.nome && product.loja.nome.toLowerCase().includes(searchLower))
      );
    }
    
    setFilteredProducts(result);
  }, [searchTerm, categoryFilter, products]);
  
  // Navigate to product detail
  const handleProductClick = (productId: string) => {
    navigate(`/shop/product/${productId}`);
  };
  
  // Handle add to cart
  const handleAddToCart = async (e: React.MouseEvent, productId: string) => {
    e.stopPropagation(); // Prevent navigation to product detail
    
    try {
      await addToCart(productId);
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };
  
  // Format price as currency
  const formatCurrency = (price: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(price);
  };
  
  // Calculate discount percentage
  const calculateDiscount = (price: number, originalPrice?: number) => {
    if (!originalPrice || originalPrice <= price) return null;
    
    const discount = ((originalPrice - price) / originalPrice) * 100;
    return Math.round(discount);
  };
  
  // Placeholder image if product has no image
  const getProductImage = (product: Product) => {
    // Check for image in product_images table
    if (product.imagem_url) {
      return product.imagem_url;
    }
    
    // Default placeholder
    return 'https://placehold.co/300x300/e6e6e6/7f7f7f?text=Sem+Imagem';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            placeholder="Buscar produtos..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {categories.length > 0 && (
          <div className="w-full md:w-auto">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <div className="flex items-center">
                  <Filter size={16} className="mr-2" />
                  <SelectValue placeholder="Categoria" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center p-12">
          <div className="w-8 h-8 border-4 border-t-construPro-blue rounded-full animate-spin"></div>
          <span className="ml-3 text-lg">Carregando produtos...</span>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center p-12 border border-dashed rounded-lg">
          <Package size={64} className="mx-auto text-gray-300 mb-4" />
          <p className="text-xl font-medium text-gray-500">
            {products.length === 0 
              ? 'Ainda não há produtos disponíveis' 
              : 'Nenhum produto encontrado'}
          </p>
          <p className="text-gray-400 mt-2">
            {products.length === 0 
              ? 'Novos produtos estão sendo adicionados. Volte em breve!' 
              : 'Tente modificar os filtros de busca'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <Card 
              key={product.id}
              className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleProductClick(product.id)}
            >
              <div className="relative pb-[56.25%] bg-gray-100">
                <img 
                  src={product.imagem_url || 'https://placehold.co/300x300/e6e6e6/7f7f7f?text=Sem+Imagem'} 
                  alt={product.nome}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                {product.preco_anterior && product.preco_anterior > product.preco && (
                  <Badge className="absolute top-2 right-2 bg-red-500">
                    {Math.round(((product.preco_anterior - product.preco) / product.preco_anterior) * 100)}% OFF
                  </Badge>
                )}
              </div>
              
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 mb-1">
                      {product.categoria}
                    </p>
                    <h3 className="font-semibold text-lg line-clamp-2 mb-1">
                      {product.nome}
                    </h3>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-xl font-bold text-construPro-blue">
                        {formatCurrency(product.preco)}
                      </span>
                      {product.preco_anterior && product.preco_anterior > product.preco && (
                        <span className="text-sm text-gray-500 line-through">
                          {formatCurrency(product.preco_anterior)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center mt-1 text-sm text-gray-600">
                      <Star size={14} className="text-yellow-500 mr-1" />
                      <span className="mr-1">{product.pontos}</span>
                      <span>pontos</span>
                    </div>
                    {product.loja && (
                      <p className="mt-2 text-xs text-gray-500">
                        Vendido por: {product.loja.nome}
                      </p>
                    )}
                  </div>
                  
                  <Button 
                    size="sm"
                    className="ml-auto mt-2"
                    onClick={(e) => handleAddToCart(e, product.id)}
                  >
                    <ShoppingCart size={16} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ShopProductsList;
