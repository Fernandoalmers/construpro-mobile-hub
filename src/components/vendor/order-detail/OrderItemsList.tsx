
import React from 'react';
import { Card } from '@/components/ui/card';
import ProductImageDisplay from '../orders/ProductImageDisplay';
import { PedidoItem } from '@/services/vendor/orders/pedidosService';

interface OrderItemsListProps {
  items: PedidoItem[];
}

const OrderItemsList: React.FC<OrderItemsListProps> = ({ items }) => {
  return (
    <Card className="p-4">
      <h3 className="font-medium mb-3">Itens do Pedido - Sua Loja</h3>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="flex gap-3 p-4 border rounded-md bg-gray-50">
            <ProductImageDisplay 
              imageUrl={item.produto?.imagem_url || null}
              productName={item.produto?.nome || 'Produto'}
              className="w-16 h-16"
            />
            <div className="flex-1">
              <h4 className="font-medium text-lg mb-2">{item.produto?.nome || 'Produto'}</h4>
              
              <div className="space-y-1 text-sm text-gray-600">
                <p><strong>Quantidade:</strong> {item.quantidade} un</p>
                <p><strong>Preço unitário:</strong> R$ {Number(item.preco_unitario).toFixed(2)}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-lg text-construPro-orange">R$ {Number(item.total).toFixed(2)}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default OrderItemsList;
