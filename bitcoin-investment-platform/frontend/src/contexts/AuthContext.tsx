import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import apiClient from '../services/api';

interface User {
  _id: string;
  email: string;
  role: string;
  twoFactorEnabled: boolean;
  // Add other user properties as needed
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
  setUser: (user: User | null) => void; // Allow updating user details, e.g., after 2FA setup
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUserState] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        try {
          const response = await apiClient.get('/auth/profile');
          setUserState(response.data);
        } catch (error) {
          console.error('Failed to load user profile', error);
          localStorage.removeItem('token');
          setTokenState(null);
          setUserState(null);
          apiClient.defaults.headers.common['Authorization'] = '';
        }
      }
      setIsLoading(false);
    };
    loadUser();
  }, [token]);

  const login = (newToken: string, userData: User) => {
    localStorage.setItem('token', newToken);
    setTokenState(newToken);
    setUserState(userData);
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setTokenState(null);
    setUserState(null);
    apiClient.defaults.headers.common['Authorization'] = '';
    // Optionally redirect to login page or homepage
    // window.location.href = '/login';
  };

  const setUser = (updatedUser: User | null) => {
    setUserState(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
