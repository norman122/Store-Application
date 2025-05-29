import { getApp } from '@react-native-firebase/app';
import crashlytics from '@react-native-firebase/crashlytics';
import analytics from '@react-native-firebase/analytics';

// Initialize Firebase (this happens automatically when the app starts)
// But we can configure Crashlytics here

// Modern Firebase service using the latest API
class FirebaseService {
  private crashlyticsInstance = crashlytics();
  private analyticsInstance = analytics();

  constructor() {
    this.initializeFirebase();
  }

  private async initializeFirebase() {
    try {
      // Initialize Crashlytics
      await this.initializeCrashlytics();
      
      // Initialize Analytics
      await this.initializeAnalytics();
    } catch (error) {
      console.error('🔥 [Firebase] Error initializing Firebase services:', error);
    }
  }

  private async initializeCrashlytics() {
    try {
      // Force enable Crashlytics collection
      await this.crashlyticsInstance.setCrashlyticsCollectionEnabled(true);
      
      // Log the current state
      const isEnabled = this.crashlyticsInstance.isCrashlyticsCollectionEnabled;
      console.log('🔥 [Firebase] Crashlytics collection enabled:', isEnabled);
      
      if (__DEV__) {
        console.log('🔥 [Firebase] Running in development mode - Crashlytics should be active');
        // Force a test log to verify it's working
        this.crashlyticsInstance.log('Firebase Crashlytics initialized in development mode');
      } else {
        console.log('🔥 [Firebase] Running in production mode');
      }
    } catch (error) {
      console.error('🔥 [Firebase] Error initializing Crashlytics:', error);
    }
  }

  private async initializeAnalytics() {
    try {
      // Enable Analytics collection
      await this.analyticsInstance.setAnalyticsCollectionEnabled(true);
      console.log('🔥 [Firebase] Analytics initialized and enabled');
    } catch (error) {
      console.error('🔥 [Firebase] Error initializing Analytics:', error);
    }
  }

  // Crashlytics methods
  logMessage(message: string): void {
    this.crashlyticsInstance.log(message);
  }

  setUserId(userId: string): void {
    // Set user ID for both Crashlytics and Analytics
    this.crashlyticsInstance.setUserId(userId);
    this.analyticsInstance.setUserId(userId);
  }

  setAttribute(key: string, value: string): void {
    this.crashlyticsInstance.setAttribute(key, value);
  }

  recordError(error: Error, jsErrorName?: string): void {
    this.crashlyticsInstance.recordError(error, jsErrorName);
  }

  // Analytics methods
  logEvent(eventName: string, parameters?: Record<string, any>): void {
    this.analyticsInstance.logEvent(eventName, parameters);
  }

  setUserProperties(properties: Record<string, string>): void {
    Object.entries(properties).forEach(([key, value]) => {
      this.analyticsInstance.setUserProperty(key, value);
    });
  }

  // Crashlytics crash methods
  crash(): void {
    this.crashlyticsInstance.crash();
  }

  testCrash(): never {
    throw new Error('Test crash from Firebase Crashlytics');
  }

  // Status getters
  get isCrashlyticsCollectionEnabled(): boolean {
    return this.crashlyticsInstance.isCrashlyticsCollectionEnabled;
  }
}

export default new FirebaseService(); 