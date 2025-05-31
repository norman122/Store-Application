import notifee, { AndroidImportance, AndroidStyle, EventType } from '@notifee/react-native';
import { Platform } from 'react-native';
import { ShareUtils } from '../utils/shareUtils';
import { productApi } from '../utils/api/services/productService';

export interface NotificationData {
  productId?: string;
  type?: 'product_added' | 'product_updated' | 'general' | 'welcome_back' | 'welcome_new';
  [key: string]: any;
}

class NotificationService {
  private channelId = 'storeapp-default';

  async initialize() {
    // Request permissions
    await this.requestPermissions();
    
    // Create notification channel for Android
    if (Platform.OS === 'android') {
      await this.createChannel();
    }

    // Set up iOS notification categories
    if (Platform.OS === 'ios') {
      await this.setupIOSCategories();
    }

    // Set up notification event handlers
    this.setupEventHandlers();
  }

  async requestPermissions() {
    const settings = await notifee.requestPermission();
    
    if (settings.authorizationStatus === 1) {
      console.log('Notification permissions granted');
    } else {
      console.log('Notification permissions denied');
    }
    
    return settings;
  }

  async createChannel() {
    await notifee.createChannel({
      id: this.channelId,
      name: 'StoreApp Notifications',
      importance: AndroidImportance.HIGH,
      description: 'Notifications for new products and updates',
    });
  }

  async setupIOSCategories() {
    await notifee.setNotificationCategories([
      {
        id: 'product_actions',
        actions: [
          {
            id: 'view_product',
            title: 'View Product',
            foreground: true,
          },
          {
            id: 'share_product',
            title: 'Share',
            foreground: true,
          },
        ],
      },
      {
        id: 'welcome_actions',
        actions: [
          {
            id: 'browse_products',
            title: 'Browse Products',
            foreground: true,
          },
        ],
      },
    ]);
  }

  setupEventHandlers() {
    // Handle notification press events
    notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.PRESS) {
        this.handleNotificationPress(detail.notification?.data);
      } else if (type === EventType.ACTION_PRESS) {
        // Handle async action
        this.handleNotificationAction(detail.pressAction?.id, detail.notification?.data).catch((error) => {
          console.error('Error handling foreground notification action:', error);
        });
      }
    });

    // Handle background notification events
    notifee.onBackgroundEvent(async ({ type, detail }) => {
      if (type === EventType.PRESS) {
        this.handleNotificationPress(detail.notification?.data);
      } else if (type === EventType.ACTION_PRESS) {
        try {
          await this.handleNotificationAction(detail.pressAction?.id, detail.notification?.data);
        } catch (error) {
          console.error('Error handling background notification action:', error);
        }
      }
    });
  }

  handleNotificationPress(data?: NotificationData) {
    if (!data) return;

    // Handle deep linking based on notification data
    if (data.productId && (data.type === 'product_added' || data.type === 'product_updated')) {
      const deepLink = `storeapp://product/${data.productId}`;
      console.log('Opening product from notification:', deepLink);
      
      // Use the deep link service for consistent navigation handling
      // Import here to avoid circular dependencies
      const { deepLinkService } = require('./deepLinkService');
      deepLinkService.handleDeepLink(deepLink);
    }
  }

  async handleNotificationAction(actionId?: string, data?: NotificationData) {
    if (!actionId || !data) return;

    switch (actionId) {
      case 'view_product':
        if (data.productId) {
          const deepLink = `storeapp://product/${data.productId}`;
          console.log('Opening product from notification action:', deepLink);
          
          // Use the deep link service for consistent navigation handling
          // Import here to avoid circular dependencies
          const { deepLinkService } = require('./deepLinkService');
          
          // Check auth status before navigation
          try {
            const { useAuthStore } = require('../store/authStore');
            const authStore = useAuthStore.getState();
            deepLinkService.handleDeepLink(deepLink, authStore.isLoggedIn);
          } catch (error) {
            console.error('Error checking auth status for notification navigation:', error);
            // Fallback: handle without auth status check
            deepLinkService.handleDeepLink(deepLink);
          }
        }
        break;
      
      case 'share_product':
        if (data.productId) {
          try {
            console.log('Sharing product from notification:', data.productId);
            
            // Use ShareUtils.shareProductById - it will handle fetching product details internally
            const shareSuccess = await ShareUtils.shareProductById(data.productId, true);
            console.log('Product shared from notification:', shareSuccess ? 'Success' : 'Failed/Cancelled');
          } catch (error) {
            console.error('Error sharing product from notification:', error);
            
            // Fallback to basic sharing with web link
            const webLink = ShareUtils.generateProductWebLink(data.productId);
            const shareMessage = `🛍️ Check out this product on StoreApp!\n\n👆 Tap the link to view this product!`;
            
            const { Share } = require('react-native');
            Share.share({
              message: shareMessage,
              url: webLink,
            }).catch((shareError: any) => {
              console.error('Fallback share also failed:', shareError);
            });
          }
        }
        break;
      
      case 'browse_products':
        const homeDeepLink = 'storeapp://home';
        console.log('Opening home from welcome notification action:', homeDeepLink);
        
        // Use deep link service for consistency
        const { deepLinkService } = require('./deepLinkService');
        try {
          const { useAuthStore } = require('../store/authStore');
          const authStore = useAuthStore.getState();
          deepLinkService.handleDeepLink(homeDeepLink, authStore.isLoggedIn);
        } catch (error) {
          console.error('Error checking auth status for home navigation:', error);
          deepLinkService.handleDeepLink(homeDeepLink);
        }
        break;
      
      default:
        console.log('Unknown notification action:', actionId);
    }
  }

  async showProductAddedNotification(productTitle: string, productId: string) {
    try {
      await notifee.displayNotification({
        title: 'New Product Added! 🎉',
        body: `"${productTitle}" has been successfully listed in the store`,
        data: {
          productId,
          type: 'product_added',
        },
        android: {
          channelId: this.channelId,
          importance: AndroidImportance.HIGH,
          style: {
            type: AndroidStyle.BIGTEXT,
            text: `Your product "${productTitle}" is now live and available for other users to discover. Share it with friends to get more visibility!`,
          },
          actions: [
            {
              title: 'View Product',
              pressAction: {
                id: 'view_product',
                launchActivity: 'default',
              },
            },
            {
              title: 'Share',
              pressAction: {
                id: 'share_product',
                launchActivity: 'default',
              },
            },
          ],
        },
        ios: {
          categoryId: 'product_actions',
          attachments: [
            {
              id: 'product_image',
              url: 'https://via.placeholder.com/300x200', // You can pass actual product image URL
            },
          ],
        },
      });
    } catch (error) {
      console.error('Error showing product added notification:', error);
    }
  }

  async showProductUpdatedNotification(productTitle: string, productId: string) {
    try {
      await notifee.displayNotification({
        title: 'Product Updated ✅',
        body: `"${productTitle}" has been successfully updated`,
        data: {
          productId,
          type: 'product_updated',
        },
        android: {
          channelId: this.channelId,
          importance: AndroidImportance.DEFAULT,
          actions: [
            {
              title: 'View Product',
              pressAction: {
                id: 'view_product',
                launchActivity: 'default',
              },
            },
          ],
        },
        ios: {
          categoryId: 'product_actions',
        },
      });
    } catch (error) {
      console.error('Error showing product updated notification:', error);
    }
  }

  async showGeneralNotification(title: string, body: string, data?: NotificationData) {
    try {
      await notifee.displayNotification({
        title,
        body,
        data: {
          type: 'general',
          ...data,
        },
        android: {
          channelId: this.channelId,
          importance: AndroidImportance.DEFAULT,
        },
      });
    } catch (error) {
      console.error('Error showing general notification:', error);
    }
  }

  async showWelcomeBackNotification(userName?: string) {
    try {
      const displayName = userName ? userName : 'there';
      await notifee.displayNotification({
        title: 'Welcome Back! 👋',
        body: `Hi ${displayName}! Great to see you again. Check out what's new in the store!`,
        data: {
          type: 'welcome_back',
        },
        android: {
          channelId: this.channelId,
          importance: AndroidImportance.DEFAULT,
          style: {
            type: AndroidStyle.BIGTEXT,
            text: `Welcome back to StoreApp! We've missed you. Discover amazing new products and great deals waiting for you.`,
          },
          actions: [
            {
              title: 'Browse Products',
              pressAction: {
                id: 'browse_products',
                launchActivity: 'default',
              },
            },
          ],
        },
        ios: {
          categoryId: 'welcome_actions',
        },
      });
    } catch (error) {
      console.error('Error showing welcome back notification:', error);
    }
  }

  async showWelcomeNewUserNotification(userName?: string) {
    try {
      const displayName = userName ? userName : 'there';
      await notifee.displayNotification({
        title: 'Welcome to StoreApp! 🎉',
        body: `Hi ${displayName}! Your account is ready. Start exploring amazing products!`,
        data: {
          type: 'welcome_new',
        },
        android: {
          channelId: this.channelId,
          importance: AndroidImportance.HIGH,
          style: {
            type: AndroidStyle.BIGTEXT,
            text: `Welcome to StoreApp! You're all set up and ready to discover amazing products, connect with sellers, and find great deals. Start your shopping journey now!`,
          },
          actions: [
            {
              title: 'Start Shopping',
              pressAction: {
                id: 'browse_products',
                launchActivity: 'default',
              },
            },
          ],
        },
        ios: {
          categoryId: 'welcome_actions',
        },
      });
    } catch (error) {
      console.error('Error showing welcome new user notification:', error);
    }
  }

  async cancelAllNotifications() {
    await notifee.cancelAllNotifications();
  }

  async cancelNotification(notificationId: string) {
    await notifee.cancelNotification(notificationId);
  }
}

export const notificationService = new NotificationService();
export default notificationService; 