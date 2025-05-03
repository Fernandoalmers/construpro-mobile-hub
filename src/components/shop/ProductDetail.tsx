import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProductById, trackProductView } from '@/services/productService';
import { useCart } from '@/hooks/use-cart';
import { 
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { toast } from '@/components/ui/use-toast';
import { 
  ShoppingCart, Star, ArrowLeft, Package, Truck, AlertTriangle
} from 'lucide-react';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const loadProduct = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        const productData = await getProductById(id);
        
        if (!productData) {
          toast({
            title: "Produto não encontrado",
            description: "Este produto não existe ou foi removido.",
            variant: "destructive"
          });
          navigate('/shop');
          return;
        }
        
        setProduct(productData);
        
        // Track product view
        await trackProductView(id);
      } catch (error) {
        console.error('Error loading product:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar as informações do produto.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadProduct();
  }, [id, navigate]);
  
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
  
  // Handle add to cart
  const handleAddToCart = async () => {
    if (!product || !id) return;
    
    try {
      await addToCart(id, quantity);
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };
  
  // Get product images
  const getProductImages = () => {
    if (!product) return [];
    
    // Check if product has images array
    if ('images' in product && Array.isArray(product.images) && product.images.length > 0) {
      return product.images.map((img: any) => img.url);
    }
    
    // Otherwise use the single image URL if available
    if (product.imagem_url) {
      return [product.imagem_url];
    }
    
    // Default placeholder
    return ['https://placehold.co/600x400/e6e6e6/7f7f7f?text=Sem+Imagem'];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-4 border-t-construPro-blue rounded-full animate-spin"></div>
        <span className="ml-3 text-lg">Carregando produto...</span>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center p-12">
        <AlertTriangle size={48} className="mx-auto text-amber-500 mb-4" />
        <h1 className="text-2xl font-bold">Produto não encontrado</h1>
        <p className="text-gray-600 mt-2 mb-6">
          Este produto não está mais disponível ou foi removido.
        </p>
        <Button onClick={() => navigate('/shop')}>
          <ArrowLeft size={16} className="mr-2" />
          Voltar para Loja
        </Button>
      </div>
    );
  }

  const images = getProductImages();

  return (
    <div className="max-w-6xl mx-auto p-4">
      <Button 
        variant="ghost" 
        onClick={() => navigate('/shop')}
        className="mb-4"
      >
        <ArrowLeft size={20} className="mr-2" /> 
        Voltar para Loja
      </Button>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Product Images */}
        <div>
          <div className="rounded-lg overflow-hidden border bg-white">
            <AspectRatio ratio={4/3}>
              <img 
                src={images[currentImageIndex]} 
                alt={product.nome}
                className="w-full h-full object-contain"
              />
            </AspectRatio>
          </div>
          
          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-2 mt-4">
              {images.map((image, index) => (
                <div 
                  key={index}
                  className={`aspect-square rounded-md overflow-hidden border cursor-pointer ${
                    index === currentImageIndex ? 'ring-2 ring-construPro-blue' : ''
                  }`}
                  onClick={() => setCurrentImageIndex(index)}
                >
                  <img 
                    src={image} 
                    alt={`${product.nome} - Imagem ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Product Info */}
        <div>
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  {product.categoria && (
                    <Badge variant="outline" className="mb-2">
                      {product.categoria}
                    </Badge>
                  )}
                  <CardTitle className="text-2xl">{product.nome}</CardTitle>
                  {product.loja && (
                    <CardDescription className="mt-1">
                      Vendido por: {product.loja.nome}
                    </CardDescription>
                  )}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Pricing */}
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-construPro-blue">
                    {formatCurrency(product.preco)}
                  </span>
                  {product.preco_anterior && product.preco_anterior > product.preco && (
                    <>
                      <span className="text-lg text-gray-500 line-through">
                        {formatCurrency(product.preco_anterior)}
                      </span>
                      <Badge className="bg-red-500">
                        {calculateDiscount(product.preco, product.preco_anterior)}% OFF
                      </Badge>
                    </>
                  )}
                </div>
                
                <div className="flex items-center mt-2">
                  <Star size={16} className="text-yellow-500 mr-1" />
                  <span className="text-sm">
                    Ganhe <strong>{product.pontos}</strong> pontos
                  </span>
                </div>
              </div>
              
              {/* Description */}
              <div>
                <h3 className="font-semibold mb-2">Descrição</h3>
                <p className="text-gray-600 whitespace-pre-line">{product.descricao}</p>
              </div>
              
              {/* Quantity */}
              <div className="flex items-center gap-4">
                <label htmlFor="quantity" className="text-sm font-medium">
                  Quantidade:
                </label>
                <div className="flex border rounded-md">
                  <button
                    type="button"
                    className="px-3 py-1 border-r"
                    onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    id="quantity"
                    min="1"
                    max={product.estoque || 99}
                    className="w-12 text-center p-1"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  />
                  <button
                    type="button"
                    className="px-3 py-1 border-l"
                    onClick={() => setQuantity(prev => Math.min(product.estoque || 99, prev + 1))}
                  >
                    +
                  </button>
                </div>
              </div>
            </CardContent>
            
            <CardFooter>
              <Button 
                className="w-full font-semibold"
                disabled={product.estoque <= 0}
                onClick={handleAddToCart}
              >
                <ShoppingCart size={18} className="mr-2" />
                {product.estoque > 0 ? 'Adicionar ao Carrinho' : 'Produto Indisponível'}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
      
      {/* Additional Product Details */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Detalhes do produto</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-sm">SKU</h3>
              <p className="text-gray-600">{product.sku || 'Não informado'}</p>
            </div>
            <div>
              <h3 className="font-semibold text-sm">Categoria</h3>
              <p className="text-gray-600">{product.categoria || 'Não classificado'}</p>
            </div>
            {product.codigo_barras && (
              <div>
                <h3 className="font-semibold text-sm">Código de barras</h3>
                <p className="text-gray-600">{product.codigo_barras}</p>
              </div>
            )}
            <div>
              <h3 className="font-semibold text-sm">Unidade de venda</h3>
              <p className="text-gray-600">{product.unidade_venda || 'Unidade'}</p>
            </div>
            {product.m2_por_caixa && (
              <div>
                <h3 className="font-semibold text-sm">m² por caixa</h3>
                <p className="text-gray-600">{product.m2_por_caixa}</p>
              </div>
            )}
            {product.pontos_profissional > 0 && (
              <div>
                <h3 className="font-semibold text-sm">Pontos para profissionais</h3>
                <p className="text-gray-600">{product.pontos_profissional}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductDetail;
