import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  uid: string;
  email: string;
  username: string;
  bio?: string;
  memberSince: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  signup: (email: string, pass: string, username: string) => Promise<void>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate checking local storage for existing session
    const storedUser = localStorage.getItem('hmo_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, _pass: string) => {
    // Simulated login
    const dummyUser: User = {
      uid: '123',
      email: email,
      username: 'AnonymousOwl',
      memberSince: 'February 2026',
      bio: 'Sharing my thoughts quietly.'
    };
    setUser(dummyUser);
    localStorage.setItem('hmo_user', JSON.stringify(dummyUser));
  };

  const signup = async (email: string, _pass: string, username: string) => {
    // Simulated signup
    const newUser: User = {
      uid: Math.random().toString(36).substr(2, 9),
      email: email,
      username: username,
      memberSince: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    };
    setUser(newUser);
    localStorage.setItem('hmo_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('hmo_user');
  };

  const updateProfile = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      localStorage.setItem('hmo_user', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateProfile }}>
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
