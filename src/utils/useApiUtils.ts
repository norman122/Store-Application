import { queryClient } from './api/queryProvider';

/**
 * Hook to provide access to common API utilities like the queryClient
 */
export const useApiUtils = () => {
  return {
    queryClient,
  };
}; 