
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingBag } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Product {
  id: string;
  nome: string;
  preco_normal: number;
  pontos_consumidor: number;
  imagens?: string[];
}

interface FeaturedProductsSectionProps {
  products: Product[];
  isLoading: boolean;
}

const FeaturedProductsSection: React.FC<FeaturedProductsSectionProps> = ({
  products,
  isLoading
}) => {
  const navigate = useNavigate();

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold text-gray-900">Produtos em Destaque</h3>
        <Button
          variant="outline"
          onClick={() => navigate('/marketplace')}
          size="sm"
          className="text-xs"
        >
          Ver Mais
        </Button>
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-3">
                <Skeleton className="w-full h-24 mb-2" />
                <Skeleton className="h-3 w-3/4 mb-1" />
                <Skeleton className="h-3 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {products.slice(0, 4).map((produto) => (
            <Card 
              key={produto.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`/produto/${produto.id}`)}
            >
              <CardContent className="p-3">
                <div className="aspect-square bg-gray-100 rounded-lg mb-2 flex items-center justify-center">
                  {produto.imagens && produto.imagens.length > 0 ? (
                    <img 
                      src={produto.imagens[0]} 
                      alt={produto.nome}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <ShoppingBag className="h-6 w-6 text-gray-400" />
                  )}
                </div>
                <h4 className="font-medium text-gray-900 text-xs mb-1 line-clamp-2">
                  {produto.nome}
                </h4>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-green-600">
                    R$ {produto.preco_normal?.toFixed(2)}
                  </span>
                  {produto.pontos_consumidor > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      +{produto.pontos_consumidor} pts
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default FeaturedProductsSection;
