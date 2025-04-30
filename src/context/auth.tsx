// src/context/auth.tsx
import { createContext, useContext, JSX, createSignal, createEffect } from 'solid-js';
import { useSupabase } from 'solid-supabase';
import { useNavigate } from '@solidjs/router';

// Define the User type based on Supabase auth user structure
type User = {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
  };
  role?: string;
}

// Define the Auth context type
type AuthContextType = {
  user: () => User | null;
  isLoading: () => boolean;
  isAuthenticated: () => boolean;
  signOut: () => Promise<void>;
}

// Create context with a default value that satisfies the type
const AuthContext = createContext<AuthContextType>({
  user: () => null,
  isLoading: () => true,
  isAuthenticated: () => false,
  signOut: async () => {}
});

export function AuthProvider(props: { children: JSX.Element }) {
  const [user, setUser] = createSignal<User | null>(null);
  const [isLoading, setIsLoading] = createSignal(true);
  const supabase = useSupabase();
  
  createEffect(async () => {
    setIsLoading(true);
    
    const { data } = await supabase.auth.getSession();
    
    if (data.session) {
      setUser(data.session.user as User);
    }
    
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user as User || null);
      }
    );
    
    setIsLoading(false);
    
    return () => {
      authListener?.subscription?.unsubscribe();
    };
  });
  
  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: () => !!user(),
    signOut: async () => {
      await supabase.auth.signOut();
      setUser(null);
    }
  };
  
  return (
    <AuthContext.Provider value={value}>
      {props.children}
    </AuthContext.Provider>
  );
}

// Typed useAuth hook
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}


            