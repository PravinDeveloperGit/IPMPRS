import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '../types';
import { authService } from '../services/authService';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  hasRole: (...roles: UserRole[]) => boolean;
  isOfficer: boolean;
  isReviewer: boolean;
  isApprover: boolean;
  isKnowledgeAdmin: boolean;
  isAdmin: boolean;
  isAuditor: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('ipmprs_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function initAuth() {
      const storedToken = localStorage.getItem('ipmprs_token');
      if (storedToken) {
        try {
          const profile = await authService.getMe();
          setUser(profile);
        } catch (err) {
          localStorage.removeItem('ipmprs_token');
          localStorage.removeItem('ipmprs_user');
          setUser(null);
          setToken(null);
        }
      }
      setIsLoading(false);
    }
    initAuth();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    setIsLoading(true);
    try {
      const data = await authService.login(email, password);
      localStorage.setItem('ipmprs_token', data.token);
      localStorage.setItem('ipmprs_user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      return data.user;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setToken(null);
    }
  };

  const hasRole = (...roles: UserRole[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  const isOfficer = user?.role === 'OFFICER_CREATOR';
  const isReviewer = user?.role === 'REVIEWER';
  const isApprover = user?.role === 'APPROVING_AUTHORITY';
  const isKnowledgeAdmin = user?.role === 'KNOWLEDGE_ADMIN';
  const isAdmin = user?.role === 'SYSTEM_ADMIN';
  const isAuditor = user?.role === 'AUDITOR';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
        hasRole,
        isOfficer,
        isReviewer,
        isApprover,
        isKnowledgeAdmin,
        isAdmin,
        isAuditor,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
