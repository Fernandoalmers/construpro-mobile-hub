
import React from 'react';
import { OrderItem } from '@/services/order/types';
import StoreInfoSection from './StoreInfoSection';
import LazyImage from '@/components/common/LazyImage';
import { formatCurrency } from '@/utils/formatCurrency';

interface GroupedOrderItemsProps {
  items: OrderItem[];
  shippingInfo?: Array<{
    vendedor_id: string;
    valor_frete: number;
    prazo_entrega?: string;
    zona_entrega?: string;
  }>;
}

const GroupedOrderItems: React.FC<GroupedOrderItemsProps> = ({ items, shippingInfo = [] }) => {
  // Group items by vendor
  const itemsByVendor = items.reduce((acc, item) => {
    const vendorId = item.vendedor_id || 'unknown';
    if (!acc[vendorId]) {
      acc[vendorId] = {
        vendor: item.vendedor || {
          id: vendorId,
          nome_loja: 'Loja não identificada'
        },
        items: []
      };
    }
    acc[vendorId].items.push(item);
    return acc;
  }, {} as Record<string, { vendor: any; items: OrderItem[] }>);

  const vendorGroups = Object.values(itemsByVendor);

  return (
    <div className="space-y-4">
      {vendorGroups.map((group, groupIndex) => {
        const groupSubtotal = group.items.reduce((sum, item) => 
          sum + (item.subtotal || item.preco_unitario * item.quantidade), 0
        );

        // Find shipping info for this vendor
        const vendorShipping = shippingInfo.find(s => s.vendedor_id === group.vendor.id);
        const shippingCost = vendorShipping?.valor_frete || 0;
        const deliveryTime = vendorShipping?.prazo_entrega;

        return (
          <div key={group.vendor.id || groupIndex}>
            <StoreInfoSection
              vendor={group.vendor}
              itemCount={group.items.length}
              subtotal={groupSubtotal}
              shippingCost={shippingCost}
              deliveryTime={deliveryTime}
            />

            <div className="bg-white rounded-lg shadow-sm border p-4 space-y-4">
              {group.items.map((item) => (
                <div key={item.id} className="flex gap-4 pb-4 border-b last:border-b-0 last:pb-0">
                  <div className="w-16 h-16 flex-shrink-0">
                    {item.produto?.imagem_url ? (
                      <LazyImage
                        src={item.produto.imagem_url}
                        alt={item.produto.nome}
                        className="w-full h-full object-cover rounded-lg"
                        placeholderClassName="w-full h-full bg-gray-200 rounded-lg"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                        <span className="text-xs text-gray-400">Sem imagem</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate">
                      {item.produto?.nome || 'Produto indisponível'}
                    </h4>
                    
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-sm text-gray-500">
                        Qtd: {item.quantidade} {item.produto?.unidade_medida || 'un'}
                      </span>
                      <span className="text-sm text-gray-500">
                        {formatCurrency(item.preco_unitario)} cada
                      </span>
                    </div>

                    <div className="mt-2 text-right">
                      <span className="font-semibold text-construPro-blue">
                        {formatCurrency(item.subtotal || item.preco_unitario * item.quantidade)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default GroupedOrderItems;
