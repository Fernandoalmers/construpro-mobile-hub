
import { useState, useCallback } from 'react';
import { generateCepSuggestions } from '@/lib/enhancedCep';

export interface CepDiagnostic {
  isValidFormat: boolean;
  viacepStatus: string;
  brasilApiStatus: string;
  suggestedCeps: string[];
  diagnosticMessage: string;
  externalVerification?: {
    viacep?: any;
    brasilapi?: any;
    discrepancy?: boolean;
  };
}

export const useCepDiagnostics = () => {
  const [diagnostic, setDiagnostic] = useState<CepDiagnostic | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostic = useCallback(async (cep: string): Promise<CepDiagnostic> => {
    setIsRunning(true);
    
    const cleanCep = cep.replace(/\D/g, '');
    
    console.log('[useCepDiagnostics] 🔍 Iniciando diagnóstico completo para CEP:', cleanCep);
    
    const result: CepDiagnostic = {
      isValidFormat: cleanCep.length === 8,
      viacepStatus: 'checking',
      brasilApiStatus: 'checking',
      suggestedCeps: [],
      diagnosticMessage: 'Verificando...',
      externalVerification: {}
    };

    if (!result.isValidFormat) {
      result.diagnosticMessage = 'CEP com formato inválido (deve ter 8 dígitos)';
      setDiagnostic(result);
      setIsRunning(false);
      return result;
    }

    try {
      // Verificação ViaCEP
      console.log('[useCepDiagnostics] 📡 Verificando ViaCEP...');
      try {
        const viacepResponse = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        if (viacepResponse.ok) {
          const viacepData = await viacepResponse.json();
          if (viacepData.erro) {
            result.viacepStatus = 'not_found';
          } else {
            result.viacepStatus = 'success';
            result.externalVerification!.viacep = viacepData;
            console.log('[useCepDiagnostics] ✅ ViaCEP encontrou:', viacepData.localidade, '-', viacepData.uf);
          }
        } else {
          result.viacepStatus = 'error';
        }
      } catch (error) {
        console.error('[useCepDiagnostics] ❌ Erro ViaCEP:', error);
        result.viacepStatus = 'error';
      }

      // Verificação BrasilAPI
      console.log('[useCepDiagnostics] 📡 Verificando BrasilAPI...');
      try {
        const brasilApiResponse = await fetch(`https://brasilapi.com.br/api/cep/v1/${cleanCep}`);
        if (brasilApiResponse.ok) {
          const brasilApiData = await brasilApiResponse.json();
          result.brasilApiStatus = 'success';
          result.externalVerification!.brasilapi = brasilApiData;
          console.log('[useCepDiagnostics] ✅ BrasilAPI encontrou:', brasilApiData.city, '-', brasilApiData.state);
        } else if (brasilApiResponse.status === 404) {
          result.brasilApiStatus = 'not_found';
        } else {
          result.brasilApiStatus = 'error';
        }
      } catch (error) {
        console.error('[useCepDiagnostics] ❌ Erro BrasilAPI:', error);
        result.brasilApiStatus = 'error';
      }

      // Verificar discrepâncias
      const viacepCity = result.externalVerification?.viacep?.localidade;
      const brasilApiCity = result.externalVerification?.brasilapi?.city;
      
      if (viacepCity && brasilApiCity && viacepCity !== brasilApiCity) {
        result.externalVerification!.discrepancy = true;
        console.warn('[useCepDiagnostics] ⚠️ DISCREPÂNCIA DETECTADA:', {
          viacep: viacepCity,
          brasilapi: brasilApiCity
        });
      }

      // Gerar sugestões
      result.suggestedCeps = generateCepSuggestions(cleanCep);

      // Mensagem de diagnóstico
      if (result.viacepStatus === 'success' && result.brasilApiStatus === 'success') {
        if (result.externalVerification?.discrepancy) {
          result.diagnosticMessage = `⚠️ APIs retornam cidades diferentes! ViaCEP: ${viacepCity} | BrasilAPI: ${brasilApiCity}`;
        } else {
          result.diagnosticMessage = `✅ CEP válido encontrado em ambas APIs: ${viacepCity}`;
        }
      } else if (result.viacepStatus === 'success' || result.brasilApiStatus === 'success') {
        const workingApi = result.viacepStatus === 'success' ? 'ViaCEP' : 'BrasilAPI';
        const city = result.viacepStatus === 'success' ? viacepCity : brasilApiCity;
        result.diagnosticMessage = `⚡ CEP encontrado apenas no ${workingApi}: ${city}`;
      } else {
        result.diagnosticMessage = `❌ CEP não encontrado em nenhuma API oficial. Possível CEP inexistente.`;
      }

    } catch (error) {
      console.error('[useCepDiagnostics] 💥 Erro geral no diagnóstico:', error);
      result.diagnosticMessage = 'Erro durante verificação externa';
    }

    console.log('[useCepDiagnostics] 📋 Diagnóstico concluído:', result);
    setDiagnostic(result);
    setIsRunning(false);
    return result;
  }, []);

  return {
    diagnostic,
    isRunning,
    runDiagnostic
  };
};
