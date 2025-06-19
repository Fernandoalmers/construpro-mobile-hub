
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { getUserProfile, UserProfile, updateUserProfile } from '@/services/userService';
import { addressService } from '@/services/addressService';

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
      
      // Load basic profile
      const userProfile = await getUserProfile();
      
      if (userProfile) {
        // Load primary address
        try {
          const addresses = await addressService.getAddresses();
          const primaryAddress = addresses.find(addr => addr.principal);
          
          if (primaryAddress) {
            userProfile.endereco_principal = {
              logradouro: primaryAddress.logradouro,
              numero: primaryAddress.numero,
              complemento: primaryAddress.complemento,
              bairro: primaryAddress.bairro,
              cidade: primaryAddress.cidade,
              estado: primaryAddress.estado,
              cep: primaryAddress.cep
            };
            console.log('[AuthContext] Primary address loaded:', primaryAddress);
          } else {
            console.log('[AuthContext] No primary address found');
          }
        } catch (addressError) {
          console.warn('[AuthContext] Failed to load address:', addressError);
          // Continue without address - not critical
        }
        
        setProfile(userProfile);
        console.log('[AuthContext] Profile loaded successfully');
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

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('[AuthContext] Initial session:', session?.user?.id);
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user?.id) {
        loadUserProfile(session.user.id).finally(() => {
          setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[AuthContext] Auth state changed:', event, session?.user?.id);
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (event === 'SIGNED_IN' && session?.user?.id) {
        await loadUserProfile(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setProfile(null);
      }
      
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
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
