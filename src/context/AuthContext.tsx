
import React, { createContext, useContext, useEffect, useState } from 'react';
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

  const loadUserProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      console.log('[AuthContext] Loading user profile for:', userId);
      const userProfile = await getUserProfile();
      
      if (userProfile) {
        setProfile(userProfile);
        console.log('[AuthContext] Profile loaded successfully:', {
          id: userProfile.id,
          nome: userProfile.nome,
          is_admin: userProfile.is_admin,
          endereco_principal: userProfile.endereco_principal?.cep ? 'presente' : 'ausente'
        });
        return userProfile;
      } else {
        console.warn('[AuthContext] No profile found for user');
        setProfile(null);
        return null;
      }
    } catch (error) {
      console.error('[AuthContext] Error loading profile:', error);
      setProfile(null);
      return null;
    }
  };

  const refreshProfile = async (): Promise<UserProfile | null> => {
    if (user?.id) {
      console.log('[AuthContext] 🔄 Refreshing profile...');
      return await loadUserProfile(user.id);
    }
    return null;
  };

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
    console.log('[AuthContext] Logging out');
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setProfile(null);
    } catch (error) {
      console.error('[AuthContext] Error logging out:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (data: any): Promise<UserProfile | null> => {
    try {
      const updatedProfile = await updateUserProfile(data);
      setProfile(updatedProfile);
      return updatedProfile;
    } catch (error) {
      console.error('[AuthContext] Error updating profile:', error);
      throw error;
    }
  };

  const updateUser = async (data: any): Promise<void> => {
    try {
      await updateUserProfile(data);
      await refreshProfile();
    } catch (error) {
      console.error('[AuthContext] Error updating user:', error);
      throw error;
    }
  };

  // NOVO: Listener para mudanças no perfil em tempo real
  useEffect(() => {
    if (!user?.id) return;

    console.log('[AuthContext] 📡 Configurando listener realtime para perfil:', user.id);
    
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
          console.log('[AuthContext] 📡 Perfil atualizado via realtime:', payload);
          
          // Verificar se o endereco_principal mudou
          const newProfile = payload.new as UserProfile;
          const oldProfile = payload.old as UserProfile;
          
          const newCep = newProfile.endereco_principal?.cep;
          const oldCep = oldProfile.endereco_principal?.cep;
          
          if (newCep !== oldCep) {
            console.log('[AuthContext] 🏠 Endereço principal mudou:', { oldCep, newCep });
            
            // Atualizar o profile state imediatamente
            setProfile(newProfile);
            
            // Disparar evento customizado para que outros hooks possam reagir
            window.dispatchEvent(new CustomEvent('primary-address-changed', {
              detail: { newCep, oldCep, profile: newProfile }
            }));
          }
        }
      )
      .subscribe();

    return () => {
      console.log('[AuthContext] 📡 Removendo listener realtime do perfil');
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  useEffect(() => {
    let isMounted = true;

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      
      console.log('[AuthContext] Initial session:', {
        hasSession: !!session,
        userId: session?.user?.id,
        userEmail: session?.user?.email
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
      
      console.log('[AuthContext] Auth state changed:', {
        event,
        hasSession: !!session,
        userId: session?.user?.id,
        userEmail: session?.user?.email
      });
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (event === 'SIGNED_IN' && session?.user?.id) {
        // Use setTimeout to defer the profile loading and avoid blocking
        setTimeout(() => {
          if (isMounted) {
            loadUserProfile(session.user.id);
          }
        }, 0);
      } else if (event === 'SIGNED_OUT') {
        setProfile(null);
      }
      
      setIsLoading(false);
    });

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
