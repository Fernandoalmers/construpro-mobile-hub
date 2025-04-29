
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import clientes from '../data/clientes.json';

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
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, senha: string) => Promise<void>;
  signup: (userData: Partial<User> & { senha: string }) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
}

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
          setUser(JSON.parse(savedUser));
        }
      } catch (err) {
        console.error('Auth verification failed', err);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

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
      
      // Add role to user data (default to 'profissional' for mock data)
      const userWithRole: User = {
        ...foundUser,
        papel: 'profissional', // For demo purposes
      };
      
      // Save to local storage for persistence
      localStorage.setItem('construProUser', JSON.stringify(userWithRole));
      setUser(userWithRole);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer login');
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
      };
      
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
  };

  const updateUser = (data: Partial<User>) => {
    if (!user) return;
    
    const updatedUser = { ...user, ...data };
    localStorage.setItem('construProUser', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading, 
      error, 
      login, 
      signup, 
      logout, 
      updateUser 
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
