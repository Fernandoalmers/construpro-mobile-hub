
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { getUserProfile, UserProfile } from '@/services/userService';
import { addressService } from '@/services/addressService';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUserProfile = async (userId: string) => {
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
      } else {
        console.warn('[AuthContext] No profile found for user');
        setProfile(null);
      }
    } catch (error) {
      console.error('[AuthContext] Error loading profile:', error);
      setProfile(null);
    }
  };

  const refreshProfile = async () => {
    if (user?.id) {
      await loadUserProfile(user.id);
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
    console.log('[AuthContext] Signing out');
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setProfile(null);
    } catch (error) {
      console.error('[AuthContext] Error signing out:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    session,
    profile,
    isAuthenticated: !!session,
    isLoading,
    signOut,
    refreshProfile,
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
