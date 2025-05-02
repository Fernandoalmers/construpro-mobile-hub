
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from "@/components/ui/sonner";
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';

// Define types
export type UserRole = 'consumidor' | 'profissional' | 'lojista' | 'vendedor';

export interface Profile {
  id: string;
  nome: string;
  cpf?: string;
  email?: string;
  telefone?: string;
  tipo_perfil: UserRole;
  papel?: UserRole;
  status: string;
  saldo_pontos: number;
  saldoPontos?: number; // for backward compatibility
  avatar?: string;
  is_admin?: boolean;
  codigo?: string;
  created_at?: string;
  updated_at?: string;
  endereco_principal?: {
    logradouro?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cidade?: string;
    estado?: string;
    cep?: string;
  };
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, senha: string) => Promise<void>;
  signup: (userData: SignupData) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
  updateUser: (data: Partial<Profile>) => Promise<void>; // Adicionando updateUser como alias para updateProfile
  isPublicRoute: (pathname: string) => boolean;
  checkIsAdmin: () => Promise<boolean>;
  refreshProfile: () => Promise<void>;
}

interface SignupData {
  email: string;
  senha: string;
  nome: string;
  cpf?: string;
  telefone?: string;
  tipo_perfil: UserRole;
}

// Lista de rotas públicas que não necessitam de autenticação
const publicRoutes = [
  '/',
  '/login',
  '/signup',
  '/onboarding',
  '/home',
  '/marketplace',
  '/produto',
  '/auth/recuperar-senha',
];

// Create context
const AuthContext = createContext<AuthContextType | null>(null);

// Provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Função para buscar o perfil do usuário
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Erro ao buscar perfil:', error);
        return null;
      }

      // Convert database structure to Profile type
      const profileData: Profile = {
        ...data,
        tipo_perfil: data.tipo_perfil || data.papel || 'consumidor',
        papel: data.papel || data.tipo_perfil || 'consumidor',
        saldo_pontos: data.saldo_pontos || 0,
        saldoPontos: data.saldo_pontos || 0, // for backward compatibility
        status: data.status || 'ativo'
      };
      
      return profileData;
    } catch (err) {
      console.error('Erro ao buscar perfil:', err);
      return null;
    }
  };

  // Atualizar perfil do usuário atual
  const refreshProfile = async () => {
    if (!user) return;
    
    const profileData = await fetchProfile(user.id);
    if (profileData) {
      setProfile(profileData);
    }
  };

  // Configurar listener para mudanças na autenticação
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user || null);
        
        if (currentSession?.user) {
          const profileData = await fetchProfile(currentSession.user.id);
          setProfile(profileData);
        } else {
          setProfile(null);
        }
        
        setIsLoading(false);
      }
    );

    // Verificar sessão atual
    const initializeAuth = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);
      setUser(currentSession?.user || null);
      
      if (currentSession?.user) {
        const profileData = await fetchProfile(currentSession.user.id);
        setProfile(profileData);
      }
      
      setIsLoading(false);
    };

    initializeAuth();

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Função para verificar se uma rota é pública
  const isPublicRoute = (pathname: string): boolean => {
    return publicRoutes.some(route => pathname === route || pathname.startsWith(route));
  };

  const login = async (email: string, senha: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: senha,
      });
      
      if (error) throw error;
      
      // Após login bem-sucedido, busca o perfil
      if (data.user) {
        const profileData = await fetchProfile(data.user.id);
        setProfile(profileData);
      }
      
      toast.success("Login realizado com sucesso!");
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (userData: SignupData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Chamar a função Edge para cadastro
      const response = await fetch(`${window.location.origin}/api/auth-signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userData.email,
          password: userData.senha,
          nome: userData.nome,
          cpf: userData.cpf,
          telefone: userData.telefone,
          tipo_perfil: userData.tipo_perfil
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Erro no cadastro');
      }
      
      toast.success("Cadastro realizado com sucesso! Você será redirecionado para o login.");
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
    toast.info("Sessão encerrada");
  };

  const updateProfile = async (data: Partial<Profile>) => {
    if (!user) return;
    
    try {
      const token = session?.access_token;
      
      if (!token) {
        throw new Error("Usuário não autenticado");
      }
      
      const response = await fetch(`${window.location.origin}/api/profile-update`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Erro na atualização do perfil');
      }
      
      // Atualiza o perfil na memória
      setProfile(prev => prev ? { ...prev, ...data } : null);
      
      // Se o campo papel foi atualizado, também define tipo_perfil com o mesmo valor
      if (data.papel && profile) {
        const updatedProfile = { ...profile, ...data, tipo_perfil: data.papel as UserRole };
        setProfile(updatedProfile);
      }
      
      toast.success("Perfil atualizado com sucesso!");
    } catch (err: any) {
      toast.error(err.message || 'Erro ao atualizar perfil');
      throw err;
    }
  };
  
  // Alias para updateProfile para manter compatibilidade com componentes existentes
  const updateUser = updateProfile;
  
  // Check if user is admin
  const checkIsAdmin = async (): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      return data?.is_admin || false;
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile,
      session,
      isLoading, 
      error, 
      login, 
      signup, 
      logout, 
      updateProfile,
      updateUser,
      isPublicRoute,
      checkIsAdmin,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
