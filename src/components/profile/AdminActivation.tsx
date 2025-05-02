
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { ShieldCheck } from 'lucide-react';

const AdminActivation: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) return;

      try {
        const { data } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single();
        
        setIsAdmin(data?.is_admin || false);
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
      
      // Update user in context - we need to add is_admin as an additional property
      // since it's not part of the original type
      if (user) {
        // Use type assertion to add the is_admin property
        updateUser({ 
          ...user, 
          // @ts-ignore - We know is_admin exists in the database even if not in the type
          is_admin: newAdminStatus 
        });
      }

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
