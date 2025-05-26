import apiClient from './client';
import { QueryProvider, queryClient } from './queryProvider';

// Auth services
export * from './services/authService';
export { authApi } from './services/authService';

// User services
export * from './services/userService';

// Product services
export * from './services/productService';

export { apiClient, QueryProvider, queryClient }; 