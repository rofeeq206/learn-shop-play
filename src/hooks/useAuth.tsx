import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { auth } from '@/lib/apiClient';
import { AppRole, isStaffRole, hasPermission } from '@/types/roles';

interface User {
  id: string;
  email: string;
  full_name: string | null;
  role?: AppRole;
}

interface AuthContextType {
  user: User | null;
  session: { user: User } | null;
  loading: boolean;
  userRole: AppRole | null;
  isStaff: boolean;
  hasPermission: (permission: string) => boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<AppRole | null>(null);

  useEffect(() => {
    const checkAuth = () => {
      try {
        const storedUser = auth.getCurrentUser();
        const isAuth = auth.isAuthenticated();
        
        if (isAuth && storedUser) {
          setUser(storedUser);
          setUserRole((storedUser.role as AppRole) || 'customer');
        } else {
          setUser(null);
          setUserRole(null);
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        setUser(null);
        setUserRole(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const checkPermission = (permission: string): boolean => {
    return hasPermission(userRole, permission);
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const response = await auth.register({
        email,
        password,
        full_name: fullName,
      });
      
      localStorage.setItem('auth_token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      const newUser = response.data.user;
      setUser(newUser);
      setUserRole((newUser.role as AppRole) || 'customer');
      
      return { error: null };
    } catch (error: any) {
      console.error('Registration error:', error);
      return { error: new Error(error.message || 'Registration failed') };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const response = await auth.login({ email, password });
      
      localStorage.setItem('auth_token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      const newUser = response.data.user;
      setUser(newUser);
      setUserRole((newUser.role as AppRole) || 'customer');
      
      return { error: null };
    } catch (error: any) {
      console.error('Login error:', error);
      return { error: new Error(error.message || 'Login failed') };
    }
  };

  const signOut = async () => {
    auth.logout();
    setUser(null);
    setUserRole(null);
  };

  // Create a session object for backwards compatibility
  const session = user ? { user } : null;

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading, 
      userRole,
      isStaff: isStaffRole(userRole),
      hasPermission: checkPermission,
      signUp, 
      signIn, 
      signOut 
    }}>
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
