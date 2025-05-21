
import React from 'react';
import { Package } from 'lucide-react';
import ProductImage from '../../admin/products/components/ProductImage';
import { OrderItem } from '@/services/order/types';

interface OrderItemsListProps {
  items: OrderItem[];
}

const OrderItemsList: React.FC<OrderItemsListProps> = ({ items }) => {
  return (
    <div className="mb-4">
      <h3 className="font-medium mb-3 flex items-center">
        <Package className="mr-2" size={18} />
        Itens do Pedido
      </h3>
      
      {items && Array.isArray(items) && items.length > 0 ? (
        <div className="space-y-4">
          {items.map((item: OrderItem, index: number) => (
            <div key={item.id || index} className="flex border-b border-gray-100 pb-4">
              <div className="w-20 h-20 flex-shrink-0 mr-3 bg-gray-50 rounded overflow-hidden">
                <ProductImage 
                  imagemUrl={item.produto?.imagem_url}
                  productName={item.produto?.nome || 'Produto'}
                  size="lg"
                />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-sm line-clamp-2">{item.produto?.nome || 'Produto'}</h4>
                <div className="mt-2 text-gray-600 text-sm">
                  <div className="flex justify-between items-center">
                    <span>Quantidade: {item.quantidade}x</span>
                    <span>R$ {Number(item.preco_unitario).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="font-medium">Subtotal:</span>
                    <span className="font-medium">R$ {Number(item.subtotal || (item.preco_unitario * item.quantidade)).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500 py-2 text-center">Nenhum item encontrado</p>
      )}
    </div>
  );
};

export default OrderItemsList;
