
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import clientes from '../data/clientes.json';
import { toast } from "@/components/ui/sonner";
import { supabase } from '@/integrations/supabase/client';

// Define types
type UserRole = 'consumidor' | 'profissional' | 'lojista';

interface User {
  id: string;
  nome: string;
  cpf: string;
  email?: string;
  telefone?: string;
  papel: UserRole;
  saldoPontos?: number;
  avatar?: string;
  codigo?: string;
  is_admin?: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, senha: string) => Promise<void>;
  signup: (userData: Partial<User> & { senha: string }) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
  isPublicRoute: (pathname: string) => boolean;
  checkIsAdmin: () => Promise<boolean>;
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
];

// Create context
const AuthContext = createContext<AuthContextType | null>(null);

// Provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check for saved user on initial load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // In a real app, this would verify a token with the backend
        const savedUser = localStorage.getItem('construProUser');
        
        if (savedUser) {
          // Get user from localStorage
          const parsedUser = JSON.parse(savedUser);
          
          // Check Supabase for admin status if connected
          try {
            const { data, error } = await supabase
              .from('profiles')
              .select('is_admin')
              .eq('id', parsedUser.id)
              .single();
            
            if (!error && data) {
              parsedUser.is_admin = data.is_admin;
            }
          } catch (e) {
            console.error("Error checking admin status", e);
          }
          
          setUser(parsedUser);
        } else {
          // Criar um usuário simulado para demonstração
          const demoUser = clientes[0];
          const simulatedUser: User = {
            ...demoUser,
            papel: 'profissional',
            saldoPontos: 1250,
            codigo: demoUser.codigo,
            avatar: demoUser.avatar,
            is_admin: false
          };
          localStorage.setItem('construProUser', JSON.stringify(simulatedUser));
          setUser(simulatedUser);
          console.log("Usuário de demonstração criado para navegação");
        }
      } catch (err) {
        console.error('Auth verification failed', err);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Função para verificar se uma rota é pública
  const isPublicRoute = (pathname: string): boolean => {
    return publicRoutes.some(route => pathname === route || pathname.startsWith(route));
  };

  const login = async (email: string, senha: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Mock login - in real app this would call an API
      // Just for demonstration, let's find a user by email or CPF
      const foundUser = clientes.find(cliente => 
        cliente.email === email || cliente.cpf === email
      );
      
      if (!foundUser) {
        throw new Error('Usuário não encontrado');
      }
      
      // In a real app, we would verify the password here
      
      // Add role and other properties to user data
      const userWithRole: User = {
        ...foundUser,
        papel: 'profissional', // For demo purposes
        saldoPontos: 1250,
        codigo: foundUser.codigo,
        avatar: foundUser.avatar,
        is_admin: false // Default to non-admin
      };
      
      // Check Supabase for admin status
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', userWithRole.id)
          .single();
        
        if (!error && data) {
          userWithRole.is_admin = data.is_admin;
        } else {
          // Create profile if it doesn't exist
          await supabase
            .from('profiles')
            .insert({
              id: userWithRole.id,
              nome: userWithRole.nome,
              email: userWithRole.email,
              cpf: userWithRole.cpf,
              telefone: userWithRole.telefone,
              papel: userWithRole.papel,
              saldo_pontos: userWithRole.saldoPontos,
              avatar: userWithRole.avatar,
              codigo: userWithRole.codigo,
              is_admin: false
            })
            .select();
        }
      } catch (e) {
        console.error("Error checking/creating profile", e);
      }
      
      // Save to local storage for persistence
      localStorage.setItem('construProUser', JSON.stringify(userWithRole));
      setUser(userWithRole);
      toast.success("Login realizado com sucesso!");
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer login');
      toast.error(err instanceof Error ? err.message : 'Erro ao fazer login');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (userData: Partial<User> & { senha: string }) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Mock signup - in real app this would call an API
      const newUser: User = {
        id: `user-${Date.now()}`,
        nome: userData.nome || '',
        cpf: userData.cpf || '',
        email: userData.email,
        telefone: userData.telefone,
        papel: userData.papel as UserRole || 'profissional',
        saldoPontos: 0,
        avatar: userData.avatar,
        codigo: userData.codigo,
        is_admin: false // Default to non-admin
      };
      
      // Create profile in Supabase
      try {
        await supabase
          .from('profiles')
          .insert({
            id: newUser.id,
            nome: newUser.nome,
            email: newUser.email,
            cpf: newUser.cpf,
            telefone: newUser.telefone,
            papel: newUser.papel,
            saldo_pontos: newUser.saldoPontos || 0,
            avatar: newUser.avatar,
            codigo: newUser.codigo,
            is_admin: false
          });
      } catch (e) {
        console.error("Error creating profile", e);
      }
      
      // Save to local storage for persistence
      localStorage.setItem('construProUser', JSON.stringify(newUser));
      setUser(newUser);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar conta');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('construProUser');
    setUser(null);
    toast.info("Sessão encerrada");
  };

  const updateUser = async (data: Partial<User>) => {
    if (!user) return;
    
    const updatedUser = { ...user, ...data };
    
    // Update in Supabase if connected
    if (user.id) {
      try {
        await supabase
          .from('profiles')
          .update({
            nome: updatedUser.nome,
            email: updatedUser.email,
            cpf: updatedUser.cpf,
            telefone: updatedUser.telefone,
            papel: updatedUser.papel,
            saldo_pontos: updatedUser.saldoPontos,
            avatar: updatedUser.avatar,
            codigo: updatedUser.codigo,
            is_admin: updatedUser.is_admin
          })
          .eq('id', user.id);
      } catch (e) {
        console.error("Error updating profile", e);
      }
    }
    
    // Update in localStorage
    localStorage.setItem('construProUser', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };
  
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
      isLoading, 
      error, 
      login, 
      signup, 
      logout, 
      updateUser,
      isPublicRoute,
      checkIsAdmin
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
