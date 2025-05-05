
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, Trash2, Plus, Minus, Ticket } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/sonner';
import { Cart, CartItem } from '@/types/cart';
import CustomButton from '../common/CustomButton';
import Card from '../common/Card';
import ListEmptyState from '../common/ListEmptyState';
import LoadingState from '../common/LoadingState';
import ErrorState from '../common/ErrorState';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/hooks/use-cart';

const CartScreen: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { cart, updateQuantity, removeItem, refreshCart } = useCart();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{code: string, discount: number} | null>(null);
  const [processingItem, setProcessingItem] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/cart' } });
      return;
    }
    
    refreshCart();
  }, [isAuthenticated, navigate, refreshCart]);

  useEffect(() => {
    // Update loading state based on cart loading
    setLoading(false);
  }, [cart]);

  const handleUpdateQuantity = async (item: CartItem, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    if (newQuantity > (item.produto?.estoque || 0)) {
      toast.error('Quantidade solicitada não disponível em estoque');
      return;
    }

    try {
      setProcessingItem(item.id);
      await updateQuantity(item.id, newQuantity);
      toast.success('Carrinho atualizado com sucesso');
    } catch (err) {
      console.error('Failed to update quantity:', err);
      toast.error('Erro ao atualizar quantidade');
    } finally {
      setProcessingItem(null);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      setProcessingItem(itemId);
      await removeItem(itemId);
      toast.success('Item removido do carrinho');
    } catch (err) {
      console.error('Failed to remove item:', err);
      toast.error('Erro ao remover item do carrinho');
    } finally {
      setProcessingItem(null);
    }
  };

  const applyCoupon = () => {
    if (!couponCode) {
      toast.error('Digite um cupom válido');
      return;
    }

    // Mock coupon validation
    if (couponCode.toUpperCase() === 'CONSTRUPROMO') {
      setAppliedCoupon({ code: couponCode, discount: 10 });
      toast.success('Cupom aplicado! Desconto de 10% aplicado ao seu pedido.');
    } else {
      toast.error('O cupom informado não é válido ou expirou.');
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    toast.success('Cupom removido');
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-100">
        <div className="bg-white p-4 flex items-center shadow-sm">
          <button onClick={() => navigate(-1)} className="mr-4">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold">Carrinho de Compras</h1>
        </div>
        <LoadingState type="spinner" text="Carregando seu carrinho..." count={3} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-100">
        <div className="bg-white p-4 flex items-center shadow-sm">
          <button onClick={() => navigate(-1)} className="mr-4">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold">Carrinho de Compras</h1>
        </div>
        <ErrorState 
          title="Erro ao carregar o carrinho" 
          message={error} 
          onRetry={() => refreshCart()} 
        />
      </div>
    );
  }

  const cartItems = cart?.items || [];
  const cartIsEmpty = cartItems.length === 0;

  // Calculate discounts from coupon
  const subtotal = cart?.summary.subtotal || 0;
  const discount = appliedCoupon ? (subtotal * appliedCoupon.discount / 100) : 0;
  const shipping = cart?.summary.shipping || 0;
  const total = subtotal + shipping - discount;
  const totalPoints = cart?.summary.totalPoints || 0;

  // Group items by store
  const itemsByStore = cartItems.reduce((groups: Record<string, { loja: any, items: CartItem[] }>, item) => {
    const storeId = item.produto?.loja_id;
    if (!storeId) return groups;
    
    if (!groups[storeId]) {
      const store = cart?.stores?.find(s => s.id === storeId);
      groups[storeId] = {
        loja: store || { id: storeId, nome: 'Loja' },
        items: []
      };
    }
    
    groups[storeId].items.push(item);
    return groups;
  }, {});

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 pb-20">
      {/* Header */}
      <div className="bg-white p-4 flex items-center shadow-sm">
        <button onClick={() => navigate(-1)} className="mr-4">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold">Carrinho de Compras</h1>
      </div>

      {cartIsEmpty ? (
        <div className="p-6 flex-1 flex items-center justify-center">
          <ListEmptyState
            title="Seu carrinho está vazio"
            description="Explore nosso marketplace para adicionar produtos ao seu carrinho."
            icon={<ShoppingBag size={40} />}
            action={{
              label: "Ir para o Marketplace",
              onClick: () => navigate('/marketplace')
            }}
          />
        </div>
      ) : (
        <>
          {/* Cart Items */}
          <div className="flex-1 p-6">
            <div className="space-y-6">
              {Object.values(itemsByStore).map(store => (
                <div key={store.loja.id}>
                  <div className="flex items-center mb-3">
                    <img 
                      src={store.loja.logo_url || 'https://via.placeholder.com/30'} 
                      alt={store.loja.nome} 
                      className="w-6 h-6 rounded-full object-cover mr-2"
                    />
                    <h2 className="font-bold">{store.loja.nome}</h2>
                  </div>
                  
                  <Card className="divide-y divide-gray-100">
                    {store.items.map(item => (
                      <div key={item.id} className="p-4 flex gap-4">
                        <div className="w-20 h-20 bg-gray-100 rounded-md overflow-hidden">
                          <img 
                            src={item.produto?.imagem_url || 'https://via.placeholder.com/80'} 
                            alt={item.produto?.nome} 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/80';
                            }}
                          />
                        </div>
                        
                        <div className="flex-1">
                          <h3 className="font-medium">{item.produto?.nome}</h3>
                          <div className="flex justify-between mt-2">
                            <div>
                              <p className="text-construPro-blue font-bold">
                                R$ {item.subtotal.toFixed(2)}
                              </p>
                              <p className="text-xs text-gray-500">
                                {item.quantidade} x R$ {item.preco.toFixed(2)}
                              </p>
                              <div className="bg-construPro-orange/10 text-construPro-orange text-xs rounded-full px-2 py-0.5 inline-block mt-1">
                                {item.produto?.pontos || 0} pontos
                              </div>
                            </div>
                            
                            <div className="flex flex-col items-end">
                              <button 
                                onClick={() => handleRemoveItem(item.id)} 
                                className="text-red-500 mb-2"
                                disabled={processingItem === item.id}
                              >
                                <Trash2 size={16} />
                              </button>
                              
                              <div className="flex items-center border border-gray-300 rounded-md">
                                <button
                                  onClick={() => handleUpdateQuantity(item, item.quantidade - 1)}
                                  className="w-8 h-8 flex items-center justify-center text-gray-600"
                                  disabled={processingItem === item.id || item.quantidade <= 1}
                                >
                                  <Minus size={14} />
                                </button>
                                <span className="w-8 text-center">
                                  {processingItem === item.id ? "..." : item.quantidade}
                                </span>
                                <button
                                  onClick={() => handleUpdateQuantity(item, item.quantidade + 1)}
                                  className="w-8 h-8 flex items-center justify-center text-gray-600"
                                  disabled={processingItem === item.id || item.quantidade >= (item.produto?.estoque || 0)}
                                >
                                  <Plus size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Store shipping */}
                    <div className="p-3 bg-gray-50">
                      <div className="flex justify-between text-sm">
                        <span>Frete para esta loja</span>
                        <span>R$ 15,90</span>
                      </div>
                    </div>
                  </Card>
                </div>
              ))}
              
              {/* Coupon code section */}
              <Card className="p-4">
                <h3 className="text-sm font-medium mb-3">Cupom de desconto</h3>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-green-50 p-3 rounded-md">
                    <div className="flex items-center">
                      <Ticket size={18} className="text-green-600 mr-2" />
                      <div>
                        <p className="text-sm font-medium">{appliedCoupon.code.toUpperCase()}</p>
                        <p className="text-xs text-green-600">Desconto de {appliedCoupon.discount}% aplicado</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={removeCoupon} className="h-8">
                      Remover
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Digite seu cupom"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="flex-1"
                    />
                    <Button onClick={applyCoupon}>Aplicar</Button>
                  </div>
                )}
              </Card>
            </div>
          </div>
          
          {/* Cart Summary */}
          <div className="bg-white p-6 shadow-md">
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span>R$ {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Frete</span>
                <span>R$ {shipping.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Desconto</span>
                  <span>-R$ {discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>R$ {total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-construPro-orange text-sm">
                <span>Pontos a ganhar</span>
                <span>{totalPoints} pontos</span>
              </div>
            </div>
            
            <CustomButton 
              variant="primary" 
              fullWidth
              onClick={() => navigate('/checkout')}
            >
              Finalizar Compra
            </CustomButton>
          </div>
        </>
      )}
    </div>
  );
};

export default CartScreen;
