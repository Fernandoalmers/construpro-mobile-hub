
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
        if (!userData?.user) {
          console.log("[CartContent] No authenticated user");
          return;
        }
        
        console.log("[CartContent] Checking carts for user:", userData.user.id);
        
        // Get all active carts for this user
        const { data: allCarts, error: cartsError } = await supabase
          .from('carts')
          .select('id, status')
          .eq('user_id', userData.user.id);
          
        console.log("[CartContent] All user carts:", allCarts, cartsError);
        
        // Get active cart
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
        
        console.log("[CartContent] Found active cart:", cartData.id);
        
        // Get cart items
        const { data: cartItems, error: itemsError } = await supabase
          .from('cart_items')
          .select('*')
          .eq('cart_id', cartData.id);
          
        console.log("[CartContent] Direct check results:", {
          cart_id: cartData.id,
          itemsCount: cartItems?.length || 0,
          error: itemsError
        });
        
        if (cartItems && cartItems.length > 0) {
          // Verify products as well
          const productIds = cartItems.map(item => item.product_id);
          const { data: products, error: productsError } = await supabase
            .from('produtos')
            .select('id, nome, imagens, vendedor_id')
            .in('id', productIds);
            
          console.log("[CartContent] Products direct check:", {
            productsCount: products?.length || 0,
            error: productsError
          });
          
          if (products && products.length > 0) {
            // Check vendor information
            const vendorIds = [...new Set(products.map(p => p.vendedor_id).filter(Boolean))];
            if (vendorIds.length > 0) {
              const { data: vendors, error: vendorsError } = await supabase
                .from('vendedores')
                .select('id, nome_loja')
                .in('id', vendorIds);
                
              console.log("[CartContent] Vendors direct check:", {
                vendorsCount: vendors?.length || 0,
                error: vendorsError
              });
            }
          }
        }
      } catch (err) {
        console.error("[CartContent] Error in direct check:", err);
      }
    };
    
    checkCartDirectly();
  }, []);

  console.log("[CartContent] Rendering with items by store:", itemsByStore);
  console.log("[CartContent] Store keys:", Object.keys(itemsByStore));
  
  // Check cart has items
  const hasItems = cart?.items && cart.items.length > 0;
  const hasGroupedItems = Object.keys(itemsByStore).length > 0;
  
  console.log("[CartContent] Has items:", hasItems, "Has grouped items:", hasGroupedItems);

  return (
    <div className="flex-1 p-6">
      <div className="space-y-6">
        {hasGroupedItems ? (
          Object.entries(itemsByStore).map(([storeId, { loja, items }]) => (
            <StoreCartGroup 
              key={storeId}
              store={loja}
              items={items}
              onUpdateQuantity={onUpdateQuantity}
              onRemoveItem={onRemoveItem}
              processingItem={processingItem}
            />
          ))
        ) : (
          <div className="text-center py-6 text-gray-500">
            <p>Não há itens no carrinho ou dados ainda estão carregando.</p>
            {hasItems && (
              <p className="mt-2 text-sm">
                Há {cart?.items.length} item(s) no carrinho, mas não foram agrupados corretamente.
              </p>
            )}
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
