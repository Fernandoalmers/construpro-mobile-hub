
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { Session, User, AuthError } from '@supabase/supabase-js';

export type UserRole = 'consumidor' | 'profissional' | 'lojista' | 'vendedor';

type ProviderProps = {
  children: ReactNode;
};

type AuthState = {
  session: Session | null;
  user: User | null;
  profile: any | null; // User profile from profiles table
  isLoading: boolean;
  error: string | null;
};

type AuthContextType = AuthState & {
  login: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signup: (email: string, password: string, userData: any) => Promise<{ error: AuthError | null, data: any }>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<{ papel: UserRole, tipo_perfil: UserRole }>) => Promise<void>;
  updateProfile: (data: any) => Promise<void>;
  getProfile: () => Promise<any>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: ProviderProps) {
  const navigate = useNavigate();
  const [state, setState] = useState<AuthState>({
    session: null,
    user: null,
    profile: null,
    isLoading: true,
    error: null,
  });

  // Function to fetch user profile from profiles table
  const getProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (error) {
          console.error('Error fetching profile:', error);
        }
        
        return data;
      }
      return null;
    } catch (error) {
      console.error('Error in getProfile:', error);
      return null;
    }
  };

  // Function to update user metadata
  const updateUser = async (data: Partial<{ papel: UserRole, tipo_perfil: UserRole }>) => {
    try {
      // Ensure papel and tipo_perfil are synchronized
      const updateData = { ...data };
      if (data.papel && !data.tipo_perfil) {
        updateData.tipo_perfil = data.papel;
      } else if (data.tipo_perfil && !data.papel) {
        updateData.papel = data.tipo_perfil;
      }
      
      // Update profile table
      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', state.user?.id);

      if (error) throw error;

      // Update state with new profile data
      const profile = await getProfile();
      setState(prev => ({ ...prev, profile }));
      
    } catch (error) {
      console.error('Error updating user data:', error);
      throw error;
    }
  };

  // Function to update user profile in profiles table and in Supabase auth
  const updateProfile = async (data: any) => {
    try {
      const { data: updatedProfile, error } = await supabase.functions.invoke('profile-update', {
        body: data
      });

      if (error) throw error;

      // Update state with new profile
      setState(prev => ({ ...prev, profile: updatedProfile?.data || prev.profile }));
      return updatedProfile;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      setState(prev => ({ ...prev, isLoading: true }));
      
      try {
        // Get current session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          setState(prev => ({ ...prev, error: error.message, isLoading: false }));
          return;
        }

        if (session) {
          // Get user profile
          const profile = await getProfile();
          setState({ session, user: session.user, profile, isLoading: false, error: null });
        } else {
          setState({ session: null, user: null, profile: null, isLoading: false, error: null });
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        setState(prev => ({ 
          ...prev, 
          error: error instanceof Error ? error.message : 'Unknown error', 
          isLoading: false 
        }));
      }
    };

    initializeAuth();
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        const profile = await getProfile();
        setState({ session, user: session.user, profile, isLoading: false, error: null });
      } else {
        setState({ session: null, user: null, profile: null, isLoading: false, error: null });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        return { error };
      }
      
      const profile = await getProfile();
      setState({ session: data.session, user: data.user, profile, isLoading: false, error: null });
      return { error: null };
    } catch (error) {
      console.error('Login error:', error);
      return { error: error instanceof AuthError ? error : new AuthError('Unknown error') };
    }
  };

  // Signup function
  const signup = async (email: string, password: string, userData: any) => {
    try {
      const { data: signupData, error: signupError } = await supabase.functions.invoke('auth-signup', {
        body: {
          email,
          password,
          ...userData
        }
      });
      
      if (signupError) {
        return { error: signupError, data: null };
      }
      
      return { error: null, data: signupData };
    } catch (error) {
      console.error('Signup error:', error);
      return { error: error instanceof AuthError ? error : new AuthError('Unknown error'), data: null };
    }
  };

  // Logout function
  const logout = async () => {
    await supabase.auth.signOut();
    setState({ session: null, user: null, profile: null, isLoading: false, error: null });
    navigate('/');
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        signup,
        logout,
        updateUser,
        updateProfile,
        getProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
