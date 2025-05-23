import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSignup, useLogin, useLogout, useVerifyOtp, useResendOtp, useForgotPassword } from '../utils/api';
import { useGetProfile, useUpdateProfile } from '../utils/api';
import { User } from '../utils/api/services/userService';

interface AuthContextType {
  isLoggedIn: boolean;
  pendingVerification: boolean;
  currentEmail: string;
  loading: boolean;
  user: User | null;
  error: string | null;
  signup: (email: string, password: string, firstName: string, lastName: string, profileImage?: any) => Promise<boolean>;
  login: (email: string, password: string) => Promise<boolean>;
  verify: (email: string, otp: string) => Promise<boolean>;
  resendOtp: (email: string) => Promise<boolean>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<boolean>;
  updateProfile: (firstName: string, lastName: string, profileImage?: any) => Promise<boolean>;
  setPendingVerification: (value: boolean) => void;
  setCurrentEmail: (email: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [currentEmail, setCurrentEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  // React Query hooks
  const signupMutation = useSignup();
  const loginMutation = useLogin();
  const logoutMutation = useLogout();
  const verifyOtpMutation = useVerifyOtp();
  const resendOtpMutation = useResendOtp();
  const forgotPasswordMutation = useForgotPassword();
  const updateProfileMutation = useUpdateProfile();
  
  const { data: profileData, isLoading: profileLoading } = useGetProfile();

  // Check for existing login on startup
  useEffect(() => {
    const checkLogin = async () => {
      try {
        const token = await AsyncStorage.getItem('accessToken');
        if (token) {
          setIsLoggedIn(true);
        }
      } catch (error) {
        console.error('Error checking login status:', error);
        // If token is invalid, clear it
        await AsyncStorage.removeItem('accessToken');
        await AsyncStorage.removeItem('refreshToken');
      } finally {
        setLoading(false);
      }
    };

    checkLogin();
  }, []);

  // Set user data when profile data is available
  useEffect(() => {
    if (profileData && profileData.data.user) {
      setUser(profileData.data.user);
    }
  }, [profileData]);

  const signup = async (email: string, password: string, firstName: string, lastName: string, profileImage?: any) => {
    setError(null);
    try {
      await signupMutation.mutateAsync({ email, password, firstName, lastName, profileImage });
      setPendingVerification(true);
      setCurrentEmail(email);
      return true;
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to sign up');
      console.error('Signup error:', error);
      return false;
    }
  };

  const login = async (email: string, password: string) => {
    setError(null);
    try {
      await loginMutation.mutateAsync({ email, password });
      setIsLoggedIn(true);
      setCurrentEmail(email);
      return true;
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to login');
      console.error('Login error:', error);
      return false;
    }
  };

  const verify = async (email: string, otp: string) => {
    setError(null);
    try {
      await verifyOtpMutation.mutateAsync({ email, otp });
      setPendingVerification(false);
      return true;
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to verify OTP');
      console.error('Verification error:', error);
      return false;
    }
  };

  const resendOtp = async (email: string) => {
    setError(null);
    try {
      await resendOtpMutation.mutateAsync({ email });
      return true;
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to resend OTP');
      console.error('Resend OTP error:', error);
      return false;
    }
  };

  const logout = async () => {
    setError(null);
    try {
      await logoutMutation.mutateAsync();
      setIsLoggedIn(false);
      setPendingVerification(false);
      setCurrentEmail('');
      setUser(null);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to logout');
      console.error('Logout error:', error);
    }
  };

  const forgotPassword = async (email: string) => {
    setError(null);
    try {
      await forgotPasswordMutation.mutateAsync({ email });
      return true;
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to process forgot password request');
      console.error('Forgot password error:', error);
      return false;
    }
  };

  const updateProfile = async (firstName: string, lastName: string, profileImage?: any) => {
    setError(null);
    try {
      const response = await updateProfileMutation.mutateAsync({ firstName, lastName, profileImage });
      if (response.data && response.data.user) {
        setUser(response.data.user);
      }
      return true;
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to update profile');
      console.error('Update profile error:', error);
      return false;
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        isLoggedIn, 
        pendingVerification, 
        currentEmail, 
        loading: loading || profileLoading || signupMutation.isPending || loginMutation.isPending,
        user,
        error,
        signup,
        login, 
        verify,
        resendOtp,
        logout,
        forgotPassword,
        updateProfile,
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