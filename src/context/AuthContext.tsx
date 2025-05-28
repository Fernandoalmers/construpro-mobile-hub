
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
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);

  // Initialize auth state
  useEffect(() => {
    console.log("🚀 [AuthProvider] Initializing auth provider");
    
    // First set up the auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        console.log("🔄 [AuthProvider] Auth state changed:", event, "User:", newSession?.user?.id);
        
        if (newSession?.user) {
          console.log("👤 [AuthProvider] User metadata:", newSession.user.user_metadata);
        }
        
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        // Only fetch profile if user is set
        if (newSession?.user) {
          // Use setTimeout to avoid potential recursion/deadlock with Supabase client
          setTimeout(async () => {
            try {
              console.log("📋 [AuthProvider] Fetching user profile after auth change...");
              const userProfile = await getUserProfile();
              console.log("✅ [AuthProvider] Profile fetched after auth change:", {
                id: userProfile?.id,
                tipo_perfil: userProfile?.tipo_perfil,
                nome: userProfile?.nome
              });
              setProfile(userProfile);
            } catch (error) {
              console.error("❌ [AuthProvider] Error fetching profile on auth change:", error);
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
        console.log("🔍 [AuthProvider] Getting initial session");
        
        const { data } = await supabase.auth.getSession();
        console.log("📊 [AuthProvider] Initial session result:", {
          hasSession: !!data.session,
          userId: data.session?.user?.id,
          userEmail: data.session?.user?.email
        });
        
        setSession(data.session);
        setUser(data.session?.user ?? null);
        
        if (data.session?.user) {
          try {
            console.log("📋 [AuthProvider] Fetching initial profile...");
            const userProfile = await getUserProfile();
            console.log("✅ [AuthProvider] Initial profile fetched:", {
              id: userProfile?.id,
              tipo_perfil: userProfile?.tipo_perfil,
              nome: userProfile?.nome
            });
            setProfile(userProfile);
          } catch (profileError) {
            console.error("❌ [AuthProvider] Error fetching initial profile:", profileError);
          }
        }
      } catch (error) {
        console.error("💥 [AuthProvider] Error initializing auth:", error);
      } finally {
        setIsLoading(false);
        setAuthInitialized(true);
        console.log("✅ [AuthProvider] Auth initialization complete");
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
      console.log("🔐 [AuthProvider] Attempting login for:", email);
      
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (!error && data.user) {
        console.log("✅ [AuthProvider] Login successful, fetching profile...");
        const userProfile = await getUserProfile();
        setProfile(userProfile);
        console.log("👤 [AuthProvider] User logged in with profile:", {
          id: data.user.id,
          email: data.user.email,
          tipo_perfil: userProfile?.tipo_perfil
        });
      } else if (error) {
        console.error("❌ [AuthProvider] Login error:", error.message);
      }
      
      return { error, data };
    } catch (error) {
      console.error("💥 [AuthProvider] Login exception:", error);
      return { error };
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async ({ email, password, userData }: { email: string, password: string, userData: any }) => {
    try {
      setIsLoading(true);
      console.log("📝 [AuthProvider] Starting signup process for:", email);
      console.log("📋 [AuthProvider] User data:", userData);

      // Extract referral code if provided
      const referralCode = userData.codigo_indicacao;
      const cleanUserData = { ...userData };
      delete cleanUserData.codigo_indicacao; // Remove from userData as it's not stored in auth.users

      // Try using the edge function first for better control
      try {
        console.log("🔧 [AuthProvider] Attempting signup via edge function");
        
        const signupPayload = {
          email,
          password,
          ...cleanUserData
        };

        console.log("📤 [AuthProvider] Sending signup payload:", signupPayload);

        const response = await fetch("https://orqnibkshlapwhjjmszh.supabase.co/functions/v1/auth-signup", {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ycW5pYmtzaGxhcHdoamptc3poIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYyMjQxNDAsImV4cCI6MjA2MTgwMDE0MH0.JkNLF_MgpA4KamUZspxidu6wT4bCXEw8ej93xbp0JsI`
          },
          body: JSON.stringify(signupPayload)
        });

        if (response.ok) {
          const result = await response.json();
          console.log("✅ [AuthProvider] Signup successful via edge function:", result);
          
          // If signup was successful and a referral code was provided
          if (result.success && result.user && referralCode) {
            console.log("🎁 [AuthProvider] Processing referral code:", referralCode);
            try {
              await referralService.processReferral(result.user.id, referralCode);
            } catch (referralError) {
              console.error("❌ [AuthProvider] Error processing referral:", referralError);
              // Don't fail signup if referral processing fails
            }
          }
          
          return { error: null, data: result };
        } else {
          const errorResult = await response.json();
          console.error("❌ [AuthProvider] Edge function signup failed:", errorResult);
          throw new Error(errorResult.error || 'Signup failed');
        }
      } catch (edgeFunctionError) {
        console.warn("⚠️ [AuthProvider] Edge function failed, falling back to Supabase signup:", edgeFunctionError);
        
        // Fallback to regular Supabase signup
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: cleanUserData
          }
        });
        
        if (error) {
          console.error("❌ [AuthProvider] Supabase signup failed:", error);
          return { error, data: null };
        }

        console.log("✅ [AuthProvider] Supabase signup successful:", data.user?.id);
        
        // If signup was successful and a referral code was provided
        if (!error && data.user && referralCode) {
          console.log("🎁 [AuthProvider] Processing referral code:", referralCode);
          try {
            await referralService.processReferral(data.user.id, referralCode);
          } catch (referralError) {
            console.error("❌ [AuthProvider] Error processing referral:", referralError);
            // Don't fail signup if referral processing fails
          }
        }
        
        return { error, data };
      }
    } catch (error) {
      console.error("💥 [AuthProvider] Signup exception:", error);
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

  // Enhanced debug logging for auth state changes
  useEffect(() => {
    if (authInitialized) {
      console.log("📊 [AuthProvider] Auth state summary:", {
        isAuthenticated,
        isLoading,
        userId: user?.id,
        userEmail: user?.email,
        profileId: profile?.id,
        profileType: profile?.tipo_perfil,
        profileName: profile?.nome,
        hasSession: !!session
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
