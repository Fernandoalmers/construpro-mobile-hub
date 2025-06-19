
export interface VendorProduct {
  id: string;
  nome: string;
  descricao: string;
  categoria: string;
  preco_normal: number;
  preco_promocional?: number;
  promocao_ativa?: boolean;
  promocao_inicio?: string;
  promocao_fim?: string;
  estoque: number;
  imagens?: string[];
  status: 'pendente' | 'aprovado' | 'rejeitado';
  pontos_consumidor: number;
  pontos_profissional: number;
  vendedor_id: string;
  segmento_id?: string;
  segmento?: string;
  sku?: string;
  codigo_barras?: string;
  created_at?: string;
  updated_at?: string;
}

export interface VendorProductInput {
  id?: string;
  nome: string;
  descricao: string;
  categoria: string;
  preco_normal: number;
  preco_promocional?: number | null;
  promocao_ativa?: boolean;
  promocao_inicio?: string | null;
  promocao_fim?: string | null;
  estoque: number;
  imagens?: string[];
  status?: 'pendente' | 'aprovado' | 'rejeitado';
  pontos_consumidor: number;
  pontos_profissional: number;
  segmento_id?: string | null;
  segmento?: string;
  sku?: string;
  codigo_barras?: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  is_primary: boolean;
  ordem: number;
  created_at: string;
}
