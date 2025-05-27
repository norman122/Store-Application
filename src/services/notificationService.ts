import notifee, { AndroidImportance, AndroidStyle, EventType } from '@notifee/react-native';
import { Platform } from 'react-native';

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

  setupEventHandlers() {
    // Handle notification press events
    notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.PRESS) {
        this.handleNotificationPress(detail.notification?.data);
      } else if (type === EventType.ACTION_PRESS) {
        this.handleNotificationAction(detail.pressAction?.id, detail.notification?.data);
      }
    });

    // Handle background notification events
    notifee.onBackgroundEvent(async ({ type, detail }) => {
      if (type === EventType.PRESS) {
        this.handleNotificationPress(detail.notification?.data);
      } else if (type === EventType.ACTION_PRESS) {
        this.handleNotificationAction(detail.pressAction?.id, detail.notification?.data);
      }
    });
  }

  handleNotificationPress(data?: NotificationData) {
    if (!data) return;

    // Handle deep linking based on notification data
    if (data.productId && (data.type === 'product_added' || data.type === 'product_updated')) {
      // Import Linking here to avoid circular dependencies
      const { Linking } = require('react-native');
      const deepLink = `storeapp://product/${data.productId}`;
      console.log('Opening product from notification:', deepLink);
      
      // Use React Native's Linking API to open the deep link
      // The deep linking service will handle authentication flow
      Linking.openURL(deepLink).catch((err: any) => {
        console.error('Error opening deep link from notification:', err);
      });
    }
  }

  handleNotificationAction(actionId?: string, data?: NotificationData) {
    if (!actionId || !data) return;

    const { Linking, Share } = require('react-native');

    switch (actionId) {
      case 'view_product':
        if (data.productId) {
          const deepLink = `storeapp://product/${data.productId}`;
          console.log('Opening product from action:', deepLink);
          Linking.openURL(deepLink).catch((err: any) => {
            console.error('Error opening deep link from action:', err);
          });
        }
        break;
      
      case 'share_product':
        if (data.productId) {
          const shareUrl = `storeapp://product/${data.productId}`;
          Share.share({
            message: `Check out this product: ${shareUrl}`,
            url: shareUrl,
          }).catch((err: any) => {
            console.error('Error sharing from notification action:', err);
          });
        }
        break;
      
      case 'browse_products':
        const homeDeepLink = 'storeapp://home';
        console.log('Opening home from welcome notification action:', homeDeepLink);
        Linking.openURL(homeDeepLink).catch((err: any) => {
          console.error('Error opening home from notification action:', err);
        });
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