
export interface VendorProduct {
  id: string;
  nome: string;
  descricao: string;
  categoria: string;
  segmento?: string;
  segmento_id?: string;
  preco_normal: number;
  preco_promocional?: number;
  pontos_consumidor: number;
  pontos_profissional: number;
  estoque: number;
  sku?: string;
  codigo_barras?: string;
  imagens: string[];
  vendedor_id: string;
  status: 'pendente' | 'aprovado' | 'rejeitado' | 'inativo';
  created_at: string;
  updated_at: string;
}

export interface VendorProductInput {
  id?: string;
  nome: string;
  descricao: string;
  categoria: string;
  segmento?: string;
  segmento_id?: string;
  preco_normal: number;
  preco_promocional?: number | null;
  pontos_consumidor: number;
  pontos_profissional: number;
  estoque: number;
  sku?: string;
  codigo_barras?: string;
  imagens: string[];
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  ordem: number;
  is_primary: boolean;
  created_at: string;
}
