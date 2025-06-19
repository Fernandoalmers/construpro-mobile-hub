
export interface CartItem {
  id: string;
  user_id: string;
  produto_id: string;
  quantidade: number;
  preco: number;
  subtotal: number;
  created_at: string;
  updated_at: string;
  produto?: {
    id: string;
    nome: string;
    preco: number;
    imagem_url: string;
    imagens?: string[];
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
    promocao_ativa?: boolean;
    promocao_inicio?: string;
    promocao_fim?: string;
  };
}

export interface Cart {
  id: string;
  user_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  items?: CartItem[];
  summary?: {
    subtotal: number;
    totalItems: number;
    totalPoints: number;
  };
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
