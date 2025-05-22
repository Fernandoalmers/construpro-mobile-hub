
import React from 'react';
import { Eye, Edit2, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { VendorProduct } from '@/services/vendorService';

interface ProductItemProps {
  produto: VendorProduct;
  onToggleStatus: (id: string, status: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
}

const ProductItem: React.FC<ProductItemProps> = ({
  produto,
  onToggleStatus,
  onDelete,
  onEdit
}) => {
  const getStatusBadge = () => {
    switch (produto.status) {
      case 'aprovado':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Aprovado</Badge>;
      case 'inativo':
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">Inativo</Badge>;
      case 'rejeitado':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Rejeitado</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Pendente</Badge>;
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const getToggleIcon = () => {
    return produto.status === 'aprovado' || produto.status === 'pendente' ? 
      <ToggleRight className="text-green-500" size={20} /> : 
      <ToggleLeft className="text-gray-500" size={20} />;
  };

  // Extract first image if exists
  let imagemUrl: string | undefined = undefined;
  
  if (typeof produto.imagens === 'string') {
    try {
      const parsedImages = JSON.parse(produto.imagens);
      imagemUrl = Array.isArray(parsedImages) && parsedImages.length > 0 ? parsedImages[0] : undefined;
    } catch (e) {
      console.error('Error parsing produto.imagens:', e);
    }
  } else if (Array.isArray(produto.imagens) && produto.imagens.length > 0) {
    imagemUrl = produto.imagens[0];
  }

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-0">
        <div className="flex items-center p-4">
          {/* Product Image */}
          <div className="w-16 h-16 mr-4 rounded overflow-hidden bg-gray-100 flex-shrink-0">
            {imagemUrl ? (
              <img 
                src={imagemUrl} 
                alt={produto.nome} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  console.error('Error loading image:', imagemUrl);
                  e.currentTarget.src = 'https://via.placeholder.com/150?text=Sem+Imagem';
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400 text-xs">
                Sem imagem
              </div>
            )}
          </div>
          
          {/* Product Details */}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold truncate">{produto.nome}</h3>
                <p className="text-sm text-gray-500 truncate">{produto.categoria || 'Sem categoria'}</p>
                {produto.segmento && (
                  <p className="text-xs text-gray-400">{produto.segmento}</p>
                )}
              </div>
              <div className="flex flex-col items-end">
                <p className="font-medium">{formatPrice(produto.preco_normal)}</p>
                {getStatusBadge()}
              </div>
            </div>
            
            <div className="mt-2 flex justify-between items-center">
              <div className="text-sm text-gray-500">
                Estoque: {produto.estoque || 0}
              </div>
              
              <div className="flex space-x-1">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => onToggleStatus(produto.id, produto.status || 'pendente')}
                  className="h-8 w-8"
                  title={produto.status === 'aprovado' ? 'Desativar' : 'Ativar'}
                >
                  {getToggleIcon()}
                </Button>
                <Button 
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(produto.id)}
                  className="h-8 w-8"
                  title="Editar"
                >
                  <Edit2 size={16} />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => onDelete(produto.id)}
                  className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                  title="Excluir"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductItem;
