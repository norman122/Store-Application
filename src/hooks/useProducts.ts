import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productApi } from '../utils/api/services/productService';

// Interface matching the ProductImage from EditProductScreen
interface ProductImage {
  uri: string;
  type: string;
  name: string;
  _id?: string;
  url?: string;
  fileName?: string;
  id?: string;
}

// Product details hook
export const useProductDetails = (productId: string) => {
  return useQuery({
    queryKey: ['product', productId],
    queryFn: () => productApi.getProductById(productId),
    enabled: !!productId,
  });
};

// Update product hook
export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { 
      id: string; 
      data: {
        title: string;
        description: string;
        price: number;
        location: string | object;
        images: ProductImage[];
      }
    }) => {
      // Process the location data
      let locationObject;
      if (typeof data.location === 'string') {
        try {
          locationObject = JSON.parse(data.location);
        } catch (e) {
          console.error('Failed to parse location string:', e);
          throw new Error('Invalid location format');
        }
      } else {
        locationObject = data.location;
      }
      
      // Separate existing and new images
      const existingImages = data.images.filter(img => img._id);
      const newImages = data.images.filter(img => !img._id);
      
      console.log(`Processing images: ${existingImages.length} existing, ${newImages.length} new`);
      
      // Format existing images for the API (only need _id for existing images)
      const processedExistingImages = existingImages.map(img => ({
        _id: img._id,
        url: img.url
      }));
      
      // Format new images for the API (need uri, name, type for upload)
      const processedNewImages = newImages.map(img => ({
        uri: img.uri,
        type: img.type || 'image/jpeg',
        name: img.name || img.fileName || `image-${Date.now()}.jpg`,
        id: img.id || `new-image-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
      }));
      
      // Create the product data object
      const productData = {
        title: data.title,
        description: data.description,
        price: data.price,
        location: locationObject
      };
      
      // Log what's being sent (helpful for debugging)
      console.log('Sending to productApi.updateProduct:', {
        id,
        existingImagesCount: processedExistingImages.length,
        newImagesCount: processedNewImages.length,
      });
      
      // Call the API with the combined data
      return productApi.updateProduct(
        id, 
        productData, 
        [...processedExistingImages, ...processedNewImages]
      );
    },
    onSuccess: (_, variables) => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['product', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}; 