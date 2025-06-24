
import { supabase } from '@/integrations/supabase/client';

/**
 * Força a correção do CEP 39688-000 para Angelândia-MG
 * VERSÃO CORRIGIDA - Anteriormente estava sendo salvo como Setubinha incorretamente
 */
export async function forceCepCorrection(): Promise<void> {
  try {
    console.log('[cepCorrection] 🔧 CORRIGINDO CEP 39688-000 para Angelândia-MG (anteriormente estava como Setubinha)');
    
    // Deletar TODAS as entradas incorretas para este CEP
    await supabase
      .from('zip_cache')
      .delete()
      .eq('cep', '39688000');
    
    console.log('[cepCorrection] 🗑️ Entrada anterior (Setubinha) deletada');
    
    // Inserir dados CORRETOS para Angelândia-MG
    const { error } = await supabase
      .from('zip_cache')
      .insert({
        cep: '39688000',
        logradouro: 'Endereço não especificado',
        bairro: 'Centro',
        localidade: 'Angelândia', // CORRIGIDO: era Setubinha, agora é Angelândia
        uf: 'MG',
        ibge: '3102803', // Código IBGE correto para Angelândia-MG
        cached_at: new Date().toISOString(),
      });
    
    if (error) {
      console.error('[cepCorrection] ❌ Erro ao corrigir CEP:', error);
      throw error;
    }
    
    console.log('[cepCorrection] ✅ CEP 39688-000 CORRIGIDO para Angelândia-MG no cache Supabase');
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
      .select('localidade, ibge')
      .eq('cep', '39688000')
      .single();
    
    if (error) {
      console.error('[cepCorrection] Erro ao verificar CEP:', error);
      return { correct: false, currentCity: null };
    }
    
    const isCorrect = data?.localidade === 'Angelândia' && data?.ibge === '3102803';
    console.log('[cepCorrection] Verificação CEP 39688-000:', {
      currentCity: data?.localidade,
      currentIbge: data?.ibge,
      isCorrect,
      expectedCity: 'Angelândia',
      expectedIbge: '3102803'
    });
    
    return { correct: isCorrect, currentCity: data?.localidade || null };
  } catch (error) {
    console.error('[cepCorrection] Erro na verificação:', error);
    return { correct: false, currentCity: null };
  }
}

/**
 * Força verificação externa do CEP nas APIs oficiais
 */
export async function verifyExternalCep(): Promise<{ viacep: any; brasilapi: any }> {
  const results = { viacep: null, brasilapi: null };
  
  try {
    console.log('[cepCorrection] 🔍 Verificando CEP 39688-000 externamente...');
    
    // Verificar ViaCEP
    try {
      const viacepResponse = await fetch('https://viacep.com.br/ws/39688000/json/');
      if (viacepResponse.ok) {
        const viacepData = await viacepResponse.json();
        if (!viacepData.erro) {
          results.viacep = viacepData;
          console.log('[cepCorrection] ViaCEP result:', viacepData.localidade, '-', viacepData.uf);
        }
      }
    } catch (error) {
      console.error('[cepCorrection] Erro ViaCEP:', error);
    }

    // Verificar BrasilAPI
    try {
      const brasilApiResponse = await fetch('https://brasilapi.com.br/api/cep/v1/39688000');
      if (brasilApiResponse.ok) {
        const brasilApiData = await brasilApiResponse.json();
        results.brasilapi = brasilApiData;
        console.log('[cepCorrection] BrasilAPI result:', brasilApiData.city, '-', brasilApiData.state);
      }
    } catch (error) {
      console.error('[cepCorrection] Erro BrasilAPI:', error);
    }
    
    return results;
  } catch (error) {
    console.error('[cepCorrection] Erro na verificação externa:', error);
    return results;
  }
}

// Executar correção automaticamente na inicialização
if (typeof window !== 'undefined') {
  console.log('[cepCorrection] 🚀 Iniciando correção automática do CEP 39688-000...');
  
  // Primeiro verificar externamente para confirmar
  verifyExternalCep().then(async (external) => {
    console.log('[cepCorrection] Resultados verificação externa:', external);
    
    // Verificar situação atual no cache
    const { correct, currentCity } = await verifyCepCorrection();
    
    if (!correct || currentCity !== 'Angelândia') {
      console.log('[cepCorrection] ⚠️ CEP precisa correção. Cidade atual no cache:', currentCity);
      console.log('[cepCorrection] 🔧 Aplicando correção forçada...');
      
      await forceCepCorrection();
      
      // Verificar novamente após correção
      const verification = await verifyCepCorrection();
      if (verification.correct) {
        console.log('[cepCorrection] ✅ Correção aplicada com sucesso!');
      } else {
        console.error('[cepCorrection] ❌ Correção falhou, cidade ainda:', verification.currentCity);
      }
    } else {
      console.log('[cepCorrection] ✅ CEP já está correto:', currentCity);
    }
  }).catch(console.error);
}
