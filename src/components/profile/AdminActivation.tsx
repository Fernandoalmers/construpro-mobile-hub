
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { ShieldCheck } from 'lucide-react';

const AdminActivation: React.FC = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) return;

      try {
        // Use the is_admin rpc function we fixed
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
      const newAdminStatus = !isAdmin;
      
      // Update profile in Supabase
      const { error } = await supabase
        .from('profiles')
        .update({ is_admin: newAdminStatus })
        .eq('id', user.id);

      if (error) throw error;

      // Update local state
      setIsAdmin(newAdminStatus);
      
      // Refresh the profile to get updated user data
      await refreshProfile();

      toast.success(newAdminStatus 
        ? 'Permissões administrativas ativadas'
        : 'Permissões administrativas desativadas'
      );
    } catch (error) {
      console.error('Error toggling admin status:', error);
      toast.error('Erro ao atualizar permissões');
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
      
      <Button
        variant={isAdmin ? "destructive" : "outline"}
        className="w-full"
        onClick={handleToggleAdmin}
        disabled={isLoading}
      >
        {isLoading ? 'Atualizando...' : isAdmin ? 'Remover permissões' : 'Tornar-me administrador'}
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
