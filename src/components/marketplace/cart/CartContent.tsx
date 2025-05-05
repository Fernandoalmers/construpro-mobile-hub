
import React, { useEffect } from 'react';
import { Cart } from '@/types/cart';
import StoreCartGroup from './StoreCartGroup';
import CouponSection from './CouponSection';
import { supabase } from '@/integrations/supabase/client';

interface CartContentProps {
  cart: Cart | null;
  itemsByStore: Record<string, { loja: any, items: any[] }>;
  processingItem: string | null;
  appliedCoupon: {code: string, discount: number} | null;
  onUpdateQuantity: (item: any, quantity: number) => Promise<void>;
  onRemoveItem: (itemId: string) => Promise<void>;
  onApplyCoupon: (code: string) => void;
  onRemoveCoupon: () => void;
}

const CartContent: React.FC<CartContentProps> = ({
  cart,
  itemsByStore,
  processingItem,
  appliedCoupon,
  onUpdateQuantity,
  onRemoveItem,
  onApplyCoupon,
  onRemoveCoupon
}) => {
  useEffect(() => {
    // Diagnostic check - verify the cart directly
    const checkCartDirectly = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData?.user) return;
        
        const { data: cartData, error: cartError } = await supabase
          .from('carts')
          .select('id')
          .eq('user_id', userData.user.id)
          .eq('status', 'active')
          .maybeSingle();
          
        if (cartError || !cartData) {
          console.log("[CartContent] Direct check: No active cart found", cartError);
          return;
        }
        
        const { data: cartItems, error: itemsError } = await supabase
          .from('cart_items')
          .select('*')
          .eq('cart_id', cartData.id);
          
        console.log("[CartContent] Direct check results:", {
          cart_id: cartData.id,
          items: cartItems,
          error: itemsError
        });
        
        if (cartItems && cartItems.length > 0) {
          // Verify products as well
          const productIds = cartItems.map(item => item.product_id);
          const { data: products, error: productsError } = await supabase
            .from('produtos')
            .select('id, nome')
            .in('id', productIds);
            
          console.log("[CartContent] Products direct check:", {
            products,
            error: productsError
          });
        }
      } catch (err) {
        console.error("[CartContent] Error in direct check:", err);
      }
    };
    
    checkCartDirectly();
  }, []);

  console.log("[CartContent] Rendering with items by store:", itemsByStore);
  console.log("[CartContent] Store keys:", Object.keys(itemsByStore));

  return (
    <div className="flex-1 p-6">
      <div className="space-y-6">
        {Object.keys(itemsByStore).length > 0 ? (
          Object.values(itemsByStore).map(store => (
            <StoreCartGroup 
              key={store.loja.id}
              store={store.loja}
              items={store.items}
              onUpdateQuantity={onUpdateQuantity}
              onRemoveItem={onRemoveItem}
              processingItem={processingItem}
            />
          ))
        ) : (
          <div className="text-center py-6 text-gray-500">
            <p>Não há itens no carrinho.</p>
            <p className="text-sm mt-2">Verifique o console para diagnósticos.</p>
          </div>
        )}
        
        <CouponSection 
          appliedCoupon={appliedCoupon}
          onApplyCoupon={onApplyCoupon}
          onRemoveCoupon={onRemoveCoupon}
        />
      </div>
    </div>
  );
};

export default CartContent;
