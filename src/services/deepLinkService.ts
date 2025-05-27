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
      const { useAuthStore } = require('../store/authStore');
      const authStore = useAuthStore.getState();
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
      const { useAuthStore } = require('../store/authStore');
      const authStore = useAuthStore.getState();
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
    console.log('Parsing deep link:', url);
    
    // Handle storeapp:// scheme
    if (url.startsWith('storeapp://')) {
      const path = url.replace('storeapp://', '');
      console.log('Deep link path:', path);
      
      // Handle product deep links: storeapp://product/123
      if (path.startsWith('product/')) {
        const productId = path.replace('product/', '');
        console.log('Product deep link detected, productId:', productId);
        return {
          screen: 'ProductDetails',
          params: { productId },
        };
      }

      // Handle other routes
      switch (path) {
        case 'home':
          console.log('Home deep link detected');
          return { screen: 'TabNavigator' };
        case 'add-product':
          console.log('Add product deep link detected');
          return { screen: 'AddProduct' };
        case 'cart':
          console.log('Cart deep link detected');
          return { screen: 'TabNavigator' }; // Will default to cart tab
        case 'profile':
          console.log('Profile deep link detected');
          return { screen: 'TabNavigator' }; // Will default to profile tab
        default:
          console.log('Default deep link, navigating to home');
          return { screen: 'TabNavigator' };
      }
    }

    console.log('Unsupported deep link format:', url);
    return null;
  }

  navigateToScreen(data: DeepLinkData, isUserLoggedIn?: boolean) {
    if (!this.navigationRef?.current || !data.screen) {
      console.warn('Navigation ref not available or screen not specified');
      return;
    }

    // If user is not logged in, store the deep link and navigate to login for ANY authenticated screen
    // ProductDetails is only available in AuthenticatedStack, so we need to require login
    if (isUserLoggedIn === false) {
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
          console.log(`Navigating to screen: ${data.screen} with params:`, data.params);
          this.navigationRef.current.navigate(data.screen as any, data.params);
          console.log('Navigation command executed successfully');
        } else {
          console.warn('Navigation ref not ready for immediate navigation');
        }
      }, 100);
    } catch (error) {
      console.error('Error navigating to screen:', error);
    }
  }

  // All screens in AuthenticatedStack require authentication
  // since they're not available in UnauthenticatedStack

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
      
      // Navigate to the pending screen with longer delay to ensure navigation is ready
      setTimeout(() => {
        console.log('Attempting to navigate to pending deep link:', pendingLink);
        if (this.navigationRef?.current?.isReady()) {
          console.log('Navigation is ready, proceeding with navigation');
          this.navigateToScreen(pendingLink, true);
        } else {
          console.warn('Navigation not ready, retrying in 1 second');
          // Retry after another second if navigation isn't ready
          setTimeout(() => {
            if (this.navigationRef?.current?.isReady()) {
              console.log('Navigation ready on retry, proceeding');
              this.navigateToScreen(pendingLink, true);
            } else {
              console.error('Navigation still not ready after retry');
            }
          }, 1000);
        }
      }, 1000); // Increased delay to ensure navigation is ready after auth
    } else {
      console.log('No pending deep link found after authentication');
    }
  }

  // Helper method to generate deep links
  generateProductLink(productId: string): string {
    return `storeapp://product/${productId}`;
  }

  // Note: Web links are not available since we don't have a real website
  // generateWebLink(productId: string): string {
  //   return `https://storeapp.com/product/${productId}`;
  // }

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