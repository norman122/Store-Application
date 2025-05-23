import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';

// Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profileImage?: {
    url: string;
  };
  isEmailVerified: boolean;
  createdAt: string;
}

interface UpdateProfileData {
  firstName: string;
  lastName: string;
  profileImage?: any;
}

// API functions
export const userApi = {
  getProfile: async (): Promise<{ success: boolean; data: { user: User } }> => {
    const response = await apiClient.get('/user/profile');
    return response.data;
  },
  
  getUserProfile: async (userId: string): Promise<{ success: boolean; data: { user: User } }> => {
    const response = await apiClient.get(`/user/profile/${userId}`);
    return response.data;
  },
  
  getUserByEmail: async (email: string): Promise<{ success: boolean; data: { user: User } }> => {
    try {
      // Since there's no direct endpoint for getting a user by email,
      // we'll use the search endpoint with the email parameter
      const response = await apiClient.get(`/user/search`, {
        params: { email }
      });
      return response.data;
    } catch (error) {
      console.error('[API] Error getting user by email:', error);
      throw error;
    }
  },
  
  updateProfile: async (data: UpdateProfileData) => {
    // Create a FormData object for multipart/form-data request
    const formData = new FormData();
    
    // Add text fields to the request body
    formData.append('firstName', data.firstName);
    formData.append('lastName', data.lastName);
    
    // Handle profile image
    if (data.profileImage && data.profileImage.uri) {
      // User is uploading a new image
      formData.append('profileImage', {
        uri: data.profileImage.uri,
        name: 'profile.jpg',
        type: 'image/jpeg',
      } as any);
    } else if (data.profileImage === null || data.profileImage === 'REMOVE') {
      // User wants to remove their profile image
      // Simply send the removeProfileImage flag
      formData.append('removeProfileImage', 'true');
    }
    // If profileImage is undefined, don't send anything (keep existing image)
    
    const token = await AsyncStorage.getItem('accessToken');
    
    try {
      // Send the request
      const response = await apiClient.put('/user/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`,
        },
      });
      
      return response.data;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },
};

// React Query hooks
export const useGetProfile = () => {
  const [enabled, setEnabled] = React.useState(false);
  
  // Only enable this query if we have an access token (user is logged in)
  React.useEffect(() => {
    const checkToken = async () => {
      try {
        const accessToken = await AsyncStorage.getItem('accessToken');
        setEnabled(!!accessToken);
      } catch (error) {
        console.error('Error checking access token:', error);
        setEnabled(false);
      }
    };
    
    checkToken();
  }, []);
  
  return useQuery({
    queryKey: ['user', 'profile'],
    queryFn: () => userApi.getProfile(),
    enabled: enabled, // Only run the query if we have a token
    retry: false, // Don't retry if the query fails
  });
};

export const useGetUserProfile = (userId: string) => {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => userApi.getUserProfile(userId),
    enabled: !!userId, // Only run the query if userId is provided
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: UpdateProfileData) => userApi.updateProfile(data),
    onSuccess: () => {
      // Invalidate user profile query to refetch with updated data
      queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
    },
  });
};

export const useGetUserByEmail = (email: string) => {
  return useQuery({
    queryKey: ['user', 'email', email],
    queryFn: () => userApi.getUserByEmail(email),
    enabled: !!email, // Only run the query if email is provided
  });
}; 