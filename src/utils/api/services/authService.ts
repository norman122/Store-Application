import { useMutation } from '@tanstack/react-query';
import apiClient from '../client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { queryClient } from '../queryProvider';
import { productApi } from './productService';

// Types
interface SignupData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  profileImage?: any;
}

interface LoginData {
  email: string;
  password: string;
  token_expires_in?: string;
}

interface VerifyOtpData {
  email: string;
  otp: string;
}

interface ResendOtpData {
  email: string;
}

interface ForgotPasswordData {
  email: string;
}

// API functions
export const authApi = {
  signup: async (data: SignupData) => {
    const formData = new FormData();
    formData.append('email', data.email);
    formData.append('password', data.password);
    formData.append('firstName', data.firstName);
    formData.append('lastName', data.lastName);
    
    if (data.profileImage) {
      formData.append('profileImage', {
        uri: data.profileImage.uri,
        name: data.profileImage.fileName || 'image.jpg',
        type: data.profileImage.type || 'image/jpeg',
      });
    }
    
    const response = await apiClient.post('/auth/signup', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  },
  
  login: async (data: LoginData) => {
    console.log('AuthAPI login call with:', data);
    
    // Implement basic retry logic for server errors
    let attempts = 0;
    const maxAttempts = 2;
    
    while (attempts < maxAttempts) {
      try {
        attempts++;
        console.log(`[Auth] Login attempt ${attempts}/${maxAttempts}`);
        
        const response = await apiClient.post('/auth/login', data);
        console.log('[Auth] Login response received');
        
        // Get the full response data from the server
        const responseData = response.data;
        
        // Make sure response has the expected format
        if (!responseData || !responseData.success || !responseData.data) {
          console.error('[Auth] Invalid login response format:', responseData);
          throw new Error('Invalid login response format');
        }
        
        // Store tokens
        const { accessToken, refreshToken } = responseData.data;
        
        if (!accessToken || !refreshToken) {
          console.error('[Auth] Missing tokens in login response');
          throw new Error('Missing tokens in login response');
        }
        
        console.log('[Auth] Tokens received successfully, storing...');
        
        // Store the tokens in AsyncStorage
        await AsyncStorage.setItem('accessToken', accessToken);
        await AsyncStorage.setItem('refreshToken', refreshToken);
        
        console.log('[Auth] Tokens stored successfully');
        
        // Return just the data part of the response
        return responseData;
      } catch (error: any) {
        console.error(`[Auth] Login error (attempt ${attempts}/${maxAttempts}):`, error.message);
        
        // If this is a server error (5xx) and we haven't exceeded max attempts, retry
        const isServerError = error.response && error.response.status >= 500 && error.response.status < 600;
        
        if (isServerError && attempts < maxAttempts) {
          console.log(`[Auth] Server error detected (${error.response.status}), retrying in 1 second...`);
          // Wait 1 second before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }
        
        // If it's not a server error or we've exceeded max attempts, throw the error
        throw error;
      }
    }
    
    // This should never be reached due to the loop logic, but TypeScript needs it
    throw new Error('Login failed after multiple attempts');
  },
  
  logout: async () => {
    await AsyncStorage.removeItem('accessToken');
    await AsyncStorage.removeItem('refreshToken');
    
    // Clear all queries in the cache
    queryClient.clear();
    
    return { success: true };
  },
  
  verifyOtp: async (data: VerifyOtpData) => {
    const response = await apiClient.post('/auth/verify-otp', data);
    return response.data;
  },
  
  resendOtp: async (data: ResendOtpData) => {
    const response = await apiClient.post('/auth/resend-verification-otp', data);
    return response.data;
  },
  
  forgotPassword: async (data: ForgotPasswordData) => {
    const response = await apiClient.post('/auth/forgot-password', data);
    return response.data;
  },
  
  refreshToken: async (refreshToken: string) => {
    const response = await apiClient.post('/auth/refresh-token', { refreshToken });
    
    // Store new tokens
    const { accessToken, refreshToken: newRefreshToken } = response.data.data;
    await AsyncStorage.setItem('accessToken', accessToken);
    await AsyncStorage.setItem('refreshToken', newRefreshToken);
    
    return response.data;
  },
};

// React Query hooks
export const useSignup = () => {
  return useMutation({
    mutationFn: (data: SignupData) => authApi.signup(data),
  });
};

export const useLogin = () => {
  return useMutation({
    mutationFn: async (data: LoginData) => {
      const result = await authApi.login(data);
      console.log('useLogin mutation result:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('Login mutation success:', data);
      // Invalidate relevant queries after successful login
      queryClient.invalidateQueries({ queryKey: ['user'] });
      
      // Also invalidate product queries to ensure fresh data after login
      console.log('Invalidating product queries after successful login');
      queryClient.invalidateQueries({ queryKey: ['products'] });
      
      // Prefetch first page of products (this will happen in background)
      console.log('Prefetching products after login');
      queryClient.prefetchQuery({
        queryKey: ['products', 1, 10, { sortBy: 'createdAt', order: 'desc' }],
        queryFn: () => productApi.getProducts(1, 10, { sortBy: 'createdAt', order: 'desc' }),
      });
    },
    onError: (error) => {
      console.error('Login mutation error:', error);
    }
  });
};

export const useLogout = () => {
  return useMutation({
    mutationFn: () => authApi.logout(),
  });
};

export const useVerifyOtp = () => {
  return useMutation({
    mutationFn: (data: VerifyOtpData) => authApi.verifyOtp(data),
  });
};

export const useResendOtp = () => {
  return useMutation({
    mutationFn: (data: ResendOtpData) => authApi.resendOtp(data),
  });
};

export const useForgotPassword = () => {
  return useMutation({
    mutationFn: (data: ForgotPasswordData) => authApi.forgotPassword(data),
  });
}; 