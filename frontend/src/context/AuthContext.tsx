import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { authService } from '../services/api';
import { AuthContext, AuthContextType } from './authContextDef';

export type { AuthContextType };

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('fuji_flow_user');
      if (!saved || saved === 'undefined' || saved === 'null') {
        return null;
      }
      return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse fuji_flow_user from localStorage:', e);
      localStorage.removeItem('fuji_flow_user');
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    const saved = localStorage.getItem('fuji_flow_token');
    if (!saved || saved === 'undefined' || saved === 'null') {
      return null;
    }
    return saved;
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    const verifyAuth = async () => {
      if (token) {
        try {
          const profile = await authService.getProfile();
          if (isMounted) {
            setUser(profile);
            localStorage.setItem('fuji_flow_user', JSON.stringify(profile));
          }
        } catch {
          if (isMounted) {
            setToken(null);
            setUser(null);
            localStorage.removeItem('fuji_flow_token');
            localStorage.removeItem('fuji_flow_user');
          }
        }
      } else {
        if (isMounted) {
          setUser(null);
        }
      }
      if (isMounted) {
        setIsLoading(false);
      }
    };
    verifyAuth();
    return () => {
      isMounted = false;
    };
  }, [token]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const authData = await authService.login(email, password);
      setToken(authData.access_token);
      setUser(authData.user);
      localStorage.setItem('fuji_flow_token', authData.access_token);
      localStorage.setItem('fuji_flow_user', JSON.stringify(authData.user));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('fuji_flow_token');
    localStorage.removeItem('fuji_flow_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
