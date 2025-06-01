
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';

const AutoFixMissingCodes: React.FC = () => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [hasExecuted, setHasExecuted] = useState(false);

  useEffect(() => {
    if (!hasExecuted) {
      executeFixMissingCodes();
    }
  }, [hasExecuted]);

  const executeFixMissingCodes = async () => {
    setIsExecuting(true);
    console.log('🔧 Executando correção automática de códigos faltantes...');
    
    try {
      const { data, error } = await supabase.functions.invoke('fix-missing-codes', {
        method: 'POST'
      });

      if (error) {
        console.error('❌ Erro ao corrigir códigos:', error);
        toast.error('Erro ao corrigir códigos de indicação');
        setResult({ success: false, error: error.message });
        return;
      }

      console.log('✅ Resultado da correção:', data);
      setResult(data);
      
      if (data.success) {
        toast.success(`Códigos corrigidos com sucesso! ${data.fixed} usuários atualizados.`);
      } else {
        toast.error(data.error || 'Erro desconhecido');
      }

    } catch (error) {
      console.error('❌ Erro inesperado:', error);
      toast.error('Erro inesperado ao corrigir códigos');
      setResult({ success: false, error: 'Erro inesperado' });
    } finally {
      setIsExecuting(false);
      setHasExecuted(true);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className={`h-5 w-5 ${isExecuting ? 'animate-spin' : ''}`} />
          Execução Automática - Correção de Códigos
        </CardTitle>
        <CardDescription>
          Executando automaticamente a correção de códigos de indicação faltantes...
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isExecuting && (
          <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />
            <div>
              <p className="text-sm font-medium text-blue-800">
                Executando correção...
              </p>
              <p className="text-sm text-blue-700">
                Gerando códigos únicos para usuários sem código de indicação.
              </p>
            </div>
          </div>
        )}

        {result && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Resultado da Execução:</h4>
            <div className="space-y-2 text-sm">
              {result.success ? (
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="h-4 w-4" />
                  <span>✅ Operação realizada com sucesso!</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-700">
                  <AlertTriangle className="h-4 w-4" />
                  <span>❌ Erro na operação</span>
                </div>
              )}
              
              <div className="text-gray-700">
                <p><strong>Usuários corrigidos:</strong> {result.fixed || 0}</p>
                {result.total && <p><strong>Total encontrados:</strong> {result.total}</p>}
                {result.message && <p><strong>Mensagem:</strong> {result.message}</p>}
              </div>

              {result.errors && result.errors.length > 0 && (
                <div className="mt-2">
                  <p className="font-medium text-red-700">Erros encontrados:</p>
                  <ul className="list-disc list-inside text-red-600 text-xs">
                    {result.errors.map((error: string, index: number) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {!isExecuting && result && (
          <div className="text-center text-sm text-gray-600">
            Correção concluída. Agora todos os usuários devem ter códigos de indicação únicos.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AutoFixMissingCodes;
