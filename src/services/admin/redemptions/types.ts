
import { supabase } from '@/integrations/supabase/client';

// Define and export the shared types
export type AdminRedemption = {
  id: string;
  cliente_id: string;
  cliente_nome?: string;
  item: string;
  pontos: number;
  imagem_url: string | null;
  codigo: string | null;
  status: "recusado" | "pendente" | "aprovado" | "entregue";
  data: string;
  created_at: string;
  updated_at: string;
};

// Cache configuration
export type RedemptionsCache = {
  data: AdminRedemption[] | null;
  timestamp: number;
};

// Duration for cache validity in milliseconds
export const CACHE_DURATION = 60000; // 1 minute cache
