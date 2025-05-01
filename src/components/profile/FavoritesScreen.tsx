
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Bookmark, Clock, ShoppingBag, ChevronRight, Star } from 'lucide-react';
import Card from '../common/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CustomButton from '../common/CustomButton';
import produtos from '../../data/produtos.json';
import { toast } from "@/components/ui/sonner";

// Mock data for recently viewed and favorite products
// In a real app, this would be stored in user data or localStorage
const mockRecentlyViewed = ["1", "4", "2", "7"];
const mockFavorites = ["3", "5", "1"];
const mockFrequentlyBought = ["2", "7"];

const FavoritesScreen: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("recent");
  
  // Get products from IDs
  const getProducts = (ids: string[]) => {
    return ids.map(id => produtos.find(produto => produto.id === id)).filter(Boolean);
  };
  
  const recentlyViewedProducts = getProducts(mockRecentlyViewed);
  const favoriteProducts = getProducts(mockFavorites);
  const frequentlyBoughtProducts = getProducts(mockFrequentlyBought);
  
  const handleAddToCart = (productId: string) => {
    toast.success("Produto adicionado ao carrinho");
    // In a real app, this would add the product to the cart
  };
  
  // Render a product card
  const renderProductCard = (product: any) => {
    if (!product) return null;
    
    return (
      <Card key={product.id} className="overflow-hidden">
        <div 
          className="h-40 bg-center bg-cover"
          style={{ backgroundImage: `url(${product.imagemUrl})` }}
        />
        <div className="p-3">
          <h3 className="font-medium truncate">{product.nome}</h3>
          <div className="flex items-center mt-1 mb-2">
            <div className="flex items-center">
              <Star size={14} className="text-yellow-400 fill-yellow-400" />
              <span className="text-xs ml-1">{product.avaliacao.toFixed(1)}</span>
            </div>
            <span className="text-xs text-gray-500 ml-2">({Math.floor(Math.random() * 100) + 10} avaliações)</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="font-bold text-construPro-blue">
              R$ {product.preco.toFixed(2)}
            </span>
            
            <CustomButton
              variant="primary"
              size="sm"
              onClick={() => handleAddToCart(product.id)}
              icon={<ShoppingBag size={14} />}
            >
              Comprar
            </CustomButton>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 pb-20">
      {/* Header */}
      <div className="bg-construPro-blue p-6 pt-12">
        <div className="flex items-center mb-4">
          <button onClick={() => navigate('/profile')} className="text-white">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold text-white ml-2">Favoritos</h1>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="px-6 -mt-6">
        <Card className="p-2">
          <Tabs defaultValue="recent" onValueChange={setActiveTab}>
            <TabsList className="w-full bg-gray-100">
              <TabsTrigger value="recent" className="flex-1">
                <Clock size={14} className="mr-1" />
                Recentes
              </TabsTrigger>
              <TabsTrigger value="favorites" className="flex-1">
                <Bookmark size={14} className="mr-1" />
                Favoritos
              </TabsTrigger>
              <TabsTrigger value="frequent" className="flex-1">
                <ShoppingBag size={14} className="mr-1" />
                Frequentes
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </Card>
      </div>
      
      {/* Content */}
      <div className="p-6">
        {activeTab === "recent" && (
          <>
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-medium">Vistos recentemente</h2>
              <button 
                className="text-sm text-construPro-blue flex items-center"
                onClick={() => navigate('/marketplace')}
              >
                Ver todos
                <ChevronRight size={16} />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {recentlyViewedProducts.length > 0 ? (
                recentlyViewedProducts.map(product => renderProductCard(product))
              ) : (
                <div className="col-span-2 text-center py-10">
                  <Clock className="mx-auto text-gray-400 mb-3" size={40} />
                  <h3 className="text-lg font-medium text-gray-700">Nenhum produto visualizado recentemente</h3>
                  <CustomButton 
                    variant="primary" 
                    className="mt-4"
                    onClick={() => navigate('/marketplace')}
                  >
                    Ir para loja
                  </CustomButton>
                </div>
              )}
            </div>
          </>
        )}
        
        {activeTab === "favorites" && (
          <>
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-medium">Produtos favoritos</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {favoriteProducts.length > 0 ? (
                favoriteProducts.map(product => renderProductCard(product))
              ) : (
                <div className="col-span-2 text-center py-10">
                  <Bookmark className="mx-auto text-gray-400 mb-3" size={40} />
                  <h3 className="text-lg font-medium text-gray-700">Nenhum produto favorito</h3>
                  <p className="text-gray-500 mt-1">Adicione produtos aos favoritos para encontrá-los aqui.</p>
                  <CustomButton 
                    variant="primary" 
                    className="mt-4"
                    onClick={() => navigate('/marketplace')}
                  >
                    Ir para loja
                  </CustomButton>
                </div>
              )}
            </div>
          </>
        )}
        
        {activeTab === "frequent" && (
          <>
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-medium">Comprados com frequência</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {frequentlyBoughtProducts.length > 0 ? (
                frequentlyBoughtProducts.map(product => renderProductCard(product))
              ) : (
                <div className="col-span-2 text-center py-10">
                  <ShoppingBag className="mx-auto text-gray-400 mb-3" size={40} />
                  <h3 className="text-lg font-medium text-gray-700">Nenhum produto frequente</h3>
                  <p className="text-gray-500 mt-1">Continue comprando para construir seu histórico.</p>
                  <CustomButton 
                    variant="primary" 
                    className="mt-4"
                    onClick={() => navigate('/marketplace')}
                  >
                    Ir para loja
                  </CustomButton>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FavoritesScreen;
