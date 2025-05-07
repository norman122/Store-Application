import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';

// Screens
import SignupScreen from '../../screens/SignupScreen/SignupScreen';
import LoginScreen from '../../screens/LoginScreen/LoginScreen';
import VerificationScreen from '../../screens/VerificationScreen/VerificationScreen';

export type UnauthStackParamList = {
  Login: undefined;
  Signup: undefined;
  Verification: { email: string };
};

interface UnauthStackProps {
  initialRoute?: keyof UnauthStackParamList;
}

const Stack = createNativeStackNavigator<UnauthStackParamList>();

const UnauthStack: React.FC<UnauthStackProps> = ({ initialRoute = 'Login' }) => {
  // Get current email from auth context to pass to verification screen
  const { pendingVerification, currentEmail } = useAuth();
  
  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen 
        name="Verification" 
        component={VerificationScreen}
        initialParams={{ email: currentEmail || 'eurisko@gmail.com' }} 
      />
    </Stack.Navigator>
  );
};

export default UnauthStack; 