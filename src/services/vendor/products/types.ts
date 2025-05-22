
import type { Json } from '@/integrations/supabase/types';

export interface VendorProduct {
  id: string;
  nome: string;
  descricao: string;
  categoria: string;
  segmento?: string | null;
  segmento_id?: string | null;
  preco_normal: number;
  preco_promocional?: number | null;
  estoque: number;
  pontos_consumidor: number;
  pontos_profissional: number;
  imagens: string[] | Json;
  vendedor_id: string;
  status: 'pendente' | 'aprovado' | 'rejeitado' | 'inativo';
  codigo_barras?: string | null;
  sku?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface VendorProductInput {
  id?: string;
  nome: string;
  descricao: string;
  categoria: string;
  segmento?: string | null;
  segmento_id?: string | null;
  preco_normal: number;
  preco_promocional?: number | null;
  estoque: number;
  pontos_consumidor: number;
  pontos_profissional: number;
  imagens?: string[];
  status?: 'pendente' | 'aprovado' | 'rejeitado' | 'inativo';
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  ordem: number;
  is_primary: boolean;
  created_at: string;
}
