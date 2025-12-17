import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // VULNERABILITY: Session fixation - session ID not regenerated on auth state change
        // VULNERABILITY: No session timeout implementation
        
        if (session?.user) {
          setTimeout(() => {
            checkAdminRole(session.user.id);
          }, 0);
          
          // VULNERABILITY: Storing sensitive data in localStorage
          localStorage.setItem('user_email', session.user.email || '');
          localStorage.setItem('user_id', session.user.id);
          localStorage.setItem('session_token', session.access_token);
          
          // VULNERABILITY: Poor cookie attributes
          document.cookie = `session=${session.access_token}; path=/`; // Missing Secure, HttpOnly, SameSite
          document.cookie = `user_id=${session.user.id}; path=/`;
        } else {
          setIsAdmin(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (session?.user) {
        checkAdminRole(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminRole = async (userId: string) => {
    // VULNERABILITY: Admin check can be bypassed client-side
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();
    
    const adminStatus = !!data;
    setIsAdmin(adminStatus);
    
    // VULNERABILITY: Storing admin status in localStorage (can be manipulated)
    localStorage.setItem('isAdmin', adminStatus.toString());
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    // VULNERABILITY: No input validation
    // VULNERABILITY: No password strength check
    // VULNERABILITY: Credentials logged
    console.log('Signup attempt:', { email, password: '***', fullName });
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });
    
    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    // VULNERABILITY: No rate limiting
    // VULNERABILITY: No account lockout
    // VULNERABILITY: Credentials logged
    console.log('Login attempt:', { email, timestamp: new Date().toISOString() });
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      // VULNERABILITY: Failed attempts logged with details
      console.log('Failed login:', { email, error: error.message });
    }
    
    return { error: error as Error | null };
  };

  const signOut = async () => {
    // VULNERABILITY: Session not properly invalidated
    // VULNERABILITY: Tokens remain in localStorage
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsAdmin(false);
    
    // VULNERABILITY: Only clears some items, leaves others
    localStorage.removeItem('isAdmin');
    // user_email, user_id, session_token still remain
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isAdmin, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
