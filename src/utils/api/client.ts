import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Base API configuration - use the exact URL as provided
const API_URL = 'https://backend-practice.eurisko.me/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 15000, // Increased timeout for slower mobile connections
});

// Request interceptor to add Authorization header
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        // Log when making authenticated requests without a token
        if (!config.url?.includes('/auth/login') && 
            !config.url?.includes('/auth/signup') && 
            !config.url?.includes('/auth/refresh-token')) {
          console.warn(`[API] Making request to ${config.url} without authentication token`);
        }
      }
      
      // Log outgoing requests for debugging
      console.log(`[API] Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, 
        config.params ? `Params: ${JSON.stringify(config.params)}` : '');
    } catch (error) {
      console.error('[API] Error retrieving access token:', error);
    }
    return config;
  },
  (error) => {
    console.error('[API] Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response) => {
    console.log(`[API] Response from ${response.config.url}: Status ${response.status}`);
    return response;
  },
  async (error) => {
    console.error(`[API] Error response:`, error.message);
    
    if (error.response) {
      console.error(`[API] Status: ${error.response.status}, URL: ${error.config.url}`);
    }
    
    const originalRequest = error.config;
    
    // If error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Get refresh token from storage
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        if (!refreshToken) {
          console.error('[API] Token refresh failed: No refresh token available');
          
          // If auth-related endpoint, don't remove tokens (user is trying to log in)
          if (!originalRequest.url?.includes('/auth/')) {
            // Clean up any leftover tokens since we can't refresh
            await AsyncStorage.removeItem('accessToken');
            await AsyncStorage.removeItem('refreshToken');
          }
          
          throw new Error('No refresh token available');
        }
        
        // Request new access token with a 1-day expiration
        const response = await axios.post(`${API_URL}/auth/refresh-token`, {
          refreshToken,
          token_expires_in: "1d"  // Set token to expire in 1 day
        });
        
        // Check if we got a valid response with new tokens
        if (!response.data?.data?.accessToken || !response.data?.data?.refreshToken) {
          throw new Error('Invalid token refresh response');
        }
        
        // Save new tokens
        const { accessToken, refreshToken: newRefreshToken } = response.data.data;
        await AsyncStorage.setItem('accessToken', accessToken);
        await AsyncStorage.setItem('refreshToken', newRefreshToken);
        
        console.log('[API] Token refreshed successfully');
        
        // Update Authorization header and retry request
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // If refresh failed, log out user (except for auth-related requests)
        if (!originalRequest.url?.includes('/auth/')) {
          await AsyncStorage.removeItem('accessToken');
          await AsyncStorage.removeItem('refreshToken');
        }
        console.error('[API] Token refresh failed:', refreshError);
        return Promise.reject(refreshError);
      }
    }
    
    // Add more descriptive error message for connection issues
    if (error.code === 'ECONNABORTED') {
      error.message = 'Request timed out. Please check your internet connection.';
    } else if (!error.response) {
      error.message = 'Network error. Server may be unavailable.';
    }
    
    return Promise.reject(error);
  }
);

export default apiClient; 