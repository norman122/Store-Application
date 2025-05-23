import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AuthenticatedStack from './stacks/AuthenticatedStack';
import UnauthenticatedStack from './stacks/UnauthenticatedStack';
import { useAuth } from '../store/authStore';

const Navigator: React.FC = () => {
  const { user, initialized } = useAuth();

  if (!initialized) {
    // You could show a splash screen here
    return null;
  }

  return (
    <NavigationContainer>
      {user ? <AuthenticatedStack /> : <UnauthenticatedStack />}
    </NavigationContainer>
  );
};

export default Navigator; 