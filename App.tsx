/**
 * Eurisko Academy React Native Assignment
 */

import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider } from './src/context/ThemeContext';
import Navigator from './src/navigation/Navigator';
import { QueryProvider } from './src/utils/api';
import { notificationService } from './src/services/notificationService';
import { deepLinkService } from './src/services/deepLinkService';
import firebaseService from './src/config/firebase';
import ErrorBoundary from './src/components/ErrorBoundary';

function App(): React.JSX.Element {
  useEffect(() => {
    // Initialize services
    const initializeServices = async () => {
      try {
        // Initialize Firebase and Crashlytics
        console.log('Firebase and Crashlytics initialized');
        
        // Initialize notification service
        await notificationService.initialize();
        console.log('Notification service initialized');

        // Initialize deep linking service with enhanced authentication handling
        const subscription = await deepLinkService.initialize();
        console.log('Deep linking service initialized');

        // Return cleanup function
        return () => {
          subscription?.remove();
        };
      } catch (error) {
        console.error('Error initializing services:', error);
        // Log error to Crashlytics
        firebaseService.recordError(error as Error, 'Service Initialization Error');
      }
    };

    initializeServices();
  }, []);

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <QueryProvider>
          <SafeAreaProvider>
            <ThemeProvider>
              <Navigator />
            </ThemeProvider>
          </SafeAreaProvider>
        </QueryProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

export default App;
