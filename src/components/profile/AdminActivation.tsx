
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { ShieldCheck, AlertTriangle } from 'lucide-react';
import { securityService } from '@/services/securityService';

const AdminActivation: React.FC = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase.rpc('is_admin');
        
        if (error) throw error;
        setIsAdmin(!!data);
      } catch (error) {
        console.error('Error checking admin status:', error);
      }
    };

    checkAdminStatus();
  }, [user]);

  const handleToggleAdmin = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      if (isAdmin) {
        // Use secure demotion
        const result = await securityService.demoteUserFromAdmin(user.id, 'Self-demotion via profile');
        if (result.success) {
          setIsAdmin(false);
          await refreshProfile();
        }
      } else {
        // Direct promotion - this should now be blocked by our trigger
        // Let's try the old method to demonstrate the security improvement
        const { error } = await supabase
          .from('profiles')
          .update({ is_admin: true })
          .eq('id', user.id);

        if (error) {
          // Expected to fail due to our security trigger
          console.log('Direct admin promotion blocked by security trigger:', error.message);
          toast.error('Promoção direta de administrador foi bloqueada por segurança. Use o painel administrativo.');
          
          // Log this security event
          await securityService.logSecurityEvent('blocked_direct_admin_promotion', {
            user_id: user.id,
            error: error.message
          });
        } else {
          // This shouldn't happen with our security measures
          setIsAdmin(true);
          await refreshProfile();
          toast.success('Permissões administrativas ativadas');
        }
      }
    } catch (error) {
      console.error('Error toggling admin status:', error);
      toast.error('Erro ao atualizar permissões');
      
      await securityService.logSecurityEvent('admin_toggle_error', {
        user_id: user.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col space-y-4 p-4 border rounded-lg bg-gray-50">
      <div className="flex items-center space-x-2">
        <ShieldCheck size={24} className={isAdmin ? "text-green-500" : "text-gray-400"} />
        <div>
          <h3 className="font-semibold">Modo Administrador</h3>
          <p className="text-sm text-gray-500">
            {isAdmin 
              ? 'Você é um administrador da plataforma' 
              : 'Ativar permissões de administrador'}
          </p>
        </div>
      </div>
      
      {!isAdmin && (
        <div className="flex items-start space-x-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertTriangle size={16} className="text-amber-600 mt-0.5" />
          <div className="text-sm text-amber-700">
            <p className="font-medium">Segurança Aprimorada</p>
            <p>A promoção direta de administrador foi desabilitada por segurança. 
            Solicite a um administrador existente para promover sua conta.</p>
          </div>
        </div>
      )}
      
      <Button
        variant={isAdmin ? "destructive" : "outline"}
        className="w-full"
        onClick={handleToggleAdmin}
        disabled={isLoading}
      >
        {isLoading ? 'Atualizando...' : isAdmin ? 'Remover permissões' : 'Tentar ativação (bloqueado)'}
      </Button>

      {isAdmin && (
        <Button 
          variant="default"
          className="w-full"
          onClick={() => window.location.href = '/admin'}
        >
          Acessar painel administrativo
        </Button>
      )}
    </div>
  );
};

export default AdminActivation;
