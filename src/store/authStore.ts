import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  useSignup, 
  useLogin, 
  useLogout, 
  useVerifyOtp, 
  useResendOtp, 
  useForgotPassword,
  useGetProfile,
  useUpdateProfile,
  authApi
} from '../utils/api';
import { User } from '../utils/api/services/userService';
import { queryClient } from '../utils/api/queryProvider';
import { useEffect } from 'react';

// Define the store state
interface AuthState {
  isLoggedIn: boolean;
  pendingVerification: boolean;
  currentEmail: string;
  user: User | null;
  error: string | null;
  initialized: boolean;
  
  // Actions
  setIsLoggedIn: (value: boolean) => void;
  setPendingVerification: (value: boolean) => void;
  setCurrentEmail: (email: string) => void;
  setUser: (user: User | null) => void;
  setError: (error: string | null) => void;
  setInitialized: (value: boolean) => void;
  
  // Reset store
  reset: () => void;
}

// Create store with persist middleware
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isLoggedIn: false,
      pendingVerification: false,
      currentEmail: '',
      user: null,
      error: null,
      initialized: false,
      
      // Actions
      setIsLoggedIn: (value) => set({ isLoggedIn: value }),
      setPendingVerification: (value) => set({ pendingVerification: value }),
      setCurrentEmail: (email) => set({ currentEmail: email }),
      setUser: (user) => set({ user }),
      setError: (error) => set({ error }),
      setInitialized: (value) => set({ initialized: value }),
      
      // Reset store
      reset: () => set({
        isLoggedIn: false,
        pendingVerification: false,
        currentEmail: '',
        user: null,
        error: null,
        initialized: true,
      }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist these fields
      partialize: (state) => ({
        isLoggedIn: state.isLoggedIn,
        pendingVerification: state.pendingVerification,
        currentEmail: state.currentEmail,
        initialized: state.initialized,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setInitialized(true);
        }
      },
    }
  )
);

// Auth service hook that combines React Query with the store
export function useAuth() {
  // Get store state and actions
  const { 
    isLoggedIn, 
    pendingVerification, 
    currentEmail, 
    user, 
    error,
    initialized,
    setIsLoggedIn,
    setPendingVerification,
    setCurrentEmail,
    setUser,
    setError,
    setInitialized,
    reset
  } = useAuthStore();

  // React Query hooks - Only use profile data if logged in
  const signupMutation = useSignup();
  const loginMutation = useLogin();
  const logoutMutation = useLogout();
  const verifyOtpMutation = useVerifyOtp();
  const resendOtpMutation = useResendOtp();
  const forgotPasswordMutation = useForgotPassword();
  const updateProfileMutation = useUpdateProfile();
  
  // Only get profile if logged in
  const { data: profileData, isLoading: profileLoading } = useGetProfile();

  // Initialize auth state if not already done
  useEffect(() => {
    const initAuth = async () => {
      try {
        // If we're already initialized, don't do anything
        if (initialized) return;
        
        console.log('[Auth] Initializing auth state...');
        
        // Check if we have both tokens
        const accessToken = await AsyncStorage.getItem('accessToken');
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        
        console.log(`[Auth] Token check: accessToken=${!!accessToken}, refreshToken=${!!refreshToken}`);
        
        if (accessToken && refreshToken) {
          console.log('[Auth] Valid tokens found, setting logged in state');
          setIsLoggedIn(true);
        } else {
          // If either token is missing, clear both tokens to ensure consistency
          if (accessToken || refreshToken) {
            console.log('[Auth] Token inconsistency detected, resetting auth state');
            await AsyncStorage.removeItem('accessToken');
            await AsyncStorage.removeItem('refreshToken');
          } else {
            console.log('[Auth] No tokens found, user is not logged in');
          }
          setIsLoggedIn(false);
        }
        
        // Mark as initialized
        setInitialized(true);
        console.log('[Auth] Initialization complete, isLoggedIn:', accessToken && refreshToken);
      } catch (error) {
        console.error('[Auth] Error initializing auth:', error);
        // If there's an error, clear tokens and reset state
        await AsyncStorage.removeItem('accessToken');
        await AsyncStorage.removeItem('refreshToken');
        reset();
      }
    };
    
    initAuth();
  }, [initialized, setIsLoggedIn, setInitialized, reset]);

  // Set user data when profile data is available
  useEffect(() => {
    if (profileData?.data?.user && isLoggedIn) {
      setUser(profileData.data.user);
    }
  }, [profileData, isLoggedIn, setUser]);

  // Auth methods
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
      console.log('Attempting login with email:', email);
      
      // First, ensure any old tokens are cleared
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('refreshToken');
      
      // Call the login API with token expiration parameter
      const response = await loginMutation.mutateAsync({ 
        email, 
        password,
        token_expires_in: "1y"  // Add token expiration to match your Postman request
      });
      
      // LOG FULL RESPONSE for debugging
      console.log('Login API full response:', JSON.stringify(response));
      
      // IMPORTANT: React Query wraps API responses, so we need to extract carefully
      // response is the API response wrapped by React Query
      // response.data is the actual API response body from the server
      
      // Make sure response exists and has data property
      if (!response) {
        throw new Error('Empty response from login API');
      }
      
      // Extract success and data from the server response
      const { success, data } = response;
      
      console.log('Login response parsed:', { success, data });
      
      // Verify that both tokens were received
      if (!success || !data || !data.accessToken || !data.refreshToken) {
        console.error('Invalid auth response format:', JSON.stringify(response));
        throw new Error('Invalid authentication response format');
      }
      
      const { accessToken, refreshToken } = data;
      console.log('Access token retrieved successfully');
      
      console.log('Storing tokens...');
      
      // Store tokens directly
      await AsyncStorage.setItem('accessToken', accessToken);
      await AsyncStorage.setItem('refreshToken', refreshToken);
      
      // Verify the tokens were stored
      const storedAccessToken = await AsyncStorage.getItem('accessToken');
      const storedRefreshToken = await AsyncStorage.getItem('refreshToken');
      
      if (!storedAccessToken || !storedRefreshToken) {
        throw new Error('Failed to verify token storage');
      }
      
      console.log('Token storage verified successfully');
      
      // Invalidate product queries to make sure they're fresh after login
      queryClient.invalidateQueries({ queryKey: ['products'] });
      console.log('Product queries invalidated after login');
      
      setIsLoggedIn(true);
      setCurrentEmail(email);
      return true;
    } catch (error: any) {
      console.error('Login error details:', error);
      
      // Handle different types of errors with user-friendly messages
      let errorMessage = 'Failed to login';
      
      if (error.response) {
        console.error('Server response:', error.response.status, JSON.stringify(error.response.data));
        
        // Handle different error status codes
        const status = error.response.status;
        
        if (status >= 500) {
          // Server errors (including 521 Cloudflare errors)
          errorMessage = 'Server temporarily unavailable. Please try again in a moment.';
        } else if (status === 401 || status === 403) {
          // Authentication errors
          errorMessage = 'Invalid email or password';
        } else if (status === 429) {
          // Rate limiting
          errorMessage = 'Too many login attempts. Please try again later.';
        } else if (error.response.data?.message) {
          // Use server provided message if available
          errorMessage = error.response.data.message;
        }
      } else if (error.request) {
        console.error('No response received from server. Request:', error.request);
        errorMessage = 'Network error. Please check your internet connection.';
      } else {
        console.error('Error setting up request:', error.message);
        errorMessage = error.message || 'An unexpected error occurred';
      }
      
      setError(errorMessage);
      return false;
    }
  };

  const verify = async (email: string, otp: string) => {
    setError(null);
    try {
      await verifyOtpMutation.mutateAsync({ email, otp });
      setPendingVerification(false);
      
      // After successful verification, set isLoggedIn to true
      // This will automatically redirect to the products screen
      setIsLoggedIn(true);
      
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
      // First clear React Query cache to prevent stale queries
      queryClient.clear();
      
      // Then remove tokens from AsyncStorage
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('refreshToken');
      
      // Execute the logout API call but don't wait for it
      // This prevents potential hanging if the API is slow
      logoutMutation.mutate();
      
      // Finally reset the auth state
      reset();
      
      return true;
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to logout');
      console.error('Logout error:', error);
      return false;
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

  // Add a utility function to check token status
  const checkTokens = async () => {
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      
      return {
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
        isValid: !!accessToken && !!refreshToken
      };
    } catch (error) {
      console.error('Error checking tokens:', error);
      return {
        hasAccessToken: false,
        hasRefreshToken: false,
        isValid: false
      };
    }
  };

  // Add a utility function to manually refresh the token
  const refreshTokenManually = async (expiresIn: string = "1m") => {
    setError(null);
    try {
      // Get the current refresh token
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }
      
      console.log('[Auth] Attempting to manually refresh token');
      
      // Call the API to refresh the token
      // Directly pass the refreshToken object to match the API signature
      const response = await authApi.refreshToken(refreshToken);
      
      // Verify that both tokens were received
      if (!response.data || !response.data.accessToken || !response.data.refreshToken) {
        console.error('[Auth] Invalid refresh token response:', response);
        throw new Error('Invalid authentication response: missing tokens');
      }
      
      const { accessToken, refreshToken: newRefreshToken } = response.data;
      
      // Ensure tokens are stored (they should be stored by the API function already)
      await AsyncStorage.setItem('accessToken', accessToken);
      await AsyncStorage.setItem('refreshToken', newRefreshToken);
      
      console.log('[Auth] Token refreshed successfully');
      
      return {
        success: true,
        accessToken,
        refreshToken: newRefreshToken
      };
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to refresh token';
      console.error('[Auth] Manual token refresh error:', errorMessage);
      
      setError(errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  };

  // Return the combined auth API
  return {
    // State
    isLoggedIn,
    pendingVerification,
    currentEmail,
    user,
    error,
    initialized,
    loading: !initialized || (isLoggedIn && profileLoading),
    
    // Methods
    signup,
    login,
    verify,
    resendOtp,
    logout,
    forgotPassword,
    updateProfile,
    checkTokens,
    refreshTokenManually,
    
    // Store actions (for direct manipulation if needed)
    setPendingVerification,
    setCurrentEmail,
    setInitialized,
  };
} 