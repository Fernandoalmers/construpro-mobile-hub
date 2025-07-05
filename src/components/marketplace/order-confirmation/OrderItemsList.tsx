
import React from 'react';
import { Package } from 'lucide-react';
import ProductImage from '../../admin/products/components/ProductImage';
import { OrderItem } from '@/services/order/types';

interface OrderItemsListProps {
  items: OrderItem[];
}

// Helper function to format quantity based on unit type
const formatQuantity = (quantidade: number, unidadeMedida: string = 'unidade'): string => {
  const qty = Number(quantidade);
  const isInteger = qty % 1 === 0;
  
  // Format the number part
  const formattedQty = isInteger ? qty.toString() : qty.toFixed(2);
  
  // Determine the unit suffix
  const getUnitSuffix = (unit: string, qty: number): string => {
    switch (unit.toLowerCase()) {
      case 'quilograma':
      case 'kg':
        return ' kg';
      case 'grama':
      case 'g':
        return ' g';
      case 'litro':
      case 'l':
        return ' L';
      case 'mililitro':
      case 'ml':
        return ' ml';
      case 'metro':
      case 'm':
        return ' m';
      case 'metro_quadrado':
      case 'm²':
      case 'm2':
        return ' m²';
      case 'centimetro':
      case 'cm':
        return ' cm';
      case 'pacote':
        return qty === 1 ? ' pacote' : ' pacotes';
      case 'caixa':
        return qty === 1 ? ' caixa' : ' caixas';
      case 'unidade':
      default:
        return qty === 1 ? ' un' : ' un';
    }
  };
  
  return formattedQty + getUnitSuffix(unidadeMedida, qty);
};

const OrderItemsList: React.FC<OrderItemsListProps> = ({ items }) => {
  // Log detailed info about items for debugging
  React.useEffect(() => {
    if (items && Array.isArray(items)) {
      console.log(`[OrderItemsList] Rendering ${items.length} items`);
      
      if (items.length > 0) {
        const firstItem = items[0];
        console.log("[OrderItemsList] First item details:", {
          id: firstItem.id,
          produto_id: firstItem.produto_id,
          produto: firstItem.produto ? {
            id: firstItem.produto.id,
            nome: firstItem.produto.nome,
            hasImageUrl: !!firstItem.produto.imagem_url,
            imageUrl: firstItem.produto.imagem_url,
            hasImagens: firstItem.produto.imagens && 
                       Array.isArray(firstItem.produto.imagens) && 
                       firstItem.produto.imagens.length > 0,
            imagensData: firstItem.produto.imagens
          } : 'No product data'
        });
      } else {
        console.log("[OrderItemsList] No items to render");
      }
    } else {
      console.warn("[OrderItemsList] Items is not an array:", items);
    }
  }, [items]);
  
  return (
    <div className="mb-4">
      <h3 className="font-medium mb-3 flex items-center">
        <Package className="mr-2" size={18} />
        Itens do Pedido
      </h3>
      
      {items && Array.isArray(items) && items.length > 0 ? (
        <div className="space-y-4">
          {items.map((item: OrderItem, index: number) => {
            // Debug log individual item rendering
            console.log(`[OrderItemsList] Rendering item ${index}:`, {
              id: item.id || 'no-id',
              productName: item.produto?.nome || 'Produto',
              hasImageUrl: !!item.produto?.imagem_url,
              imageUrl: item.produto?.imagem_url,
              hasImagens: item.produto?.imagens && Array.isArray(item.produto?.imagens) && item.produto?.imagens.length > 0,
              imagensData: item.produto?.imagens
            });
            
            return (
              <div key={item.id || index} className="flex border-b border-gray-100 pb-4">
                <div className="w-20 h-20 flex-shrink-0 mr-3 bg-gray-50 rounded overflow-hidden">
                  <ProductImage 
                    imagemUrl={item.produto?.imagem_url}
                    imagens={item.produto?.imagens}
                    productName={item.produto?.nome || 'Produto'}
                    size="lg"
                  />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-sm line-clamp-2">{item.produto?.nome || 'Produto'}</h4>
                  <div className="mt-2 text-gray-600 text-sm">
                    <div className="flex justify-between items-center">
                      <span>
                        Quantidade: {formatQuantity(item.quantidade, item.produto?.unidade_medida || 'unidade')}
                      </span>
                      <span>R$ {Number(item.preco_unitario).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="font-medium">Subtotal:</span>
                      <span className="font-medium">R$ {Number(item.subtotal || (item.preco_unitario * item.quantidade)).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-gray-500 py-2 text-center">Nenhum item encontrado</p>
      )}
    </div>
  );
};

export default OrderItemsList;
