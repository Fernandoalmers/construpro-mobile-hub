
import { useState, useCallback } from 'react';

export interface CepDiagnostic {
  cep: string;
  isValidFormat: boolean;
  viacepStatus: 'pending' | 'success' | 'error' | 'not_found';
  brasilApiStatus: 'pending' | 'success' | 'error' | 'not_found';
  correiosStatus: 'pending' | 'success' | 'error' | 'not_found';
  suggestedCeps: string[];
  diagnosticMessage: string;
}

export const useCepDiagnostics = () => {
  const [diagnostic, setDiagnostic] = useState<CepDiagnostic | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostic = useCallback(async (cep: string): Promise<CepDiagnostic> => {
    setIsRunning(true);
    const cleanCep = cep.replace(/\D/g, '');
    
    const result: CepDiagnostic = {
      cep: cleanCep,
      isValidFormat: cleanCep.length === 8,
      viacepStatus: 'pending',
      brasilApiStatus: 'pending',
      correiosStatus: 'pending',
      suggestedCeps: [],
      diagnosticMessage: ''
    };

    console.log('[useCepDiagnostics] Iniciando diagnóstico completo para CEP:', cleanCep);

    // Test ViaCEP
    try {
      const viacepResponse = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`, {
        signal: AbortSignal.timeout(5000)
      });
      
      if (viacepResponse.ok) {
        const viacepData = await viacepResponse.json();
        result.viacepStatus = viacepData.erro ? 'not_found' : 'success';
      } else {
        result.viacepStatus = 'error';
      }
    } catch (error) {
      result.viacepStatus = 'error';
      console.log('[useCepDiagnostics] ViaCEP falhou:', error);
    }

    // Test BrasilAPI
    try {
      const brasilApiResponse = await fetch(`https://brasilapi.com.br/api/cep/v1/${cleanCep}`, {
        signal: AbortSignal.timeout(5000)
      });
      
      result.brasilApiStatus = brasilApiResponse.ok ? 'success' : 
        (brasilApiResponse.status === 404 ? 'not_found' : 'error');
    } catch (error) {
      result.brasilApiStatus = 'error';
      console.log('[useCepDiagnostics] BrasilAPI falhou:', error);
    }

    // Generate suggestions for similar CEPs
    if (result.viacepStatus === 'not_found' && result.brasilApiStatus === 'not_found') {
      result.suggestedCeps = generateSimilarCeps(cleanCep);
    }

    // Generate diagnostic message
    result.diagnosticMessage = generateDiagnosticMessage(result);

    setDiagnostic(result);
    setIsRunning(false);
    
    console.log('[useCepDiagnostics] Diagnóstico completo:', result);
    return result;
  }, []);

  const clearDiagnostic = useCallback(() => {
    setDiagnostic(null);
  }, []);

  return {
    diagnostic,
    isRunning,
    runDiagnostic,
    clearDiagnostic
  };
};

function generateSimilarCeps(cep: string): string[] {
  const baseNumber = parseInt(cep);
  const suggestions: string[] = [];
  
  // Generate nearby CEPs (±100)
  for (let i = -100; i <= 100; i += 50) {
    if (i === 0) continue;
    const suggestedNumber = baseNumber + i;
    if (suggestedNumber > 10000000 && suggestedNumber < 99999999) {
      suggestions.push(suggestedNumber.toString().padStart(8, '0'));
    }
  }
  
  return suggestions.slice(0, 5);
}

function generateDiagnosticMessage(diagnostic: CepDiagnostic): string {
  if (!diagnostic.isValidFormat) {
    return 'CEP deve ter exatamente 8 dígitos numéricos.';
  }

  if (diagnostic.viacepStatus === 'not_found' && diagnostic.brasilApiStatus === 'not_found') {
    return `CEP ${diagnostic.cep} não foi encontrado em nenhuma base de dados oficial. Verifique se digitou corretamente ou tente um CEP próximo.`;
  }

  if (diagnostic.viacepStatus === 'error' && diagnostic.brasilApiStatus === 'error') {
    return 'Todas as APIs de CEP estão temporariamente indisponíveis. Tente novamente em alguns minutos ou preencha manualmente.';
  }

  if (diagnostic.viacepStatus === 'success' || diagnostic.brasilApiStatus === 'success') {
    return 'CEP encontrado com sucesso!';
  }

  return 'Erro inesperado na validação do CEP.';
}
