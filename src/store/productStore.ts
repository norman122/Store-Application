import { create } from 'zustand';
import { 
  Product, 
  ProductFilters,
  useGetProductById,
  useGetProducts,
  useSearchProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct
} from '../utils/api/services/productService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User } from '../utils/api/services/userService';

// Define a more flexible owner type for handling different API responses
interface ProductOwner extends Partial<User> {
  _id?: string;
  id?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImage?: {
    url: string;
  };
}

// Define store state
interface ProductState {
  currentProduct: Product | null;
  searchQuery: string;
  filters: ProductFilters;
  
  // Actions
  setCurrentProduct: (product: Product | null) => void;
  setSearchQuery: (query: string) => void;
  setFilters: (filters: ProductFilters) => void;
}

// Default filters
const DEFAULT_FILTERS: ProductFilters = {
  sortBy: 'createdAt',
  order: 'desc',
  category: 'all',
  inStock: false,
  minPrice: 0,
  maxPrice: 1000,
  page: 1,
  limit: 10
};

// Create the store
export const useProductStore = create<ProductState>((set) => ({
  currentProduct: null,
  searchQuery: '',
  filters: DEFAULT_FILTERS,
  
  // Actions
  setCurrentProduct: (product) => set({ currentProduct: product }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setFilters: (filters) => set((state) => ({ 
    filters: { ...state.filters, ...filters } 
  })),
}));

// Hook to fetch a single product
export const useProduct = (productId: string) => {
  console.log('[useProduct] Called with productId:', productId);
  
  const { data, isLoading, isError, error, refetch } = useGetProductById(productId);
  
  console.log('[useProduct] API Response:', data);
  
  // Handle different potential response structures
  let productData = null;
  
  if (data) {
    // Updated to match the actual API response structure from Postman
    if (data.data) {
      // Current API response structure: data.data contains the product
      productData = data.data;
    } else if ((data as any).product) {
      // Alternative structure: data.product
      productData = (data as any).product;
    } else if (typeof data === 'object' && 'title' in data) {
      // Direct product object
      productData = data as unknown as Product;
    }
    
    // Normalize owner structure if it exists
    if (productData && productData.owner) {
      const owner = productData.owner as ProductOwner;
      // If owner has _id but no id, copy _id to id for consistency
      if (owner._id && !owner.id) {
        owner.id = owner._id;
      }
    }
    
    // If product has user field but no owner field, copy user to owner
    if (productData && !productData.owner && (productData as any).user) {
      productData.owner = (productData as any).user;
      
      // Also normalize the id field
      const owner = productData.owner as ProductOwner;
      if (owner._id && !owner.id) {
        owner.id = owner._id;
      }
    }
  }
  
  console.log('[useProduct] Extracted product data:', productData);
  
  return {
    product: productData,
    isLoading,
    isError,
    error,
    refetch
  };
};

// Hook to fetch products with filters
export const useProductList = (filters: ProductFilters) => {
  // Get current page from the filters
  const page = filters?.page || 1;
  const limit = filters?.limit || 10;
  
  const { 
    data, 
    isLoading, 
    isError, 
    error,
    refetch
  } = useGetProducts(page, limit, filters);
  
  return {
    products: data?.data || [],
    pagination: data?.pagination,
    isLoading,
    isError,
    error,
    refetch
  };
};

// Hook for product search
export const useProductSearch = (query: string) => {
  const { data, isLoading, isError, error } = useSearchProducts(query);
  
  return {
    searchResults: data?.data || [],
    isSearchLoading: isLoading,
    isSearchError: isError,
    searchError: error
  };
};

// Hook for product mutations (create, update, delete)
export const useProductMutations = () => {
  const createProductMutation = useCreateProduct();
  const updateProductMutation = useUpdateProduct();
  const deleteProductMutation = useDeleteProduct();
  
  return {
    createProduct: createProductMutation.mutateAsync,
    updateProduct: updateProductMutation.mutateAsync,
    deleteProduct: deleteProductMutation.mutateAsync
  };
}; 