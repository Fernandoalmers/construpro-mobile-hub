
// Types for vendor products management
export interface VendorProduct {
  id: string;
  vendedor_id: string;
  nome: string;
  descricao: string;
  preco_normal: number;
  preco_promocional?: number;
  estoque: number;
  codigo_barras?: string;
  sku?: string;
  segmento?: string;
  categoria: string;
  pontos_profissional: number;
  pontos_consumidor: number;
  imagens?: string[];
  status: 'pendente' | 'aprovado' | 'inativo';
  created_at?: string;
  updated_at?: string;
  segmento_id?: string | null;
  // Add imagemPrincipal for consistency with marketplace product display
  imagemPrincipal?: string;
}

// Partial product type for updates and creation
export type VendorProductInput = Partial<VendorProduct>;
