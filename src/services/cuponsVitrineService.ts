
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
    console.log('🔍 [cuponsVitrineService] Fetching all cupons...');
    
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('❌ [cuponsVitrineService] Error fetching cupons:', error);
      toast.error('Erro ao carregar cupons');
      return [];
    }
    
    console.log(`✅ [cuponsVitrineService] Retrieved ${data?.length || 0} cupons total`);
    
    // Transform the data to match our interface
    const transformedData = (data || []).map(item => ({
      ...item,
      discount_type: item.discount_type as 'percentage' | 'fixed'
    }));
    
    return transformedData;
  } catch (error) {
    console.error('❌ [cuponsVitrineService] Exception in fetchCuponsVitrine:', error);
    toast.error('Erro ao carregar cupons');
    return [];
  }
};

export const toggleShowInVitrine = async (couponId: string, showInVitrine: boolean): Promise<boolean> => {
  try {
    console.log(`🔄 [cuponsVitrineService] Toggling show_in_vitrine for coupon ${couponId} to ${showInVitrine}`);
    
    const { error } = await supabase
      .from('coupons')
      .update({ show_in_vitrine: showInVitrine })
      .eq('id', couponId);
      
    if (error) {
      console.error('❌ [cuponsVitrineService] Error updating show_in_vitrine:', error);
      toast.error('Erro ao atualizar cupom');
      return false;
    }
    
    console.log(`✅ [cuponsVitrineService] Successfully toggled show_in_vitrine for coupon ${couponId}`);
    toast.success(`Cupom ${showInVitrine ? 'adicionado à' : 'removido da'} vitrine`);
    return true;
  } catch (error) {
    console.error('❌ [cuponsVitrineService] Exception in toggleShowInVitrine:', error);
    toast.error('Erro ao atualizar cupom');
    return false;
  }
};

export const fetchCuponsPublicos = async (): Promise<CupomVitrine[]> => {
  try {
    console.log('🔍 [cuponsVitrineService] Fetching public cupons...');
    
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('active', true)
      .eq('show_in_vitrine', true)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('❌ [cuponsVitrineService] Error fetching public coupons:', error);
      toast.error('Erro ao carregar cupons públicos');
      return [];
    }
    
    console.log(`✅ [cuponsVitrineService] Retrieved ${data?.length || 0} public cupons`);
    
    // Transform the data to match our interface
    const transformedData = (data || []).map(item => ({
      ...item,
      discount_type: item.discount_type as 'percentage' | 'fixed'
    }));
    
    return transformedData;
  } catch (error) {
    console.error('❌ [cuponsVitrineService] Exception in fetchCuponsPublicos:', error);
    toast.error('Erro ao carregar cupons públicos');
    return [];
  }
};

// Função para criar cupons de exemplo para teste
export const createSampleCupons = async (): Promise<boolean> => {
  try {
    console.log('🔄 [cuponsVitrineService] Creating sample cupons...');
    
    const sampleCupons = [
      {
        code: 'WELCOME10',
        name: 'Cupom de Boas-vindas',
        description: 'Ganhe 10% de desconto na sua primeira compra!',
        discount_type: 'percentage',
        discount_value: 10,
        active: true,
        show_in_vitrine: true,
        min_order_value: 50,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 dias
      },
      {
        code: 'SAVE20',
        name: 'Desconto Especial',
        description: 'R$ 20 de desconto em compras acima de R$ 100',
        discount_type: 'fixed',
        discount_value: 20,
        active: true,
        show_in_vitrine: true,
        min_order_value: 100,
        expires_at: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString() // 15 dias
      },
      {
        code: 'PREMIUM15',
        name: 'Cupom Premium',
        description: '15% de desconto para clientes especiais',
        discount_type: 'percentage',
        discount_value: 15,
        active: true,
        show_in_vitrine: true,
        min_order_value: 200,
        expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString() // 60 dias
      }
    ];
    
    const { error } = await supabase
      .from('coupons')
      .insert(sampleCupons);
      
    if (error) {
      console.error('❌ [cuponsVitrineService] Error creating sample cupons:', error);
      return false;
    }
    
    console.log('✅ [cuponsVitrineService] Sample cupons created successfully');
    return true;
  } catch (error) {
    console.error('❌ [cuponsVitrineService] Exception in createSampleCupons:', error);
    return false;
  }
};
