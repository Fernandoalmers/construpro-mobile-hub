
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
    imagens?: string[]; // Array de imagens do produto
    estoque: number;
    loja_id: string;
    pontos: number;
    preco_normal?: number;
    preco_promocional?: number;
    pontos_profissional?: number;
    pontos_consumidor?: number;
    categoria?: string;
    segmento?: string;
    status?: string;
  };
  cart_id?: string;
  created_at?: string;
  updated_at?: string;
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
  cartItems: CartItem[];
  isLoading: boolean;
  addToCart: (productId: string, quantity: number) => Promise<void>;
  updateQuantity: (cartItemId: string, newQuantity: number) => Promise<void>;
  removeItem: (cartItemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}
