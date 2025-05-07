import React, { createContext, useState, useContext, ReactNode } from 'react';

interface AuthContextType {
  isLoggedIn: boolean;
  pendingVerification: boolean;
  currentEmail: string;
  login: (username: string, password: string) => boolean;
  verify: (email: string, code: string) => boolean;
  logout: () => void;
  setPendingVerification: (value: boolean) => void;
  setCurrentEmail: (email: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [currentEmail, setCurrentEmail] = useState('');

  const login = (username: string, password: string) => {
    // Check if credentials match
    if (username === 'eurisko@gmail.com' && password === 'Academy2025') {
      // Don't set logged in yet, we need verification first
      setPendingVerification(true);
      setCurrentEmail(username);
      return true;
    }
    return false;
  };

  const verify = (email: string, code: string) => {
    // Verify the code is correct - any email is accepted with the demo code
    if (code === '1234') {
      setPendingVerification(false);
      setIsLoggedIn(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsLoggedIn(false);
    setPendingVerification(false);
    setCurrentEmail('');
  };

  return (
    <AuthContext.Provider 
      value={{ 
        isLoggedIn, 
        pendingVerification, 
        currentEmail, 
        login, 
        verify, 
        logout,
        setPendingVerification,
        setCurrentEmail
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 