import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

// Stacks
import AuthenticatedStack from './stacks/AuthenticatedStack';
import UnauthStack from './stacks/UnauthStack';

const Navigator: React.FC = () => {
  const { isLoggedIn, pendingVerification } = useAuth();
  const { isDarkMode, theme } = useTheme();

  return (
    <NavigationContainer>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={theme.background}
      />
      {isLoggedIn ? <AuthenticatedStack /> : <UnauthStack initialRoute={pendingVerification ? 'Verification' : 'Login'} />}
    </NavigationContainer>
  );
};

export default Navigator; 