'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name?: string;
  role: 'ADMIN' | 'ANALYST' | 'VIEWER';
}

interface AuthContextType {
  user: AuthenticatedUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasRole: (requiredRole: 'ADMIN' | 'ANALYST' | 'VIEWER') => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing token on mount
    const token = localStorage.getItem('auth-token');
    if (token) {
      // Verify token and set user
      verifyToken(token);
    } else {
      // Create demo user for testing
      createDemoUser();
    }
  }, []);

  const verifyToken = async (token: string) => {
    try {
      const response = await fetch('/api/auth/verify', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        localStorage.setItem('auth-token', token);
      } else {
        // Token invalid, remove it
        localStorage.removeItem('auth-token');
        createDemoUser();
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      localStorage.removeItem('auth-token');
      createDemoUser();
    } finally {
      setLoading(false);
    }
  };

  const createDemoUser = async () => {
    try {
      const response = await fetch('/api/auth/demo');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        localStorage.setItem('auth-token', data.token);
      }
    } catch (error) {
      console.error('Failed to create demo user:', error);
      // Set a fallback demo user
      setUser({
        id: 'demo-user-id',
        email: 'demo@eagle-eye.com',
        name: 'Demo User',
        role: 'ANALYST'
      });
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        localStorage.setItem('auth-token', data.token);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('auth-token');
  };

  const hasRole = (requiredRole: 'ADMIN' | 'ANALYST' | 'VIEWER'): boolean => {
    if (!user) return false;
    
    const roleHierarchy = {
      'ADMIN': 3,
      'ANALYST': 2,
      'VIEWER': 1
    };

    return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    hasRole
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
