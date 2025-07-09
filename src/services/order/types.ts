
export interface ProductData {
  id: string;
  nome: string;
  imagens: string[];
  imagem_url: string | null;
  descricao: string;
  preco_normal: number;
  categoria: string;
  unidade_medida: string;
  preco_promocional?: number; // Add this missing field
}

export interface VendorInfo {
  id: string;
  nome_loja: string;
  logo?: string;
  telefone?: string;
}

export interface OrderItem {
  id: string;
  produto_id: string;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
  produto?: ProductData;
  vendedor_id?: string;
  vendedor?: VendorInfo;
  valor_frete?: number;
  desconto_cupom?: number;
  // NOVOS CAMPOS PARA STATUS POR VENDEDOR
  vendor_status?: string;
  vendor_status_info?: {
    status: string;
    created_at: string;
    vendor_info: VendorInfo;
  };
}

export interface ShippingInfo {
  vendedor_id: string;
  valor_frete: number;
  prazo_entrega?: string;
  zona_entrega?: string;
  zone_name?: string;
  desconto_cupom?: number;
  // NOVOS CAMPOS PARA STATUS POR VENDEDOR
  vendor_status?: string;
  vendor_status_info?: {
    status: string;
    created_at: string;
    vendor_info: VendorInfo;
  };
}

export interface OrderData {
  id: string;
  cliente_id: string;
  status: string;
  valor_total: number;
  forma_pagamento: string;
  endereco_entrega: any;
  created_at: string;
  cupom_codigo?: string;
  desconto_aplicado?: number;
  pontos_ganhos?: number;
  items?: OrderItem[];
  valor_produtos?: number;
  valor_frete_total?: number;
  shipping_info?: ShippingInfo[];
  // NOVO CAMPO PARA AGRUPAR STATUS POR VENDEDOR
  vendor_statuses?: Record<string, {
    status: string;
    created_at: string;
    vendor_info: VendorInfo;
  }>;
}

// ADD MISSING TYPES FOR CREATE ORDER
export interface CreateOrderPayload {
  items: Array<{
    produto_id: string;
    quantidade: number;
    preco: number;
    subtotal?: number;
  }>;
  endereco_entrega: {
    rua: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
    ponto_referencia?: string;
  };
  valor_total: number;
  forma_pagamento: string;
  pontos_ganhos?: number;
  cupom_aplicado?: {
    code: string;
    discount: number;
  };
  desconto?: number;
}

export interface OrderResponse {
  success: boolean;
  order?: {
    id: string;
  };
  error?: string;
}
