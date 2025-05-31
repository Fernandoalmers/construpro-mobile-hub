
import React from 'react';
import { Card } from '@/components/ui/card';
import ProductImageDisplay from '../orders/ProductImageDisplay';
import { PedidoItem } from '@/services/vendor/orders/pedidosService';
import { Package, Hash, Barcode } from 'lucide-react';

interface OrderItemsListProps {
  items: PedidoItem[];
}

const OrderItemsList: React.FC<OrderItemsListProps> = ({ items }) => {
  return (
    <Card className="p-4">
      <h3 className="font-medium mb-4 text-lg">Itens do Pedido - Sua Loja</h3>
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex gap-4">
              {/* Imagem do produto */}
              <div className="flex-shrink-0">
                <ProductImageDisplay 
                  imageUrl={item.produto?.imagem_url || null}
                  productName={item.produto?.nome || 'Produto'}
                  className="w-20 h-20"
                />
              </div>
              
              {/* Informações principais */}
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-lg mb-3 text-gray-900 break-words">
                  {item.produto?.nome || 'Produto'}
                </h4>
                
                {/* Grid de informações */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  {/* Quantidade */}
                  <div className="flex items-center gap-2">
                    <Package size={16} className="text-gray-500 flex-shrink-0" />
                    <span className="text-gray-600">Quantidade:</span>
                    <span className="font-medium text-gray-900">{item.quantidade} un</span>
                  </div>
                  
                  {/* Preço unitário */}
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">Preço unitário:</span>
                    <span className="font-medium text-gray-900">R$ {Number(item.preco_unitario).toFixed(2)}</span>
                  </div>
                  
                  {/* SKU */}
                  {item.produto?.sku && (
                    <div className="flex items-center gap-2">
                      <Hash size={16} className="text-gray-500 flex-shrink-0" />
                      <span className="text-gray-600">SKU:</span>
                      <span className="font-medium text-gray-900 break-all">{item.produto.sku}</span>
                    </div>
                  )}
                  
                  {/* Código de barras */}
                  {item.produto?.codigo_barras && (
                    <div className="flex items-center gap-2">
                      <Barcode size={16} className="text-gray-500 flex-shrink-0" />
                      <span className="text-gray-600">Código:</span>
                      <span className="font-medium text-gray-900 break-all">{item.produto.codigo_barras}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Total do item */}
              <div className="flex-shrink-0 text-right">
                <div className="bg-white rounded-lg p-3 border border-construPro-orange/20">
                  <p className="text-sm text-gray-600 mb-1">Total</p>
                  <p className="font-bold text-xl text-construPro-orange">
                    R$ {Number(item.total).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {items.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Package size={48} className="mx-auto mb-3 text-gray-400" />
            <p className="text-lg font-medium">Nenhum item encontrado</p>
            <p className="text-sm">Este pedido não possui itens da sua loja.</p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default OrderItemsList;
