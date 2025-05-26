import { Linking } from 'react-native';
import { NavigationContainerRef } from '@react-navigation/native';
import { AuthStackParamList } from '../navigation/stacks/AuthenticatedStack';
import { UnauthStackParamList } from '../navigation/stacks/UnauthenticatedStack';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface DeepLinkData {
  screen?: string;
  params?: any;
}

const PENDING_DEEP_LINK_KEY = '@StoreApp:pendingDeepLink';

class DeepLinkService {
  private navigationRef: React.RefObject<NavigationContainerRef<any> | null> | null = null;
  private pendingDeepLink: DeepLinkData | null = null;

  setNavigationRef(ref: React.RefObject<NavigationContainerRef<any> | null>) {
    this.navigationRef = ref;
  }

  async initialize() {
    // Handle initial URL when app is opened from a deep link
    const initialUrl = await Linking.getInitialURL();
    if (initialUrl) {
      // We'll handle this after we know the auth status
      setTimeout(() => {
        this.handleInitialDeepLink(initialUrl);
      }, 1000);
    }

    // Listen for incoming deep links when app is already running
    const subscription = Linking.addEventListener('url', (event) => {
      this.handleRuntimeDeepLink(event.url);
    });

    return subscription;
  }

  private async handleInitialDeepLink(url: string) {
    // For initial deep links, we need to check auth status
    try {
      // Import here to avoid circular dependencies
      const { useAuth } = require('../store/authStore');
      const authStore = useAuth.getState();
      this.handleDeepLink(url, authStore.isLoggedIn);
    } catch (error) {
      console.error('Error handling initial deep link:', error);
      // Fallback: handle without auth status
      this.handleDeepLink(url);
    }
  }

  private async handleRuntimeDeepLink(url: string) {
    // For runtime deep links, we can check current auth status
    try {
      const { useAuth } = require('../store/authStore');
      const authStore = useAuth.getState();
      this.handleDeepLink(url, authStore.isLoggedIn);
    } catch (error) {
      console.error('Error handling runtime deep link:', error);
      // Fallback: handle without auth status
      this.handleDeepLink(url);
    }
  }

  handleDeepLink(url: string, isUserLoggedIn?: boolean) {
    console.log('Deep link received:', url);

    try {
      const parsedData = this.parseDeepLink(url);
      if (parsedData) {
        this.navigateToScreen(parsedData, isUserLoggedIn);
      }
    } catch (error) {
      console.error('Error handling deep link:', error);
    }
  }

  parseDeepLink(url: string): DeepLinkData | null {
    // Handle storeapp:// scheme
    if (url.startsWith('storeapp://')) {
      const path = url.replace('storeapp://', '');
      
      // Handle product deep links: storeapp://product/123
      if (path.startsWith('product/')) {
        const productId = path.replace('product/', '');
        return {
          screen: 'ProductDetails',
          params: { productId },
        };
      }

      // Handle other routes
      switch (path) {
        case 'home':
          return { screen: 'TabNavigator' };
        case 'add-product':
          return { screen: 'AddProduct' };
        case 'cart':
          return { screen: 'TabNavigator' }; // Will default to cart tab
        case 'profile':
          return { screen: 'TabNavigator' }; // Will default to profile tab
        default:
          return { screen: 'TabNavigator' };
      }
    }

    // Handle https:// scheme for web links
    if (url.startsWith('https://storeapp.com')) {
      const urlObj = new URL(url);
      const path = urlObj.pathname;

      if (path.startsWith('/product/')) {
        const productId = path.replace('/product/', '');
        return {
          screen: 'ProductDetails',
          params: { productId },
        };
      }

      if (path.startsWith('/edit-product/')) {
        const productId = path.replace('/edit-product/', '');
        return {
          screen: 'EditProduct',
          params: { productId },
        };
      }

      // Default to home for other web links
      return { screen: 'TabNavigator' };
    }

    return null;
  }

  navigateToScreen(data: DeepLinkData, isUserLoggedIn?: boolean) {
    if (!this.navigationRef?.current || !data.screen) {
      console.warn('Navigation ref not available or screen not specified');
      return;
    }

    // If user is not logged in and trying to access a protected screen, store the deep link and navigate to login
    if (isUserLoggedIn === false && this.isProtectedScreen(data.screen)) {
      console.log('User not logged in, storing deep link and navigating to login:', data);
      this.storePendingDeepLink(data);
      
      // Navigate to login screen
      setTimeout(() => {
        if (this.navigationRef?.current?.isReady()) {
          // Since we're in unauthenticated state, we need to navigate to Login in the UnauthenticatedStack
          this.navigationRef.current.navigate('Login' as any);
        }
      }, 100);
      return;
    }

    try {
      // Wait a bit to ensure navigation is ready
      setTimeout(() => {
        if (this.navigationRef?.current?.isReady()) {
          this.navigationRef.current.navigate(data.screen as any, data.params);
        }
      }, 100);
    } catch (error) {
      console.error('Error navigating to screen:', error);
    }
  }

  private isProtectedScreen(screen: string): boolean {
    // Define which screens require authentication
    const protectedScreens = ['ProductDetails', 'EditProduct', 'AddProduct'];
    return protectedScreens.includes(screen);
  }

  async storePendingDeepLink(data: DeepLinkData) {
    try {
      this.pendingDeepLink = data;
      await AsyncStorage.setItem(PENDING_DEEP_LINK_KEY, JSON.stringify(data));
      console.log('Stored pending deep link:', data);
    } catch (error) {
      console.error('Error storing pending deep link:', error);
    }
  }

  async getPendingDeepLink(): Promise<DeepLinkData | null> {
    try {
      const stored = await AsyncStorage.getItem(PENDING_DEEP_LINK_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      return this.pendingDeepLink;
    } catch (error) {
      console.error('Error getting pending deep link:', error);
      return null;
    }
  }

  async clearPendingDeepLink() {
    try {
      this.pendingDeepLink = null;
      await AsyncStorage.removeItem(PENDING_DEEP_LINK_KEY);
      console.log('Cleared pending deep link');
    } catch (error) {
      console.error('Error clearing pending deep link:', error);
    }
  }

  async handlePendingDeepLinkAfterAuth() {
    const pendingLink = await this.getPendingDeepLink();
    if (pendingLink) {
      console.log('Handling pending deep link after authentication:', pendingLink);
      await this.clearPendingDeepLink();
      
      // Navigate to the pending screen
      setTimeout(() => {
        this.navigateToScreen(pendingLink, true);
      }, 500); // Small delay to ensure navigation is ready after auth
    }
  }

  // Helper method to generate deep links
  generateProductLink(productId: string): string {
    return `storeapp://product/${productId}`;
  }

  generateWebLink(productId: string): string {
    return `https://storeapp.com/product/${productId}`;
  }

  // Method to open external URLs
  async openURL(url: string) {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        console.warn(`Cannot open URL: ${url}`);
      }
    } catch (error) {
      console.error('Error opening URL:', error);
    }
  }
}

export const deepLinkService = new DeepLinkService();
export default deepLinkService; 