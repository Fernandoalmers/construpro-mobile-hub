
import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getUserProfile, UserProfile, updateUserProfile } from '@/services/userService';
import { Session, User } from '@supabase/supabase-js';

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
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    // First set up the auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Only fetch profile if user is set
        if (session?.user) {
          // Fetch profile asynchronously
          setTimeout(async () => {
            const userProfile = await getUserProfile();
            setProfile(userProfile);
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
        const { data } = await supabase.auth.getSession();
        
        setSession(data.session);
        setUser(data.session?.user ?? null);
        
        if (data.session?.user) {
          const userProfile = await getUserProfile();
          setProfile(userProfile);
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeAuth();
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (!error && data.user) {
        const userProfile = await getUserProfile();
        setProfile(userProfile);
      }
      
      return { error, data };
    } catch (error) {
      console.error("Login error:", error);
      return { error };
    }
  };

  const signup = async ({ email, password, userData }: { email: string, password: string, userData: any }) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData
        }
      });
      
      return { error, data };
    } catch (error) {
      console.error("Signup error:", error);
      return { error };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
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

  const refreshProfile = async () => {
    try {
      const userProfile = await getUserProfile();
      setProfile(userProfile);
      return userProfile;
    } catch (error) {
      console.error("Error refreshing profile:", error);
      return null;
    }
  };

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

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
