
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { AlertTriangle, CheckCircle } from 'lucide-react';

const ReferralFixer: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleFixPendingReferrals = async () => {
    setIsProcessing(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('referral-processing', {
        method: 'PUT',
        body: {
          action: 'fix_pending_referrals'
        }
      });

      if (error) {
        throw error;
      }

      setResult(data);
      toast.success(`Processamento concluído: ${data.activated} indicações ativadas de ${data.processed} processadas`);
    } catch (error) {
      console.error('Error fixing referrals:', error);
      toast.error('Erro ao processar indicações pendentes');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
          Correção de Indicações
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600">
          Esta ferramenta processa indicações pendentes de usuários que já realizaram compras
          e ativa automaticamente as que deveriam ter sido aprovadas.
        </p>
        
        <Button 
          onClick={handleFixPendingReferrals}
          disabled={isProcessing}
          className="w-full"
        >
          {isProcessing ? 'Processando...' : 'Corrigir Indicações Pendentes'}
        </Button>

        {result && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">Processamento Concluído</span>
            </div>
            <div className="text-sm text-green-700">
              <p>Indicações processadas: {result.processed}</p>
              <p>Indicações ativadas: {result.activated}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ReferralFixer;
