import React, { useRef, useEffect } from 'react';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../store/authStore';
import AuthenticatedStack from './stacks/AuthenticatedStack';
import UnauthenticatedStack from './stacks/UnauthenticatedStack';
import { AuthStackParamList } from './stacks/AuthenticatedStack';
import linking from './linking';
import { deepLinkService } from '../services/deepLinkService';

const Navigator: React.FC = () => {
  const { theme } = useTheme();
  const { isLoggedIn, initialized, loading, error } = useAuth();
  const navigationRef = useRef<NavigationContainerRef<any>>(null);

  // Set navigation ref for deep linking service
  useEffect(() => {
    deepLinkService.setNavigationRef(navigationRef);
  }, []);

  // Handle pending deep links after authentication
  useEffect(() => {
    if (isLoggedIn && initialized) {
      // User just logged in, check for pending deep links
      deepLinkService.handlePendingDeepLinkAfterAuth();
    }
  }, [isLoggedIn, initialized]);

  if (!initialized) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.text }]}>
          Loading app...
        </Text>
      </View>
    );
  }

  if (error) {
    console.error('Auth error:', error);
  }

  return (
    <NavigationContainer 
      ref={navigationRef}
      linking={isLoggedIn ? linking : undefined}
    >
      {isLoggedIn ? (
        <AuthenticatedStack />
      ) : (
        <UnauthenticatedStack />
      )}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  }
});

export default Navigator; 