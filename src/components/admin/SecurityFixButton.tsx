
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Shield, CheckCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { supabaseService } from '@/services/supabaseService';

interface SecurityFixResult {
  success: boolean;
  message: string;
  details?: {
    functionsFixed: number;
    totalFunctions: number;
    fixedFunctions: string[];
    errors?: string[] | null;
  };
}

export const SecurityFixButton: React.FC = () => {
  const [isFixing, setIsFixing] = useState(false);
  const [isFixed, setIsFixed] = useState(false);

  const handleSecurityFixes = async () => {
    setIsFixing(true);
    
    try {
      console.log('Iniciando correções de segurança...');
      
      const { data, error } = await supabaseService.invokeFunction('fix-security-vulnerabilities');
      
      if (error) {
        console.error('Erro ao aplicar correções de segurança:', error);
        toast.error('Erro ao aplicar correções de segurança: ' + error.message);
        return;
      }
      
      const result = data as SecurityFixResult;
      
      if (result.success) {
        console.log('Correções de segurança aplicadas:', result);
        
        const { functionsFixed, totalFunctions, errors } = result.details || {};
        
        if (errors && errors.length > 0) {
          toast.warning(`Correções parciais aplicadas: ${functionsFixed}/${totalFunctions} funções corrigidas. Alguns erros ocorreram.`);
        } else {
          toast.success(`🔒 Todas as ${functionsFixed} vulnerabilidades de segurança foram corrigidas!`);
          setIsFixed(true);
        }
      } else {
        toast.error('Falha ao aplicar correções: ' + result.message);
      }
      
    } catch (error) {
      console.error('Erro na execução das correções:', error);
      toast.error('Erro inesperado ao aplicar correções de segurança');
    } finally {
      setIsFixing(false);
    }
  };

  if (isFixed) {
    return (
      <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
        <CheckCircle className="h-5 w-5 text-green-600" />
        <span className="text-green-800 font-medium">Vulnerabilidades corrigidas</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-medium text-amber-800 mb-1">Vulnerabilidades de Segurança Detectadas</h3>
          <p className="text-sm text-amber-700 mb-3">
            O Database Linter detectou 6 funções com vulnerabilidades de search_path. 
            Estas correções melhoram a segurança sem afetar a funcionalidade.
          </p>
          <ul className="text-xs text-amber-600 space-y-1 mb-3">
            <li>• migrate_missing_orders_to_pedidos</li>
            <li>• sync_order_to_pedidos</li>
            <li>• check_sync_integrity</li>
            <li>• check_product_stock</li>
            <li>• update_inventory_on_order</li>
            <li>• update_inventory_on_order_item</li>
          </ul>
        </div>
      </div>
      
      <Button 
        onClick={handleSecurityFixes}
        disabled={isFixing}
        className="w-full"
        variant="default"
      >
        <Shield className="h-4 w-4 mr-2" />
        {isFixing ? 'Aplicando Correções...' : 'Corrigir Vulnerabilidades'}
      </Button>
    </div>
  );
};
