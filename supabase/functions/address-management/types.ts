
export interface Address {
  id?: string;
  nome: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  principal: boolean;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface RequestContext {
  supabaseClient: any;
  user: any;
  corsHeaders: Record<string, string>;
}
