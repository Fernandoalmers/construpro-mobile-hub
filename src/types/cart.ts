
export interface CartItem {
  id: string;
  produto_id: string;
  quantidade: number;
  preco: number;
  subtotal: number;
  produto?: {
    id: string;
    nome: string;
    preco: number;
    imagem_url: string;
    estoque: number;
    loja_id: string;
    pontos: number;
  };
}

export interface Cart {
  id: string;
  user_id: string;
  items: CartItem[];
  summary: {
    subtotal: number;
    shipping: number;
    totalItems: number;
    totalPoints: number;
  };
  stores?: {
    id: string;
    nome: string;
    logo_url: string;
  }[];
}

export interface CartContextType {
  cart: Cart | null;
  cartCount: number;
  isLoading: boolean;
  addToCart: (productId: string, quantity: number) => Promise<void>;
  updateQuantity: (cartItemId: string, newQuantity: number) => Promise<void>;
  removeItem: (cartItemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}
