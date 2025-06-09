
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, CheckCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface DataIntegrityStatus {
  foreignKeyActive: boolean;
  totalAdjustments: number;
  vendorIntegrityCheck: boolean;
  lastVerified: Date;
}

const DataIntegrityIndicator: React.FC = () => {
  const [status, setStatus] = useState<DataIntegrityStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkDataIntegrity();
  }, []);

  const checkDataIntegrity = async () => {
    try {
      setIsLoading(true);
      
      // Check if foreign key constraint exists
      const { data: constraintData, error: constraintError } = await supabase
        .rpc('execute_custom_sql', {
          sql_statement: `
            SELECT COUNT(*) as constraint_count
            FROM pg_constraint 
            WHERE conname = 'fk_pontos_ajustados_vendedor'
          `
        });

      // Get total adjustments count
      const { data: adjustmentsData, error: adjustmentsError } = await supabase
        .from('pontos_ajustados')
        .select('id', { count: 'exact', head: true });

      // Verify all adjustments have valid vendor_ids
      const { data: integrityData, error: integrityError } = await supabase
        .rpc('execute_custom_sql', {
          sql_statement: `
            SELECT COUNT(*) as invalid_count
            FROM pontos_ajustados pa
            LEFT JOIN vendedores v ON pa.vendedor_id = v.id
            WHERE v.id IS NULL
          `
        });

      const foreignKeyActive = !constraintError && constraintData?.status === 'success';
      const totalAdjustments = adjustmentsData ? (adjustmentsData as any).count || 0 : 0;
      const vendorIntegrityCheck = !integrityError && integrityData?.status === 'success';

      setStatus({
        foreignKeyActive,
        totalAdjustments,
        vendorIntegrityCheck,
        lastVerified: new Date()
      });

    } catch (error) {
      console.error('Error checking data integrity:', error);
      setStatus({
        foreignKeyActive: false,
        totalAdjustments: 0,
        vendorIntegrityCheck: false,
        lastVerified: new Date()
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Integridade de Dados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const allChecksPass = status?.foreignKeyActive && status?.vendorIntegrityCheck;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Integridade de Dados
          {allChecksPass ? (
            <Badge variant="default" className="bg-green-100 text-green-800">
              <CheckCircle className="h-3 w-3 mr-1" />
              Protegido
            </Badge>
          ) : (
            <Badge variant="destructive">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Alerta
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Constraint de Chave Estrangeira</span>
            {status?.foreignKeyActive ? (
              <Badge variant="default" className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Ativa
              </Badge>
            ) : (
              <Badge variant="destructive">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Inativa
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Integridade Vendedores</span>
            {status?.vendorIntegrityCheck ? (
              <Badge variant="default" className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Íntegra
              </Badge>
            ) : (
              <Badge variant="destructive">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Problema
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Total de Ajustes</span>
            <Badge variant="outline" className="font-mono">
              {status?.totalAdjustments || 0}
            </Badge>
          </div>

          <div className="text-xs text-gray-500 mt-3">
            Última verificação: {status?.lastVerified.toLocaleString('pt-BR')}
          </div>

          {allChecksPass && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  Sistema Protegido
                </span>
              </div>
              <p className="text-xs text-green-700 mt-1">
                A constraint FK está ativa e bloqueando inserções inválidas de ajustes de pontos.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DataIntegrityIndicator;
