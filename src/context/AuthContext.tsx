
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { getUserProfile, UserProfile, updateUserProfile } from '@/services/userService';

export type UserRole = 'consumidor' | 'profissional' | 'lojista';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<UserProfile | null>;
  login: (email: string, password: string) => Promise<{ error: any }>;
  logout: () => Promise<void>;
  updateProfile: (data: any) => Promise<UserProfile | null>;
  updateUser: (data: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Refs para controle de estado
  const isRefreshingRef = useRef(false);

  const loadUserProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      console.log('🔄 [AuthContext] Carregando perfil do usuário:', userId);
      const userProfile = await getUserProfile();
      
      if (userProfile) {
        setProfile(userProfile);
        console.log('✅ [AuthContext] Perfil carregado:', {
          id: userProfile.id,
          nome: userProfile.nome,
          avatar: userProfile.avatar ? 'presente' : 'ausente',
          avatarUrl: userProfile.avatar
        });
        return userProfile;
      } else {
        console.warn('⚠️ [AuthContext] Nenhum perfil encontrado');
        setProfile(null);
        return null;
      }
    } catch (error) {
      console.error('❌ [AuthContext] Erro ao carregar perfil:', error);
      setProfile(null);
      return null;
    }
  };

  // Refresh profile sem debounce - propagação imediata
  const refreshProfile = useCallback(async (): Promise<UserProfile | null> => {
    if (!user?.id || isRefreshingRef.current) {
      console.log('🚫 [AuthContext] Skipping refresh - sem usuário ou já refreshing');
      return profile;
    }
    
    isRefreshingRef.current = true;
    console.log('🔄 [AuthContext] Refreshing profile imediatamente...');
    
    try {
      const updatedProfile = await loadUserProfile(user.id);
      
      if (updatedProfile) {
        console.log('✅ [AuthContext] Profile refreshed, disparando evento:', updatedProfile.avatar);
        
        // Disparar evento customizado imediatamente
        window.dispatchEvent(new CustomEvent('profile-updated', {
          detail: { 
            profile: updatedProfile, 
            timestamp: Date.now(),
            source: 'refresh'
          }
        }));
      }
      
      return updatedProfile;
    } catch (error) {
      console.error('❌ [AuthContext] Erro ao refresh profile:', error);
      return profile;
    } finally {
      isRefreshingRef.current = false;
    }
  }, [user?.id, profile]);

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const logout = async () => {
    console.log('🚪 [AuthContext] Fazendo logout');
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setProfile(null);
    } catch (error) {
      console.error('❌ [AuthContext] Erro no logout:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (data: any): Promise<UserProfile | null> => {
    try {
      console.log('🔄 [AuthContext] Atualizando perfil com dados:', data);
      const updatedProfile = await updateUserProfile(data);
      
      // Atualizar estado imediatamente
      setProfile(updatedProfile);
      console.log('✅ [AuthContext] Perfil atualizado localmente:', {
        avatar: updatedProfile.avatar,
        timestamp: Date.now()
      });
      
      // Disparar evento imediatamente
      window.dispatchEvent(new CustomEvent('profile-updated', {
        detail: { 
          profile: updatedProfile, 
          source: 'update',
          timestamp: Date.now()
        }
      }));
      
      return updatedProfile;
    } catch (error) {
      console.error('❌ [AuthContext] Erro ao atualizar perfil:', error);
      throw error;
    }
  };

  const updateUser = async (data: any): Promise<void> => {
    try {
      await updateUserProfile(data);
      await refreshProfile();
    } catch (error) {
      console.error('❌ [AuthContext] Erro ao atualizar usuário:', error);
      throw error;
    }
  };

  // Realtime listener otimizado
  useEffect(() => {
    if (!user?.id) return;

    console.log('📡 [AuthContext] Configurando listener realtime para:', user.id);
    
    const channel = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`
        },
        async (payload) => {
          console.log('📡 [AuthContext] Perfil atualizado via realtime:', payload.new);
          
          const newProfile = payload.new as UserProfile;
          setProfile(newProfile);
          
          // Disparar evento customizado
          window.dispatchEvent(new CustomEvent('profile-updated', {
            detail: { 
              profile: newProfile, 
              source: 'realtime',
              timestamp: Date.now()
            }
          }));
        }
      )
      .subscribe();

    return () => {
      console.log('📡 [AuthContext] Removendo listener realtime');
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  useEffect(() => {
    let isMounted = true;

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      
      console.log('🔑 [AuthContext] Sessão inicial:', {
        hasSession: !!session,
        userId: session?.user?.id
      });
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user?.id) {
        loadUserProfile(session.user.id).finally(() => {
          if (isMounted) setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      
      console.log('🔄 [AuthContext] Auth state changed:', event);
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (event === 'SIGNED_IN' && session?.user?.id) {
        // Carregar perfil imediatamente
        loadUserProfile(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setProfile(null);
      }
      
      setIsLoading(false);
    });

    // Cleanup
    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await logout();
  };

  const value = {
    user,
    session,
    profile,
    isAuthenticated: !!session,
    isLoading,
    signOut,
    refreshProfile,
    login,
    logout,
    updateProfile,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
