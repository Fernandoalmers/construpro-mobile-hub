
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

interface SignupParams {
  email: string;
  password: string;
  userData: any;
}

type AuthContextType = AuthState & {
  isAuthenticated: boolean; 
  login: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signup: (params: SignupParams) => Promise<{ error: AuthError | null, data: any }>;
  logout: () => Promise<void>;
  updateUser: (data: any) => Promise<void>;
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

  // Compute isAuthenticated based on session existence
  const isAuthenticated = !!state.session && !!state.user;

  // Function to fetch user profile from profiles table
  const getProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return null;
      
      console.log("Fetching profile for user:", user.id);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }
      
      console.log("Profile fetched:", data);
      return data;
    } catch (error) {
      console.error('Error in getProfile:', error);
      return null;
    }
  };

  // Function to update user metadata
  const updateUser = async (data: any) => {
    try {
      // Update profile table
      const { error } = await supabase
        .from('profiles')
        .update(data)
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
        // First, set up the auth state change listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log('Auth state changed:', event, session ? "session exists" : "no session");
          
          if (session) {
            // Use setTimeout to avoid potential recursive calls
            setTimeout(async () => {
              // Fetch profile data after getting session
              const profile = await getProfile();
              setState({ 
                session, 
                user: session.user, 
                profile, 
                isLoading: false, 
                error: null 
              });
            }, 0);
          } else {
            setState({ 
              session: null, 
              user: null, 
              profile: null, 
              isLoading: false, 
              error: null 
            });
          }
        });

        // Then check for existing session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error getting session:", error);
          setState(prev => ({ ...prev, error: error.message, isLoading: false }));
          return;
        }

        if (session) {
          console.log("Existing session found");
          // Get user profile
          const profile = await getProfile();
          setState({ session, user: session.user, profile, isLoading: false, error: null });
        } else {
          console.log("No existing session");
          setState({ session: null, user: null, profile: null, isLoading: false, error: null });
        }

        return () => {
          subscription.unsubscribe();
        };
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
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error("Login error:", error);
        setState(prev => ({ ...prev, error: error.message, isLoading: false }));
        return { error };
      }
      
      console.log("Login successful, fetching profile");
      const profile = await getProfile();
      setState({ session: data.session, user: data.user, profile, isLoading: false, error: null });
      return { error: null };
    } catch (error) {
      console.error('Login error:', error);
      setState(prev => ({ ...prev, isLoading: false, error: error instanceof Error ? error.message : 'Unknown error' }));
      return { error: error instanceof AuthError ? error : new AuthError('Unknown error') };
    }
  };

  // Signup function - updated to handle edge function errors
  const signup = async ({ email, password, userData }: SignupParams) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      console.log("Invoking auth-signup edge function with:", { email, ...userData });
      
      const { data: signupData, error: signupError } = await supabase.functions.invoke('auth-signup', {
        body: {
          email,
          password,
          ...userData
        }
      });
      
      if (signupError || (signupData && signupData.error)) {
        const errorMessage = signupError?.message || (signupData && signupData.error) || 'Erro ao criar conta';
        console.error("Signup error:", errorMessage);
        setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
        return { error: new AuthError(errorMessage), data: null };
      }
      
      console.log("Signup successful, signing in...");
      
      // Automatically sign in after successful signup
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (signInError) {
        console.error("Auto sign-in error:", signInError);
        setState(prev => ({ ...prev, isLoading: false, error: signInError.message }));
        
        // Even if auto-login fails, consider the signup successful
        return { error: signInError, data: signupData };
      }
      
      console.log("Auto sign-in successful, fetching profile");
      const profile = await getProfile();
      setState({ 
        session: signInData.session, 
        user: signInData.user, 
        profile, 
        isLoading: false, 
        error: null 
      });
      
      return { error: null, data: signupData };
    } catch (error) {
      console.error('Signup error:', error);
      setState(prev => ({ ...prev, isLoading: false, error: error instanceof Error ? error.message : 'Unknown error' }));
      return { error: error instanceof AuthError ? error : new AuthError('Unknown error'), data: null };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setState({ session: null, user: null, profile: null, isLoading: false, error: null });
      navigate('/login');
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        isAuthenticated,
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
