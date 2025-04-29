
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomButton from '../common/CustomButton';
import Card from '../common/Card';
import ListEmptyState from '../common/ListEmptyState';
import { ArrowLeft, ShoppingBag, Trash2, Plus, Minus } from 'lucide-react';
import produtos from '../../data/produtos.json';
import lojas from '../../data/lojas.json';

// Mock cart items - in a real app, this would come from a cart state or context
const mockCartItems = [
  { produtoId: '1', quantidade: 1 },
  { produtoId: '3', quantidade: 2 },
];

const CartScreen: React.FC = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState(mockCartItems);

  const cartProducts = cartItems.map(item => {
    const produto = produtos.find(p => p.id === item.produtoId);
    const loja = produto ? lojas.find(l => l.id === produto.lojaId) : undefined;
    return {
      ...item,
      produto,
      loja,
    };
  }).filter(item => item.produto && item.loja);

  // Group items by store
  const itemsByStore = cartProducts.reduce((groups, item) => {
    const storeId = item.loja?.id;
    if (!storeId) return groups;
    
    if (!groups[storeId]) {
      groups[storeId] = {
        loja: item.loja,
        items: []
      };
    }
    
    groups[storeId].items.push(item);
    return groups;
  }, {} as Record<string, { loja: any, items: typeof cartProducts }>);

  const updateQuantity = (produtoId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    const produto = produtos.find(p => p.id === produtoId);
    if (!produto || newQuantity > produto.estoque) return;
    
    setCartItems(prev => 
      prev.map(item => 
        item.produtoId === produtoId ? { ...item, quantidade: newQuantity } : item
      )
    );
  };

  const removeItem = (produtoId: string) => {
    setCartItems(prev => prev.filter(item => item.produtoId !== produtoId));
  };

  // Calculate totals
  const subtotal = cartProducts.reduce((sum, item) => {
    return sum + (item.produto?.preco || 0) * item.quantidade;
  }, 0);
  
  const totalPoints = cartProducts.reduce((sum, item) => {
    return sum + (item.produto?.pontos || 0) * item.quantidade;
  }, 0);
  
  const frete = 15.90;
  const total = subtotal + frete;

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 pb-20">
      {/* Header */}
      <div className="bg-white p-4 flex items-center shadow-sm">
        <button onClick={() => navigate(-1)} className="mr-4">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold">Carrinho de Compras</h1>
      </div>

      {cartItems.length === 0 ? (
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
                      src={store.loja.logoUrl} 
                      alt={store.loja.nome} 
                      className="w-6 h-6 rounded-full object-cover mr-2"
                    />
                    <h2 className="font-bold">{store.loja.nome}</h2>
                  </div>
                  
                  <Card className="divide-y divide-gray-100">
                    {store.items.map(item => (
                      <div key={item.produtoId} className="p-4 flex gap-4">
                        <div className="w-20 h-20 bg-gray-100 rounded-md overflow-hidden">
                          <img 
                            src={item.produto?.imagemUrl} 
                            alt={item.produto?.nome} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        
                        <div className="flex-1">
                          <h3 className="font-medium">{item.produto?.nome}</h3>
                          <div className="flex justify-between mt-2">
                            <div>
                              <p className="text-construPro-blue font-bold">
                                R$ {((item.produto?.preco || 0) * item.quantidade).toFixed(2)}
                              </p>
                              <p className="text-xs text-gray-500">
                                {item.quantidade} x R$ {item.produto?.preco.toFixed(2)}
                              </p>
                              <div className="bg-construPro-orange/10 text-construPro-orange text-xs rounded-full px-2 py-0.5 inline-block mt-1">
                                {(item.produto?.pontos || 0) * item.quantidade} pontos
                              </div>
                            </div>
                            
                            <div className="flex flex-col items-end">
                              <button 
                                onClick={() => removeItem(item.produtoId)} 
                                className="text-red-500 mb-2"
                              >
                                <Trash2 size={16} />
                              </button>
                              
                              <div className="flex items-center border border-gray-300 rounded-md">
                                <button
                                  onClick={() => updateQuantity(item.produtoId, item.quantidade - 1)}
                                  className="w-8 h-8 flex items-center justify-center text-gray-600"
                                >
                                  <Minus size={14} />
                                </button>
                                <span className="w-8 text-center">{item.quantidade}</span>
                                <button
                                  onClick={() => updateQuantity(item.produtoId, item.quantidade + 1)}
                                  className="w-8 h-8 flex items-center justify-center text-gray-600"
                                >
                                  <Plus size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </Card>
                </div>
              ))}
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
                <span>R$ {frete.toFixed(2)}</span>
              </div>
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
