import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../../screens/LoginScreen/LoginScreen';
import SignupScreen from '../../screens/SignupScreen/SignupScreen';
import VerificationScreen from '../../screens/VerificationScreen/VerificationScreen';
import ForgotPasswordScreen from '../../screens/ForgotPasswordScreen/ForgotPasswordScreen';
import { useAuth } from '../../store/authStore';

export type UnauthStackParamList = {
  Login: undefined;
  Signup: undefined;
  Verification: { email: string };
  ForgotPassword: undefined;
};

const Stack = createNativeStackNavigator<UnauthStackParamList>();

const UnauthenticatedStack: React.FC = () => {
  const { pendingVerification, currentEmail } = useAuth();
  
  // Determine initial route based on auth state
  const initialRoute = pendingVerification ? 'Verification' : 'Login';

  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen 
        name="Verification" 
        component={VerificationScreen} 
        initialParams={pendingVerification ? { email: currentEmail } : undefined}
      />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
};

export default UnauthenticatedStack; 