
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
            <div className="flex flex-col lg:flex-row gap-4">
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
                
                {/* Grid de informações - responsivo */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                  {/* Quantidade */}
                  <div className="flex items-center gap-2 min-w-0">
                    <Package size={16} className="text-gray-500 flex-shrink-0" />
                    <span className="text-gray-600 flex-shrink-0">Quantidade:</span>
                    <span className="font-medium text-gray-900">{item.quantidade} un</span>
                  </div>
                  
                  {/* Preço unitário */}
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-gray-600 flex-shrink-0">Preço unitário:</span>
                    <span className="font-medium text-gray-900">R$ {Number(item.preco_unitario).toFixed(2)}</span>
                  </div>
                  
                  {/* Total do item */}
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-gray-600 flex-shrink-0">Total:</span>
                    <span className="font-bold text-construPro-orange">R$ {Number(item.total).toFixed(2)}</span>
                  </div>
                </div>
                
                {/* Segunda linha - SKU e Código de Barras */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mt-3">
                  {/* SKU */}
                  <div className="flex items-center gap-2 min-w-0">
                    <Hash size={16} className="text-gray-500 flex-shrink-0" />
                    <span className="text-gray-600 flex-shrink-0">SKU:</span>
                    <span className="font-medium text-gray-900 break-all">
                      {item.produto?.sku || 'Não informado'}
                    </span>
                  </div>
                  
                  {/* Código de barras */}
                  <div className="flex items-center gap-2 min-w-0">
                    <Barcode size={16} className="text-gray-500 flex-shrink-0" />
                    <span className="text-gray-600 flex-shrink-0">Código:</span>
                    <span className="font-medium text-gray-900 break-all">
                      {item.produto?.codigo_barras || 'Não informado'}
                    </span>
                  </div>
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
