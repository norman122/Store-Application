import { Alert, Platform } from 'react-native';
import { Share as RNShare } from 'react-native';
import Share from 'react-native-share';
import { Product, productApi } from './api/services/productService';

export interface ShareOptions {
  title: string;
  message: string;
  subject?: string;
}

export class ShareUtils {
  // Base URL for web landing pages - your actual Netlify URL
  private static readonly WEB_BASE_URL = 'https://snazzy-tiramisu-5b248e.netlify.app';
  
  /**
   * Generate a deep link for a product
   */
  static generateProductDeepLink(productId: string): string {
    return `storeapp://product/${productId}`;
  }

  /**
   * Generate a web landing page URL that redirects to the app
   */
  static generateProductWebLink(productId: string): string {
    return `${this.WEB_BASE_URL}/product/${productId}`;
  }

  /**
   * Generate a temporary clickable link with instructions (fallback)
   */
  static generateInstructionLink(productId: string): string {
    const deepLink = this.generateProductDeepLink(productId);
    // This creates a simple instruction that users can follow
    return `To view this product, copy and paste this link in your browser: ${deepLink} (or search for "StoreApp" in your app store)`;
  }

  /**
   * Generate a detailed share message without URLs (URLs will be handled separately)
   */
  static generateProductShareMessage(product: Product): string {
    return `🛍️ Check out this amazing product: ${product.title} for $${product.price.toLocaleString()}!\n\n📍 Location: ${product.location?.name || 'Unknown'}\n\n👆 Tap the link to view this product!\n\n💡 If you don't have StoreApp installed, the link will help you download it!`;
  }

  /**
   * Generate a simple share message without URLs (URLs will be handled separately)
   */
  static generateSimpleProductShareMessage(product: Product): string {
    return `🛍️ Check out "${product.title}" for $${product.price.toLocaleString()} on StoreApp!\n\n📍 ${product.location?.name || 'Unknown location'}\n\n👆 Tap the link to view this product!`;
  }

  /**
   * Share a product using the native share functionality
   */
  static async shareProduct(product: Product, useSimpleMessage: boolean = true): Promise<boolean> {
    try {
      const shareMessage = useSimpleMessage 
        ? this.generateSimpleProductShareMessage(product)
        : this.generateProductShareMessage(product);
      
      const webLink = this.generateProductWebLink(product._id);
      
      // Debug logs
      console.log('ShareUtils - Product ID:', product._id);
      console.log('ShareUtils - Generated web link:', webLink);
      console.log('ShareUtils - Share message:', shareMessage);
        
      const shareOptions: ShareOptions = {
        title: `${product.title} - $${product.price.toLocaleString()}`,
        message: shareMessage,
        subject: `Check out ${product.title} on StoreApp`,
      };

      // For react-native-share, we can also include the URL separately
      const enhancedShareOptions = {
        ...shareOptions,
        url: webLink, // This will be treated as a clickable link on many platforms
      };
      
      console.log('ShareUtils - Enhanced share options:', enhancedShareOptions);

      // Try react-native-share first (more features)
      try {
        const result = await Share.open(enhancedShareOptions);
        console.log('Share result:', result);
        return true;
      } catch (shareError) {
        console.log('react-native-share failed, trying fallback:', shareError);
        
        // Fallback to React Native's built-in Share
        const fallbackOptions = {
          title: shareOptions.title,
          message: shareOptions.message,
          url: webLink, // Include URL in fallback too
        };
        
        const result = await RNShare.share(fallbackOptions);
        
        if (result.action === RNShare.sharedAction) {
          console.log('Product shared successfully via fallback');
          return true;
        } else if (result.action === RNShare.dismissedAction) {
          console.log('Share dismissed');
          return false;
        }
      }
    } catch (error) {
      console.error('All share methods failed:', error);
      
      // Final fallback: Show alert with share information
      Alert.alert(
        'Share Product',
        `🛍️ ${product.title} - $${product.price.toLocaleString()}\n\n🔗 Web link: ${this.generateProductWebLink(product._id)}\n\n📱 App link: ${this.generateProductDeepLink(product._id)}`,
        [{ text: 'OK' }]
      );
      return false;
    }
    
    return false;
  }

  /**
   * Share an image with optional product context
   */
  static async shareImage(imageUrl: string, product?: Product): Promise<boolean> {
    try {
      const shareOptions = {
        url: imageUrl,
        message: product 
          ? `Check out this product image from ${product.title} - ${this.generateProductWebLink(product._id)}` 
          : 'Check out this image from StoreApp',
        title: product ? `${product.title} - Image` : 'StoreApp Image',
      };
      
      await Share.open(shareOptions);
      return true;
    } catch (error) {
      console.error('Error sharing image:', error);
      Alert.alert('Error', 'Failed to share image');
      return false;
    }
  }

  /**
   * Generate share options for different app sections
   */
  static generateAppSectionDeepLink(section: 'home' | 'add-product' | 'cart' | 'profile'): string {
    return `storeapp://${section}`;
  }

  /**
   * Generate web link for app sections
   */
  static generateAppSectionWebLink(section: 'home' | 'add-product' | 'cart' | 'profile'): string {
    return `${this.WEB_BASE_URL}/${section}`;
  }

  /**
   * Share the app itself
   */
  static async shareApp(): Promise<boolean> {
    try {
      const webLink = `${this.WEB_BASE_URL}/home`;
      const shareMessage = `🛍️ Check out StoreApp - the best marketplace for buying and selling products!\n\n🔗 Visit: ${webLink}\n\n📱 Download from your app store!`;
      
      const shareOptions = {
        title: 'StoreApp - Marketplace',
        message: shareMessage,
        subject: 'Check out StoreApp!',
      };

      const result = await Share.open(shareOptions);
      console.log('App share result:', result);
      return true;
    } catch (error) {
      console.error('Error sharing app:', error);
      
      try {
        const fallbackOptions = {
          title: 'StoreApp - Marketplace',
          message: `🛍️ Check out StoreApp - the best marketplace for buying and selling products!\n\n🔗 Visit: ${this.WEB_BASE_URL}/home`,
        };
        
        await RNShare.share(fallbackOptions);
        return true;
      } catch (fallbackError) {
        console.error('Fallback app share failed:', fallbackError);
        Alert.alert(
          'Share StoreApp',
          '🛍️ StoreApp - the best marketplace for buying and selling products!\n\n📱 Search for "StoreApp" in your app store to download!',
          [{ text: 'OK' }]
        );
        return false;
      }
    }
  }

  /**
   * Share a product by ID - fetches product details and then shares
   */
  static async shareProductById(productId: string, useSimpleMessage: boolean = true): Promise<boolean> {
    try {
      console.log('ShareUtils - Fetching product details for sharing:', productId);
      
      // Fetch the product details
      const productResponse = await productApi.getProductById(productId);
      const product = productResponse.data;
      
      if (!product) {
        console.error('ShareUtils - Product not found:', productId);
        // Fallback to basic sharing with just the link
        return this.shareBasicProductLink(productId);
      }
      
      // Use the existing shareProduct method
      return this.shareProduct(product, useSimpleMessage);
    } catch (error) {
      console.error('ShareUtils - Error fetching product for sharing:', error);
      // Fallback to basic sharing with just the link
      return this.shareBasicProductLink(productId);
    }
  }

  /**
   * Share a basic product link when full product details are not available
   */
  static async shareBasicProductLink(productId: string): Promise<boolean> {
    try {
      const webLink = this.generateProductWebLink(productId);
      const shareMessage = `🛍️ Check out this product on StoreApp!\n\n👆 Tap the link to view this product!`;
      
      const shareOptions = {
        title: 'StoreApp Product',
        message: shareMessage,
        url: webLink,
        subject: 'Check out this product on StoreApp',
      };
      
      console.log('ShareUtils - Sharing basic product link:', shareOptions);
      
      // Try react-native-share first
      try {
        const result = await Share.open(shareOptions);
        console.log('Basic product link shared successfully');
        return true;
      } catch (shareError) {
        console.log('react-native-share failed for basic link, trying fallback:', shareError);
        
        // Fallback to React Native's built-in Share
        const result = await RNShare.share({
          title: shareOptions.title,
          message: shareOptions.message,
          url: shareOptions.url,
        });
        
        if (result.action === RNShare.sharedAction) {
          console.log('Basic product link shared successfully via fallback');
          return true;
        } else if (result.action === RNShare.dismissedAction) {
          console.log('Basic product link share dismissed');
          return false;
        }
      }
    } catch (error) {
      console.error('All basic sharing methods failed:', error);
      
      // Final fallback: Show alert with share information
      Alert.alert(
        'Share Product',
        `🛍️ Check out this product on StoreApp!\n\n🔗 Web link: ${this.generateProductWebLink(productId)}\n\n📱 App link: ${this.generateProductDeepLink(productId)}`,
        [{ text: 'OK' }]
      );
      return false;
    }
    
    return false;
  }
}

export default ShareUtils; 