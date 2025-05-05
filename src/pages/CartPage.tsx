
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Trash2 } from 'lucide-react';
import { useCart } from '@/hooks/use-cart';

const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { cart, cartItems, updateQuantity, removeItem } = useCart();
  const [isUpdating, setIsUpdating] = useState<Record<string, boolean>>({});

  // If cart is empty or loading
  if (!cart || !cartItems || cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Seu Carrinho</h1>
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-600 mb-4">Seu carrinho está vazio.</p>
          <Button onClick={() => navigate('/')}>Continuar Comprando</Button>
        </div>
      </div>
    );
  }

  const handleRemoveItem = async (itemId: string) => {
    setIsUpdating(prev => ({ ...prev, [itemId]: true }));
    try {
      await removeItem(itemId);
    } catch (error) {
      console.error('Failed to remove item:', error);
    } finally {
      setIsUpdating(prev => ({ ...prev, [itemId]: false }));
    }
  };

  const handleQuantityChange = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    setIsUpdating(prev => ({ ...prev, [itemId]: true }));
    try {
      await updateQuantity(itemId, newQuantity);
    } catch (error) {
      console.error('Failed to update quantity:', error);
    } finally {
      setIsUpdating(prev => ({ ...prev, [itemId]: false }));
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Seu Carrinho</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          {cartItems.map((item) => (
            <div key={item.id} className="bg-white p-4 rounded-lg shadow mb-4 flex items-start">
              <div className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded overflow-hidden mr-4">
                <img 
                  src={item.produto?.imagem_url} 
                  alt={item.produto?.nome} 
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="flex-grow">
                <h3 className="font-medium text-gray-900">{item.produto?.nome}</h3>
                <p className="text-sm text-gray-500">
                  Vendido por: {item.produto?.loja_id || "Loja"}
                </p>
                
                <div className="flex items-center mt-2">
                  <button
                    className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center"
                    onClick={() => handleQuantityChange(item.id, item.quantidade - 1)}
                    disabled={isUpdating[item.id]}
                  >
                    -
                  </button>
                  <span className="mx-3">{item.quantidade}</span>
                  <button
                    className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center"
                    onClick={() => handleQuantityChange(item.id, item.quantidade + 1)}
                    disabled={isUpdating[item.id]}
                  >
                    +
                  </button>
                </div>
              </div>
              
              <div className="flex flex-col items-end ml-4">
                <span className="font-medium text-gray-900">
                  R$ {(item.produto?.preco * item.quantidade).toFixed(2)}
                </span>
                
                <button
                  onClick={() => handleRemoveItem(item.id)}
                  className="text-red-500 mt-2 flex items-center text-sm"
                  disabled={isUpdating[item.id]}
                >
                  <Trash2 size={16} className="mr-1" />
                  Remover
                </button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="md:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow sticky top-4">
            <h2 className="text-lg font-semibold mb-4">Resumo do pedido</h2>
            
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span>Subtotal ({cartItems.length} itens)</span>
                <span>R$ {cart.summary?.subtotal?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex justify-between">
                <span>Frete</span>
                <span>{cart.summary?.shipping ? `R$ ${cart.summary.shipping.toFixed(2)}` : 'Grátis'}</span>
              </div>
              
              <Separator className="my-2" />
              
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>R$ {(cart.summary?.subtotal + (cart.summary?.shipping || 0)).toFixed(2) || '0.00'}</span>
              </div>
            </div>
            
            <Button 
              className="w-full bg-green-600 hover:bg-green-700" 
              onClick={() => navigate('/checkout')}
            >
              Finalizar Compra
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
