import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

interface User {
  id: string;
  email: string;
  maxDocuments: number;
  isGuest?: boolean;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string, isGuest?: boolean) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
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
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Set up axios defaults
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Check if user is logged in on app start
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const response = await axios.get('/api/auth/me');
          // Handle new professional response format
          const userData = response.data.data?.user || response.data.user;
          setUser(userData);
        } catch (error) {
          localStorage.removeItem('token');
          setToken(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [token]);

  const login = async (email: string, password: string, isGuest = false) => {
    try {
      let response;
      if (isGuest) {
        response = await axios.post('/api/auth/guest');
      } else {
        response = await axios.post('/api/auth/login', { email, password });
      }
      
      // Handle new professional response format
      const responseData = response.data;
      const { token: newToken, user: userData } = responseData.data || responseData;
      
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
    } catch (error: any) {
      // Handle new professional error format
      const errorMessage = error.response?.data?.error?.message || 
                          error.response?.data?.message || 
                          'Login failed';
      throw new Error(errorMessage);
    }
  };

  const signup = async (email: string, password: string) => {
    try {
      const response = await axios.post('/api/auth/register', { email, password });
      
      // Handle new professional response format
      const responseData = response.data;
      const { token: newToken, user: userData } = responseData.data || responseData;
      
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
    } catch (error: any) {
      // Handle new professional error format
      const errorMessage = error.response?.data?.error?.message || 
                          error.response?.data?.message || 
                          'Signup failed';
      throw new Error(errorMessage);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    login,
    signup,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
