
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';

const FixMissingCodes: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleFixMissingCodes = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      console.log('🔧 Executando correção de códigos faltantes...');
      
      const { data, error } = await supabase.functions.invoke('fix-missing-codes', {
        method: 'POST'
      });

      if (error) {
        console.error('❌ Erro ao corrigir códigos:', error);
        toast.error('Erro ao corrigir códigos de indicação');
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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Corrigir Códigos de Indicação Faltantes
        </CardTitle>
        <CardDescription>
          Esta ferramenta gera códigos de indicação únicos para usuários que não possuem um código.
          Útil para corrigir usuários cadastrados antes da implementação do sistema de códigos.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <div>
            <p className="text-sm font-medium text-amber-800">
              Atenção
            </p>
            <p className="text-sm text-amber-700">
              Esta operação irá gerar códigos únicos para todos os usuários que não possuem código de indicação.
            </p>
          </div>
        </div>

        <Button 
          onClick={handleFixMissingCodes} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Corrigindo códigos...
            </>
          ) : (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Corrigir Códigos Faltantes
            </>
          )}
        </Button>

        {result && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Resultado da Correção:</h4>
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
      </CardContent>
    </Card>
  );
};

export default FixMissingCodes;
