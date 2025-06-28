
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
  const refreshTimeoutRef = useRef<NodeJS.Timeout>();

  const loadUserProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      console.log('[AuthContext] Loading user profile for:', userId);
      const userProfile = await getUserProfile();
      
      if (userProfile) {
        setProfile(userProfile);
        console.log('[AuthContext] Profile loaded successfully:', {
          id: userProfile.id,
          nome: userProfile.nome,
          avatar: userProfile.avatar ? 'presente' : 'ausente'
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

  // Debounced refresh profile para evitar chamadas múltiplas
  const refreshProfile = useCallback(async (): Promise<UserProfile | null> => {
    if (!user?.id || isRefreshingRef.current) {
      console.log('[AuthContext] Skipping refresh - no user or already refreshing');
      return profile;
    }
    
    // Limpar timeout anterior
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }
    
    // Debounce de 300ms
    return new Promise((resolve) => {
      refreshTimeoutRef.current = setTimeout(async () => {
        isRefreshingRef.current = true;
        console.log('[AuthContext] 🔄 Refreshing profile...');
        
        try {
          const updatedProfile = await loadUserProfile(user.id);
          
          if (updatedProfile) {
            console.log('[AuthContext] 📡 Profile refreshed successfully');
            window.dispatchEvent(new CustomEvent('profile-updated', {
              detail: { 
                profile: updatedProfile, 
                timestamp: Date.now(),
                source: 'refresh'
              }
            }));
          }
          
          resolve(updatedProfile);
        } catch (error) {
          console.error('[AuthContext] Error refreshing profile:', error);
          resolve(profile);
        } finally {
          isRefreshingRef.current = false;
        }
      }, 300);
    });
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

  // Realtime listener otimizado
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
          console.log('[AuthContext] 📡 Perfil atualizado via realtime');
          
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
      
      console.log('[AuthContext] Auth state changed:', event);
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (event === 'SIGNED_IN' && session?.user?.id) {
        // Carregar perfil de forma não-bloqueante
        setTimeout(() => {
          if (isMounted) {
            loadUserProfile(session.user.id);
          }
        }, 100);
      } else if (event === 'SIGNED_OUT') {
        setProfile(null);
      }
      
      setIsLoading(false);
    });

    // Cleanup
    return () => {
      isMounted = false;
      subscription.unsubscribe();
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
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
