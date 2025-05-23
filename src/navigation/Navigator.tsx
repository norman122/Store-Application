import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../store/authStore';
import AuthenticatedStack from './stacks/AuthenticatedStack';
import UnauthenticatedStack from './stacks/UnauthenticatedStack';

const Navigator: React.FC = () => {
  const { theme } = useTheme();
  const { isLoggedIn, initialized, loading, error } = useAuth();

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
    <NavigationContainer>
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