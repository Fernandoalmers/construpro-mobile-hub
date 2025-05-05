
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from '@/components/ui/sonner';
import { useCart } from '@/hooks/use-cart';
import { Separator } from '@/components/ui/separator';

export default function CartPage() {
  const { cartItems, removeItem, updateQuantity, isLoading, cart } = useCart();
  const navigate = useNavigate();

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      toast.warning("Seu carrinho está vazio");
      return;
    }
    navigate("/checkout");
  };

  // Calculate totals
  const subtotal = cartItems.reduce((acc, item) => {
    return acc + (item.preco || 0) * (item.quantidade || 0);
  }, 0);
  
  const shipping = 0; // Free shipping or calculate based on your logic
  const total = subtotal + shipping;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">Carrinho de Compras</h1>
      <p className="text-gray-500 mb-6">{cartItems.length} itens no seu carrinho</p>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : cartItems.length === 0 ? (
        <div className="text-center py-12 space-y-4">
          <ShoppingBag className="mx-auto h-16 w-16 text-gray-300" />
          <p className="text-gray-600 text-lg">Seu carrinho está vazio.</p>
          <Button onClick={() => navigate('/marketplace')}>
            Continuar comprando
          </Button>
        </div>
      ) : (
        <div className="lg:grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <Card key={item.id} className="p-4">
                <div className="flex gap-4">
                  {item.produto?.imagem_url ? (
                    <img 
                      src={item.produto.imagem_url} 
                      alt={item.produto?.nome} 
                      className="w-20 h-20 object-cover rounded-md"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/80';
                      }}
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gray-200 rounded-md flex items-center justify-center">
                      <ShoppingBag className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <h3 className="font-medium">{item.produto?.nome || 'Produto'}</h3>
                    <p className="text-sm text-gray-500">
                      {/* Use the loja_id as a fallback */}
                      Vendedor: {item.produto?.loja_id || 'Loja'}
                    </p>
                    
                    <div className="flex justify-between items-center mt-2">
                      <div className="flex items-center">
                        <button 
                          className="w-8 h-8 rounded-l border border-gray-300 flex items-center justify-center disabled:opacity-50"
                          onClick={() => updateQuantity(item.id, Math.max(1, (item.quantidade || 1) - 1))}
                          disabled={isLoading || (item.quantidade || 0) <= 1}
                        >
                          -
                        </button>
                        <div className="w-12 h-8 border-t border-b border-gray-300 flex items-center justify-center">
                          {item.quantidade || 1}
                        </div>
                        <button 
                          className="w-8 h-8 rounded-r border border-gray-300 flex items-center justify-center disabled:opacity-50"
                          onClick={() => updateQuantity(item.id, (item.quantidade || 1) + 1)}
                          disabled={isLoading || (item.quantidade || 0) >= (item.produto?.estoque || 99)}
                        >
                          +
                        </button>
                      </div>
                      
                      <div className="text-right">
                        <p className="font-semibold">
                          R$ {((item.preco || 0) * (item.quantidade || 1)).toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">
                          R$ {(item.preco || 0).toFixed(2)} cada
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 flex justify-end">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => removeItem(item.id)}
                    disabled={isLoading}
                  >
                    <Trash className="h-4 w-4 mr-1" />
                    Remover
                  </Button>
                </div>
              </Card>
            ))}
            
            <div className="mt-6">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate('/marketplace')}
              >
                Continuar comprando
              </Button>
            </div>
          </div>
          
          <div className="mt-8 lg:mt-0">
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Resumo do Pedido</h3>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>R$ {subtotal.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Frete</span>
                  <span>{shipping > 0 ? `R$ ${shipping.toFixed(2)}` : 'Grátis'}</span>
                </div>
                
                {cart?.summary?.totalPoints > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Pontos a receber</span>
                    <span>+{cart.summary.totalPoints} pts</span>
                  </div>
                )}
                
                <Separator className="my-2" />
                
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>R$ {total.toFixed(2)}</span>
                </div>
              </div>
              
              <Button 
                className="w-full mt-6 bg-green-600 hover:bg-green-700"
                onClick={handleCheckout}
                disabled={isLoading || cartItems.length === 0}
              >
                Prosseguir para Checkout
              </Button>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
