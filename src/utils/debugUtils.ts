
import { supabase } from '@/integrations/supabase/client';

export const debugUserData = async (userId: string) => {
  console.log('🔍 [debugUtils] Starting debug for user:', userId);
  
  try {
    // Check user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
      
    console.log('👤 [debugUtils] User profile:', profile);
    if (profileError) {
      console.error('❌ [debugUtils] Profile error:', profileError);
    }
    
    // Check points transactions
    const { data: transactions, error: transactionsError } = await supabase
      .from('points_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('data', { ascending: false });
      
    console.log('💰 [debugUtils] Points transactions:', transactions);
    if (transactionsError) {
      console.error('❌ [debugUtils] Transactions error:', transactionsError);
    }
    
    // Check public coupons
    const { data: coupons, error: couponsError } = await supabase
      .from('coupons')
      .select('*')
      .eq('active', true)
      .eq('show_in_vitrine', true);
      
    console.log('🎫 [debugUtils] Public coupons:', coupons);
    if (couponsError) {
      console.error('❌ [debugUtils] Coupons error:', couponsError);
    }
    
    // Check user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('🔐 [debugUtils] Auth user:', user);
    if (authError) {
      console.error('❌ [debugUtils] Auth error:', authError);
    }
    
    return {
      profile,
      transactions,
      coupons,
      user,
      errors: {
        profileError,
        transactionsError,
        couponsError,
        authError
      }
    };
  } catch (error) {
    console.error('❌ [debugUtils] Exception in debugUserData:', error);
    return null;
  }
};

export const logComponentMount = (componentName: string, props?: any) => {
  console.log(`🚀 [${componentName}] Component mounted`, props ? { props } : '');
};

export const logComponentUnmount = (componentName: string) => {
  console.log(`🛑 [${componentName}] Component unmounted`);
};

export const logDataFetch = (serviceName: string, data: any, error?: any) => {
  if (error) {
    console.error(`❌ [${serviceName}] Data fetch error:`, error);
  } else {
    console.log(`✅ [${serviceName}] Data fetched successfully:`, data);
  }
};

// Function to be called from browser console for debugging
(window as any).debugUserData = debugUserData;
