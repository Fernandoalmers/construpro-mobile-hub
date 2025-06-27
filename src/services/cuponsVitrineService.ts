
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

export interface CupomVitrine {
  id: string;
  code: string;
  name: string;
  description?: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  expires_at?: string;
  active: boolean;
  show_in_vitrine: boolean;
  created_at: string;
}

export const fetchCuponsVitrine = async (): Promise<CupomVitrine[]> => {
  try {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching cupons vitrine:', error);
      toast.error('Erro ao carregar cupons');
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching cupons vitrine:', error);
    toast.error('Erro ao carregar cupons');
    return [];
  }
};

export const toggleShowInVitrine = async (couponId: string, showInVitrine: boolean): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('coupons')
      .update({ show_in_vitrine: showInVitrine })
      .eq('id', couponId);
      
    if (error) {
      console.error('Error updating show_in_vitrine:', error);
      toast.error('Erro ao atualizar cupom');
      return false;
    }
    
    toast.success(`Cupom ${showInVitrine ? 'adicionado à' : 'removido da'} vitrine`);
    return true;
  } catch (error) {
    console.error('Error updating show_in_vitrine:', error);
    toast.error('Erro ao atualizar cupom');
    return false;
  }
};

export const fetchCuponsPublicos = async (): Promise<CupomVitrine[]> => {
  try {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('active', true)
      .eq('show_in_vitrine', true)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching public coupons:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching public coupons:', error);
    return [];
  }
};
