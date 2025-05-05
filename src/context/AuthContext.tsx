
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getUserProfile, UserProfile, updateUserProfile } from '@/services/userService';
import { Session, User } from '@supabase/supabase-js';
import { referralService } from '@/services/pointsService';

export type UserRole = 'consumidor' | 'profissional' | 'lojista' | 'admin' | 'cliente' | 'vendedor';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ error: any | null, data?: any }>;
  signup: (params: { email: string, password: string, userData: any }) => Promise<{ error: any | null, data?: any }>;
  logout: () => Promise<void>;
  updateUser: (data: any) => Promise<{ error: any | null }>;
  refreshProfile: () => Promise<UserProfile | null>;
  updateProfile: (data: Partial<UserProfile>) => Promise<UserProfile | null>;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  profile: null,
  session: null,
  isLoading: true,
  login: async () => ({ error: null }),
  signup: async () => ({ error: null }),
  logout: async () => {},
  updateUser: async () => ({ error: null }),
  refreshProfile: async () => null,
  updateProfile: async () => null
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // O problema pode estar aqui, vamos garantir que o React esteja sendo importado corretamente
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);

  // Initialize auth state
  useEffect(() => {
    console.log("Auth provider initializing");
    
    // First set up the auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        console.log("Auth state changed:", event, "User:", newSession?.user?.id);
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        // Only fetch profile if user is set
        if (newSession?.user) {
          // Use setTimeout to avoid potential recursion/deadlock with Supabase client
          setTimeout(async () => {
            try {
              const userProfile = await getUserProfile();
              console.log("Profile fetched after auth change:", userProfile?.id);
              setProfile(userProfile);
            } catch (error) {
              console.error("Error fetching profile on auth change:", error);
            }
          }, 0);
        } else {
          setProfile(null);
        }
      }
    );
    
    // Then check current session
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        console.log("Getting initial session");
        
        const { data } = await supabase.auth.getSession();
        console.log("Initial session:", data.session?.user?.id);
        
        setSession(data.session);
        setUser(data.session?.user ?? null);
        
        if (data.session?.user) {
          try {
            const userProfile = await getUserProfile();
            console.log("Initial profile fetched:", userProfile?.id);
            setProfile(userProfile);
          } catch (profileError) {
            console.error("Error fetching initial profile:", profileError);
          }
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
      } finally {
        setIsLoading(false);
        setAuthInitialized(true);
        console.log("Auth initialization complete");
      }
    };
    
    initializeAuth();
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (!error && data.user) {
        const userProfile = await getUserProfile();
        setProfile(userProfile);
        console.log("User logged in:", data.user.id);
      }
      
      return { error, data };
    } catch (error) {
      console.error("Login error:", error);
      return { error };
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async ({ email, password, userData }: { email: string, password: string, userData: any }) => {
    try {
      setIsLoading(true);

      // Extract referral code if provided
      const referralCode = userData.codigo_indicacao;
      delete userData.codigo_indicacao; // Remove from userData as it's not stored in auth.users

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData
        }
      });
      
      // If signup was successful and a referral code was provided
      if (!error && data.user && referralCode) {
        // Process the referral code
        await referralService.processReferral(data.user.id, referralCode);
      }
      
      return { error, data };
    } catch (error) {
      console.error("Signup error:", error);
      return { error };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      setSession(null);
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = async (data: any) => {
    try {
      const { error } = await supabase.auth.updateUser({
        data
      });
      
      if (!error) {
        // Refresh the profile
        const userProfile = await getUserProfile();
        setProfile(userProfile);
      }
      
      return { error };
    } catch (error) {
      console.error("Update user error:", error);
      return { error };
    }
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    try {
      const updatedProfile = await updateUserProfile(data);
      if (updatedProfile) {
        setProfile(updatedProfile);
      }
      return updatedProfile;
    } catch (error) {
      console.error("Error updating profile:", error);
      return null;
    }
  };

  const refreshProfile = useCallback(async () => {
    try {
      const userProfile = await getUserProfile();
      setProfile(userProfile);
      return userProfile;
    } catch (error) {
      console.error("Error refreshing profile:", error);
      return null;
    }
  }, []);

  const isAuthenticated = !!user;

  const value = {
    isAuthenticated,
    user,
    profile,
    session,
    isLoading,
    login,
    signup,
    logout,
    updateUser,
    refreshProfile,
    updateProfile
  };

  // Debug why redirect might be happening
  useEffect(() => {
    if (authInitialized) {
      console.log("Auth state updated:", {
        isAuthenticated,
        isLoading,
        userId: user?.id,
        profileId: profile?.id,
        session: !!session
      });
    }
  }, [isAuthenticated, isLoading, user, profile, session, authInitialized]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
