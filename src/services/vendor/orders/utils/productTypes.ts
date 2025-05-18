
// Define types for product data
export interface ProductData {
  id: string;
  nome: string;
  preco_normal?: number;
  preco?: number;
  imagens?: any[];
  imagem_url?: string;
  descricao?: string;
  categoria?: string;
}
