
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
    
    // Check cart data
    const { data: cart, error: cartError } = await supabase
      .from('carts')
      .select('*, cart_items(*)')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();
      
    console.log('🛒 [debugUtils] Cart data:', cart);
    if (cartError) {
      console.error('❌ [debugUtils] Cart error:', cartError);
    }
    
    return {
      profile,
      transactions,
      coupons,
      user,
      cart,
      errors: {
        profileError,
        transactionsError,
        couponsError,
        authError,
        cartError
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

// System health check
export const performSystemHealthCheck = async () => {
  console.log('🏥 [debugUtils] Performing system health check...');
  
  const health = {
    auth: false,
    database: false,
    cache: false,
    timestamp: new Date().toISOString()
  };
  
  try {
    // Test auth
    const { data: { user } } = await supabase.auth.getUser();
    health.auth = !!user;
    
    // Test database
    const { data: testQuery } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    health.database = !!testQuery;
    
    // Test cache
    const { data: cacheTest } = await supabase
      .from('zip_cache')
      .select('cep')
      .limit(1);
    health.cache = !!cacheTest;
    
  } catch (error) {
    console.error('❌ [debugUtils] Health check error:', error);
  }
  
  console.log('🏥 [debugUtils] System health:', health);
  return health;
};

// Enhanced error reporting
export const reportError = (error: Error, context: string, additionalData?: any) => {
  console.error(`🚨 [debugUtils] Error in ${context}:`, {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    context,
    additionalData,
    userAgent: navigator.userAgent,
    url: window.location.href
  });
};

// Function to be called from browser console for debugging
(window as any).debugUserData = debugUserData;
(window as any).performSystemHealthCheck = performSystemHealthCheck;
(window as any).reportError = reportError;
