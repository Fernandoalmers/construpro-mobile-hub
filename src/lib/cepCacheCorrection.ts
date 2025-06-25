
import { supabase } from '@/integrations/supabase/client';

/**
 * Correção definitiva do cache Supabase para CEP 39688-000
 * Este arquivo executa uma única vez para corrigir permanentemente o cache
 */

export async function forceSupabaseCacheCorrection(): Promise<void> {
  try {
    console.log('[cepCacheCorrection] 🔧 CORREÇÃO DEFINITIVA: Limpando cache incorreto do CEP 39688-000');
    
    // 1. DELETAR todas as entradas incorretas para este CEP
    const { error: deleteError } = await supabase
      .from('zip_cache')
      .delete()
      .eq('cep', '39688000');
    
    if (deleteError) {
      console.error('[cepCacheCorrection] Erro ao deletar cache incorreto:', deleteError);
    } else {
      console.log('[cepCacheCorrection] ✅ Cache incorreto deletado');
    }
    
    // 2. INSERIR dados CORRETOS permanentemente
    const { error: insertError } = await supabase
      .from('zip_cache')
      .insert({
        cep: '39688000',
        logradouro: 'Endereço não especificado',
        bairro: 'Centro',
        localidade: 'Angelândia', // CORRETO: Angelândia, não Setubinha
        uf: 'MG',
        ibge: '3102803', // IBGE correto para Angelândia-MG
        cached_at: new Date().toISOString(),
      });
    
    if (insertError) {
      console.error('[cepCacheCorrection] Erro ao inserir dados corretos:', insertError);
      throw insertError;
    }
    
    console.log('[cepCacheCorrection] ✅ CEP 39688-000 CORRIGIDO DEFINITIVAMENTE para Angelândia-MG');
    
    // 3. VERIFICAÇÃO final
    const { data: verification } = await supabase
      .from('zip_cache')
      .select('localidade, ibge')
      .eq('cep', '39688000')
      .single();
    
    if (verification?.localidade === 'Angelândia' && verification?.ibge === '3102803') {
      console.log('[cepCacheCorrection] ✅ VERIFICAÇÃO: Correção aplicada com sucesso!');
    } else {
      console.error('[cepCacheCorrection] ❌ VERIFICAÇÃO: Correção falhou, dados ainda incorretos:', verification);
    }
    
  } catch (error) {
    console.error('[cepCacheCorrection] 💥 Erro na correção definitiva:', error);
    throw error;
  }
}

// Executar correção automaticamente apenas uma vez
if (typeof window !== 'undefined') {
  // Usar um flag no localStorage para executar apenas uma vez
  const correctionKey = 'cep_39688_corrected_v2';
  
  if (!localStorage.getItem(correctionKey)) {
    console.log('[cepCacheCorrection] 🚀 Iniciando correção definitiva única...');
    
    forceSupabaseCacheCorrection()
      .then(() => {
        localStorage.setItem(correctionKey, 'true');
        console.log('[cepCacheCorrection] ✅ Correção definitiva concluída e marcada como executada');
      })
      .catch((error) => {
        console.error('[cepCacheCorrection] ❌ Falha na correção definitiva:', error);
      });
  } else {
    console.log('[cepCacheCorrection] ℹ️ Correção já foi executada anteriormente');
  }
}
