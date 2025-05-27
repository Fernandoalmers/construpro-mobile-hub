
import React from 'react';
import { Cart } from '@/types/cart';
import StoreCartGroup from './StoreCartGroup';
import CouponSection from './CouponSection';
import { AlertTriangle, ShoppingBag, Store } from 'lucide-react';

interface CartContentProps {
  cart: Cart | null;
  itemsByStore: Record<string, { loja: any, items: any[] }>;
  processingItem: string | null;
  appliedCoupon: {code: string, discount: number} | null;
  onUpdateQuantity: (item: any, quantity: number) => Promise<void>;
  onRemoveItem: (itemId: string) => Promise<void>;
  onApplyCoupon: (code: string) => void;
  onRemoveCoupon: () => void;
  orderValue?: number;
  isValidating?: boolean;
}

const CartContent: React.FC<CartContentProps> = ({
  cart,
  itemsByStore,
  processingItem,
  appliedCoupon,
  onUpdateQuantity,
  onRemoveItem,
  onApplyCoupon,
  onRemoveCoupon,
  orderValue = 0,
  isValidating = false
}) => {
  // Check cart has items
  const hasItems = cart?.items && cart.items.length > 0;
  const hasGroupedItems = Object.keys(itemsByStore).length > 0;
  
  const storeCount = Object.keys(itemsByStore).length;
  
  // If cart has items but they're not grouped, we might have a mapping issue
  const hasMappingIssue = hasItems && !hasGroupedItems;

  // Add some debug information to help troubleshoot cart issues
  console.log("[CartContent] Rendering with:", { 
    hasItems, 
    hasGroupedItems, 
    hasMappingIssue, 
    itemsByStore,
    storeCount,
    cartItems: cart?.items
  });

  return (
    <div className="space-y-4">
      {hasItems && (
        <div className="bg-white p-3 rounded-lg shadow-sm mb-2">
          <div className="flex items-center text-gray-700">
            <Store size={16} className="mr-2" />
            <span className="text-sm font-medium">
              {storeCount} {storeCount === 1 ? 'loja' : 'lojas'} • {cart?.items.length} {cart?.items.length === 1 ? 'item' : 'itens'}
            </span>
          </div>
        </div>
      )}
      
      {hasGroupedItems ? (
        <div className="space-y-5">
          {Object.entries(itemsByStore).map(([storeId, { loja, items }]) => (
            <StoreCartGroup 
              key={storeId}
              store={loja}
              items={items}
              onUpdateQuantity={onUpdateQuantity}
              onRemoveItem={onRemoveItem}
              processingItem={processingItem}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-10 text-gray-500 bg-white rounded-lg shadow p-8">
          {hasMappingIssue ? (
            <div className="flex flex-col items-center">
              <AlertTriangle size={36} className="text-amber-500 mb-2" />
              <p className="font-medium">Erro ao exibir os itens do carrinho</p>
              <p className="mt-2 text-sm">
                Há {cart?.items.length} item(s) no carrinho, mas não foi possível organizá-los corretamente.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <ShoppingBag size={48} className="text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-700">Seu carrinho está vazio</h3>
              <p className="mt-2 text-sm max-w-md mx-auto">
                Adicione produtos ao carrinho para visualizá-los aqui.
              </p>
            </div>
          )}
        </div>
      )}
      
      {hasItems && (
        <CouponSection 
          appliedCoupon={appliedCoupon}
          onApplyCoupon={onApplyCoupon}
          onRemoveCoupon={onRemoveCoupon}
          orderValue={orderValue}
          isValidating={isValidating}
        />
      )}
    </div>
  );
};

export default CartContent;
