
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { Session, User, AuthError } from '@supabase/supabase-js';
import { toast } from "@/components/ui/sonner";

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
  updateProfile: (data: any) => Promise<any>;
  getProfile: () => Promise<any>;
  refreshProfile: () => Promise<void>;
  setupAvatarStorage: () => Promise<void>;
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

  // Function to fetch user profile from profiles table with retry logic
  const getProfile = async (retries = 1): Promise<any> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return null;
      
      console.log("Fetching profile for user:", user.id);
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      
      if (error) {
        // Handle the infinite recursion error specifically
        if (error.code === '42P17' && retries > 0) {
          console.log("Detected possible RLS recursion, retrying with edge function...");
          
          // Use the profile-update edge function to get the profile instead
          try {
            const { data: edgeProfile, error: edgeError } = await supabase.functions.invoke('profile-update', {
              method: 'GET'
            });
            
            if (edgeError) throw edgeError;
            if (edgeProfile?.data) return edgeProfile.data;
          } catch (edgeErr) {
            console.error("Edge function fallback also failed:", edgeErr);
            // Continue to retry with delay if edge function failed
          }
          
          // Wait a bit and retry
          await new Promise(resolve => setTimeout(resolve, 1000));
          return getProfile(retries - 1);
        }
        
        console.error('Error fetching profile:', error);
        return null;
      }
      
      if (profile) {
        console.log("Profile fetched:", profile);
        return profile;
      } else {
        console.log("No profile found for user:", user.id);
        return null;
      }
    } catch (error) {
      console.error('Error in getProfile:', error);
      return null;
    }
  };

  // Function to update user metadata
  const updateUser = async (data: any) => {
    try {
      if (!state.user?.id) {
        throw new Error("Usuário não autenticado");
      }

      // Update profile table
      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', state.user.id);

      if (error) throw error;

      // Refresh profile after update
      await refreshProfile();
      
    } catch (error) {
      console.error('Error updating user data:', error);
      throw error;
    }
  };

  // Function to update user profile via edge function
  const updateProfile = async (data: any) => {
    try {
      if (!state.user?.id) {
        throw new Error("Usuário não autenticado");
      }

      const { data: response, error } = await supabase.functions.invoke('profile-update', {
        body: data
      });

      if (error) throw error;

      // Refresh state with new profile
      if (response?.data) {
        setState(prev => ({ ...prev, profile: response.data }));
      } else {
        await refreshProfile();
      }
      
      return response?.data;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  // Function to refresh user profile
  const refreshProfile = async () => {
    try {
      const profile = await getProfile();
      if (profile) {
        setState(prev => ({ ...prev, profile }));
      }
      return profile;
    } catch (error) {
      console.error('Error refreshing profile:', error);
      throw error;
    }
  };
  
  // Function to set up avatar storage bucket
  const setupAvatarStorage = async () => {
    try {
      await supabase.functions.invoke('create-avatar-bucket');
    } catch (error) {
      console.error('Error setting up avatar storage:', error);
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
              setState(prev => ({ 
                ...prev, 
                session, 
                user: session.user, 
                isLoading: false, 
                error: null 
              }));
              
              // Fetch profile data after session is set
              try {
                const profile = await getProfile();
                if (profile) {
                  setState(prev => ({ ...prev, profile }));
                }
                
                // Set up avatar storage if we have a user
                setupAvatarStorage();
              } catch (profileError) {
                console.error("Error fetching profile after auth state change:", profileError);
              }
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
          setState(prev => ({ 
            ...prev, 
            session, 
            user: session.user, 
            isLoading: false 
          }));
          
          // Get user profile after setting session
          try {
            const profile = await getProfile();
            if (profile) {
              setState(prev => ({ ...prev, profile }));
            }
            
            // Set up avatar storage if we have a user
            setupAvatarStorage();
          } catch (profileError) {
            console.error("Error fetching profile during initialization:", profileError);
          }
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
      
      console.log("Login successful");
      setState(prev => ({ 
        ...prev, 
        session: data.session, 
        user: data.user, 
        isLoading: false, 
        error: null 
      }));
      
      // Fetch profile separately to avoid recursive calls
      setTimeout(async () => {
        try {
          const profile = await getProfile();
          if (profile) {
            setState(prev => ({ ...prev, profile }));
          }
          
          // Set up avatar storage
          setupAvatarStorage();
        } catch (profileError) {
          console.error("Error fetching profile after login:", profileError);
        }
      }, 0);
      
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
      
      console.log("Auto sign-in successful");
      setState({ 
        session: signInData.session, 
        user: signInData.user, 
        profile: null,
        isLoading: false, 
        error: null 
      });
      
      // Fetch profile separately to avoid recursive calls
      setTimeout(async () => {
        try {
          const profile = await getProfile();
          if (profile) {
            setState(prev => ({ ...prev, profile }));
          }
          
          // Set up avatar storage
          setupAvatarStorage();
        } catch (profileError) {
          console.error("Error fetching profile after signup:", profileError);
        }
      }, 0);
      
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
      toast.error("Erro ao fazer logout. Tente novamente.");
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
        refreshProfile,
        setupAvatarStorage
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
