import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';
import { User as AppUser } from '../types';

interface AuthContextType {
  session: Session | null;
  user: AppUser | null;
  loading: boolean;
  signIn: (email: string, password: string, role: 'client' | 'guard') => Promise<{ error: any }>;
  signUp: (email: string, password: string, userData: Partial<AppUser>) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        if (session?.user) {
          await fetchUserProfile(session.user.id);
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('🔍 Fetching user profile for ID:', userId);
      
      // Add a small delay to ensure the session is fully established
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('❌ Error fetching user profile:', error);
        // Don't return here, let the error be handled by the caller
        throw error;
      }

      console.log('✅ User profile fetched successfully:', data);
      setUser(data as AppUser);
    } catch (error) {
      console.error('❌ Error in fetchUserProfile:', error);
      // Set user to null if we can't fetch the profile
      setUser(null);
    }
  };

  const signIn = async (email: string, password: string, role: 'client' | 'guard') => {
    try {
      console.log('🔐 Attempting sign in with:', { email, role });
      
      // Check current session before sign in
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      console.log('📋 Current session before sign in:', currentSession ? 'exists' : 'none');
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ Supabase auth error:', error);
        return { error };
      }

      console.log('✅ Supabase auth successful, user ID:', data.user?.id);
      console.log('📋 Session after sign in:', data.session ? 'exists' : 'none');

      if (data.user) {
        // Add a small delay to ensure the session is fully established
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Check session again after delay
        const { data: { session: delayedSession } } = await supabase.auth.getSession();
        console.log('📋 Session after delay:', delayedSession ? 'exists' : 'none');
        console.log('🆔 Session user ID:', delayedSession?.user?.id);
        
        // Verify user role matches or is admin
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role')
          .eq('id', data.user.id)
          .single();

        if (userError) {
          console.error('❌ Error fetching user profile:', userError);
          // If we can't fetch the user profile, sign out and return error
          await supabase.auth.signOut();
          return { error: { message: 'Error fetching user profile. Please try again.' } };
        }

        console.log('👤 User role from database:', userData.role);
        console.log('🎯 Selected role:', role);

        // Allow admin users to access both client and guard sides
        // Allow regular users to access only their designated role
        if (userData.role === 'admin' || userData.role === role) {
          console.log('✅ Role validation successful');
          return { error: null };
        } else {
          console.log('❌ Role validation failed');
          await supabase.auth.signOut();
          return { error: { message: 'Invalid role for this account' } };
        }
      }

      return { error: null };
    } catch (error) {
      console.error('❌ Unexpected error in signIn:', error);
      return { error };
    }
  };

  const signUp = async (email: string, password: string, userData: Partial<AppUser>) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        return { error };
      }

      if (data.user) {
        // Create user profile
        const { error: profileError } = await supabase
          .from('users')
          .insert([
            {
              id: data.user.id,
              email: data.user.email,
              role: userData.role,
              ...userData,
            },
          ]);

        if (profileError) {
          console.error('Error creating user profile:', profileError);
          return { error: profileError };
        }
      }

      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const refreshUser = async () => {
    if (session?.user) {
      await fetchUserProfile(session.user.id);
    }
  };

  const value: AuthContextType = {
    session,
    user,
    loading,
    signIn,
    signUp,
    signOut,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 