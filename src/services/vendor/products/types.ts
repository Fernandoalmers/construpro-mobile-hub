
// Define the vendor product interface that matches the database schema
export interface VendorProduct {
  id: string;
  vendedor_id: string;
  nome: string;
  descricao: string;
  preco_normal: number;
  preco_promocional: number | null;
  estoque: number;
  codigo_barras?: string;
  sku?: string;
  segmento?: string | null;
  segmento_id?: string | null;
  categoria: string;
  pontos_profissional: number;
  pontos_consumidor: number;
  imagens?: string[];
  status: 'pendente' | 'aprovado' | 'rejeitado' | 'inativo';
  created_at?: string;
  updated_at?: string;
}

// Interface for product input when creating/updating
export interface VendorProductInput {
  id?: string;
  nome: string;
  descricao: string;
  segmento?: string | null;
  segmento_id?: string | null;
  categoria: string; // Making this required to match database constraints
  preco_normal: number;
  preco_promocional?: number | null;
  estoque: number;
  pontos_consumidor: number;
  pontos_profissional: number;
  imagens?: string[];
  status?: 'pendente' | 'aprovado' | 'rejeitado' | 'inativo';
}

// Define ProductImage interface so we can export it
export interface ProductImage {
  id: string;
  url: string;
  product_id: string;
  ordem?: number;
  is_primary?: boolean;
}
