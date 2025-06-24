
import { supabase } from '@/integrations/supabase/client';

/**
 * Força a correção do CEP 39688-000 para Angelândia-MG
 */
export async function forceCepCorrection(): Promise<void> {
  try {
    console.log('[cepCorrection] 🔧 Forçando correção do CEP 39688-000 para Angelândia-MG');
    
    // Deletar entrada incorreta se existir
    await supabase
      .from('zip_cache')
      .delete()
      .eq('cep', '39688000');
    
    // Inserir dados corretos
    const { error } = await supabase
      .from('zip_cache')
      .insert({
        cep: '39688000',
        logradouro: 'Endereço não especificado',
        bairro: 'Centro',
        localidade: 'Angelândia',
        uf: 'MG',
        ibge: '3102803',
        cached_at: new Date().toISOString(),
      });
    
    if (error) {
      console.error('[cepCorrection] ❌ Erro ao corrigir CEP:', error);
      throw error;
    }
    
    console.log('[cepCorrection] ✅ CEP 39688-000 corrigido para Angelândia-MG no cache');
  } catch (error) {
    console.error('[cepCorrection] 💥 Erro na correção do CEP:', error);
    throw error;
  }
}

/**
 * Verifica se o CEP 39688-000 está correto no cache
 */
export async function verifyCepCorrection(): Promise<{ correct: boolean; currentCity: string | null }> {
  try {
    const { data, error } = await supabase
      .from('zip_cache')
      .select('localidade')
      .eq('cep', '39688000')
      .single();
    
    if (error) {
      console.error('[cepCorrection] Erro ao verificar CEP:', error);
      return { correct: false, currentCity: null };
    }
    
    const isCorrect = data?.localidade === 'Angelândia';
    console.log('[cepCorrection] Verificação:', {
      cep: '39688-000',
      currentCity: data?.localidade,
      isCorrect
    });
    
    return { correct: isCorrect, currentCity: data?.localidade || null };
  } catch (error) {
    console.error('[cepCorrection] Erro na verificação:', error);
    return { correct: false, currentCity: null };
  }
}

// Executar correção automaticamente na inicialização
if (typeof window !== 'undefined') {
  verifyCepCorrection().then(async ({ correct, currentCity }) => {
    if (!correct) {
      console.log('[cepCorrection] CEP precisa de correção. Cidade atual:', currentCity);
      await forceCepCorrection();
    } else {
      console.log('[cepCorrection] CEP já está correto:', currentCity);
    }
  }).catch(console.error);
}
