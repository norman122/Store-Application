import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import apiClient from '../client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from './userService';

// Types
export interface Product {
  _id: string;
  title: string;
  description: string;
  price: number;
  images: { url: string; _id: string }[];
  location: {
    name: string;
    latitude: number;
    longitude: number;
  };
  owner: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    profileImage?: {
      url: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

export interface ProductsResponse {
  success: boolean;
  data: Product[];
  pagination: {
    currentPage: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    totalItems: number;
    limit: number;
  };
}

export interface ProductResponse {
  success: boolean;
  data: Product;
}

export interface ProductFilters {
  sortBy?: string;
  order?: 'asc' | 'desc';
  category?: string;
  inStock?: boolean;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
}

interface ProductData {
  title: string;
  description: string;
  price: number;
  location: {
    name: string;
    latitude: number;
    longitude: number;
  };
}

// API functions
export const productApi = {
  getProducts: async (
    page: number = 1,
    limit: number = 10,
    filters: ProductFilters = {}
  ): Promise<ProductsResponse> => {
    const params = {
      page,
      limit,
      ...filters,
    };
    
    const response = await apiClient.get('/products', { params });
    return response.data;
  },
  
  searchProducts: async (query: string): Promise<ProductsResponse> => {
    console.log('[API] Search API called with query:', query);
    try {
      // Direct API call with explicit URL formatting
      const encodedQuery = encodeURIComponent(query);
      const url = `/products/search`;
      console.log(`[API] Making search request to: ${url} with query param: ${encodedQuery}`);
      
      const response = await apiClient.get(url, {
        params: { query: encodedQuery }
      });
      
      console.log('[API] Search response status:', response.status);
      console.log('[API] Search data received:', response.data ? 'Data present' : 'No data');
      
      if (!response.data || !response.data.data) {
        console.warn('[API] Search response missing data structure');
        return {
          success: true,
          data: [],
          pagination: {
            currentPage: 1,
            totalPages: 1,
            hasNextPage: false,
            hasPrevPage: false,
            totalItems: 0,
            limit: 10
          }
        };
      }
      
      return response.data;
    } catch (error: any) {
      console.error('[API] Search API error:', error.message);
      
      if (error.response) {
        console.error('[API] Error response status:', error.response.status);
      } else {
        console.error('[API] Network error - no response received');
      }
      
      // If the search endpoint fails, try falling back to the regular endpoint with a filter
      try {
        console.log('[API] Trying fallback to regular endpoint with filter');
        const fallbackResponse = await apiClient.get('/products', {
          params: { 
            title: query,
            limit: 20
          }
        });
        console.log('[API] Fallback response received');
        return fallbackResponse.data;
      } catch (fallbackError: any) {
        console.error('[API] Fallback request also failed:', fallbackError.message);
        // Return empty result structure instead of throwing
        return {
          success: true,
          data: [],
          pagination: {
            currentPage: 1,
            totalPages: 1,
            hasNextPage: false,
            hasPrevPage: false,
            totalItems: 0,
            limit: 10
          }
        };
      }
    }
  },
  
  getProductById: async (id: string): Promise<ProductResponse> => {
    console.log('[productApi.getProductById] Making API call for id:', id);
    
    if (!id) {
      console.error('[productApi.getProductById] Invalid product ID:', id);
      throw new Error('Invalid product ID');
    }
    
    try {
      // Add timeout to the request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await apiClient.get(`/products/${id}`, {
        signal: controller.signal
      });
      
      // Clear the timeout
      clearTimeout(timeoutId);
      
      console.log('[productApi.getProductById] API response:', response.data);
      
      // Validate the response
      if (!response.data || (!response.data.data && !response.data.success)) {
        console.error('[productApi.getProductById] Invalid response format:', response.data);
        throw new Error('Invalid response format from server');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('[productApi.getProductById] API error:', error);
      
      // Handle different error types
      if (error.name === 'AbortError') {
        throw new Error('Request timed out. Please try again.');
      } else if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('[productApi.getProductById] Server error:', error.response.status, error.response.data);
        
        if (error.response.status === 404) {
          throw new Error('Product not found');
        } else {
          throw new Error(`Server error: ${error.response.status}`);
        }
      } else if (error.request) {
        // The request was made but no response was received
        console.error('[productApi.getProductById] Network error - no response');
        throw new Error('Network error. Please check your connection.');
      } else {
        // Something happened in setting up the request that triggered an Error
        throw error;
      }
    }
  },
  
  createProduct: async (productData: ProductData, images: any[]) => {
    const formData = new FormData();
    
    // Append product data
    formData.append('title', productData.title);
    formData.append('description', productData.description);
    formData.append('price', productData.price.toString());
    
    // Add location
    formData.append('location', JSON.stringify(productData.location));
    
    // Append images
    images.forEach((image, index) => {
      formData.append('images', {
        uri: image.uri,
        name: image.fileName || `image${index}.jpg`,
        type: image.type || 'image/jpeg',
      });
    });
    
    const token = await AsyncStorage.getItem('accessToken');
    
    const response = await apiClient.post('/products', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`,
      },
    });
    
    return response.data;
  },
  
  updateProduct: async (id: string, productData: ProductData, allImages: any[]) => {
    // First, identify existing vs new images
    const existingImages = allImages.filter(img => img._id);
    const newImages = allImages.filter(img => img.uri);
    
    console.log(`Processing ${existingImages.length} existing images and ${newImages.length} new images`);
    
    // Create a new FormData instance
    const formData = new FormData();
    
    // Add basic product data
    formData.append('title', productData.title);
    formData.append('description', productData.description);
    formData.append('price', productData.price.toString());
    formData.append('location', JSON.stringify(productData.location));
    
    // Extract existing image IDs (the backend only needs these)
    if (existingImages.length > 0) {
      // For Eurisko backend, they most likely expect a field called 'existingImages'
      const existingImageIds = existingImages.map(img => img._id).filter(Boolean);
      
      if (existingImageIds.length > 0) {
        console.log('Sending existing image IDs:', existingImageIds);
        
        // Try multiple formats to see which one works
        
        // Format 1: JSON array in a field called 'existingImages'
        formData.append('existingImages', JSON.stringify(existingImageIds));
        
        // Format 2: Individual fields for each ID
        existingImageIds.forEach((id, index) => {
          formData.append(`existingImages[${index}]`, id);
        });
        
        // Format 3: Simple comma-separated string
        formData.append('imageIds', existingImageIds.join(','));
      }
    }
    
    // Add new images - using the standard field name 'images'
    if (newImages.length > 0) {
      console.log(`Adding ${newImages.length} new images`);
      
      newImages.forEach((image, index) => {
        const file = {
          uri: image.uri,
          name: image.fileName || `image${index}.jpg`,
          type: image.type || 'image/jpeg'
        };
        
        // Use the field name 'images' which is what most backends expect
        formData.append('images', file);
      });
    }
    
    // Get the auth token
    const token = await AsyncStorage.getItem('accessToken');
    
    // Log the full request for debugging
    console.log('Request URL:', `/products/${id}`);
    console.log('Existing images IDs:', existingImages.map(img => img._id));
    console.log('New images count:', newImages.length);
    
    try {
      const response = await apiClient.put(`/products/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`,
        },
      });
      
      console.log('API response status:', response.status);
      console.log('Update successful!');
      
      return response.data;
    } catch (error: any) {
      console.error('API error:', error.message);
      
      if (error.response) {
        console.error('Error status:', error.response.status);
        console.error('Error data:', error.response.data);
      }
      
      throw error;
    }
  },
  
  deleteProduct: async (id: string) => {
    const response = await apiClient.delete(`/products/${id}`);
    return response.data;
  },
};

// React Query hooks
export const useGetProducts = (page: number = 1, limit: number = 10, filters: ProductFilters = {}) => {
  return useQuery({
    queryKey: ['products', page, limit, filters],
    queryFn: () => productApi.getProducts(page, limit, filters),
  });
};

export const useInfiniteProducts = (limit: number = 10, filters: ProductFilters = {}) => {
  return useInfiniteQuery({
    queryKey: ['products', 'infinite', limit, filters],
    queryFn: ({ pageParam = 1 }) => productApi.getProducts(pageParam, limit, filters),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.hasNextPage) {
        return lastPage.pagination.currentPage + 1;
      }
      return undefined;
    },
  });
};

export const useSearchProducts = (query: string) => {
  return useQuery({
    queryKey: ['products', 'search', query],
    queryFn: () => productApi.searchProducts(query),
    enabled: query.length > 0, // Only run the query if search term is provided
  });
};

export const useGetProductById = (id: string) => {
  console.log('[useGetProductById] Called with id:', id);
  
  return useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      try {
        // Add logging for debugging
        console.log('[useGetProductById] Fetching product with ID:', id);
        
        // Attempt to get the product
        const response = await productApi.getProductById(id);
        
        // Check if the response contains valid data
        if (!response || (!response.data && !response.success)) {
          console.error('[useGetProductById] Invalid response format:', response);
          throw new Error('Invalid response from server');
        }
        
        return response;
      } catch (error) {
        console.error('[useGetProductById] Error fetching product:', error);
        throw error;
      }
    },
    enabled: !!id, // Only run the query if id is provided
    retry: 2, // Retry failed requests up to 2 times
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000), // Exponential backoff
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ productData, images }: { productData: ProductData; images: any[] }) => 
      productApi.createProduct(productData, images),
    onSuccess: () => {
      // Invalidate products queries to refetch with the new product
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      id, 
      productData, 
      allImages
    }: { 
      id: string; 
      productData: ProductData; 
      allImages: any[];
    }) => 
      productApi.updateProduct(id, productData, allImages),
    onSuccess: (_, variables) => {
      // Invalidate specific product query and products list
      queryClient.invalidateQueries({ queryKey: ['product', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => productApi.deleteProduct(id),
    onSuccess: (_, id) => {
      // Invalidate specific product query and products list
      queryClient.invalidateQueries({ queryKey: ['product', id] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}; 