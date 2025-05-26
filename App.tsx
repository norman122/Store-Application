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

function App(): React.JSX.Element {
  useEffect(() => {
    // Initialize services
    const initializeServices = async () => {
      try {
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
      }
    };

    initializeServices();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryProvider>
        <SafeAreaProvider>
          <ThemeProvider>
            <Navigator />
          </ThemeProvider>
        </SafeAreaProvider>
      </QueryProvider>
    </GestureHandlerRootView>
  );
}

export default App;
