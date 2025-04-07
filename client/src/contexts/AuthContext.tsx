import { createContext, ReactNode, useContext, useMemo } from 'react';
import useAuth, { User, LoginCredentials, RegisterData } from '@/hooks/useAuth';

// Define the Auth context type
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<any>;
  register: (data: RegisterData) => Promise<any>;
  logout: () => void;
  getAuthHeader: () => Record<string, string> | {};
  refreshUser: () => Promise<any>;
}

// Create context with a default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  
  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => {
    return {
      user: auth.user,
      isAuthenticated: auth.isAuthenticated,
      login: auth.login,
      register: auth.register,
      logout: auth.logout,
      getAuthHeader: auth.getAuthHeader,
      refreshUser: auth.refreshUser,
    };
  }, [auth]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook to use the auth context
export function useAuthContext() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  
  return context;
}