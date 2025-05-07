import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProductListingScreen from '../../screens/ProductListingScreen/ProductListingScreen';
import ProductDetailsScreen from '../../screens/ProductDetailsScreen/ProductDetailsScreen';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

export type AuthStackParamList = {
  ProductListing: undefined;
  ProductDetails: { productId: string };
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

// Define styles before using them
const styles = StyleSheet.create({
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  themeToggle: {
    padding: 8,
    marginRight: 12,
    borderRadius: 8,
  },
  logoutButton: {
    padding: 8,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
});

const AuthenticatedStack: React.FC = () => {
  const { theme, toggleTheme, isDarkMode } = useTheme();
  const { logout } = useAuth();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.primary,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}>
      <Stack.Screen
        name="ProductListing"
        component={ProductListingScreen}
        options={{
          title: 'Products',
          headerRight: () => (
            <View style={styles.headerButtons}>
              <TouchableOpacity
                style={[styles.themeToggle]}
                onPress={toggleTheme}>
                <Text style={{ color: '#fff' }}>
                  {isDarkMode ? '☀️' : '🌙'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.logoutButton]}
                onPress={logout}>
                <Text style={{ color: '#fff' }}>Logout</Text>
              </TouchableOpacity>
            </View>
          )
        }}
      />
      <Stack.Screen
        name="ProductDetails"
        component={ProductDetailsScreen}
        options={{ title: 'Product Details' }}
      />
    </Stack.Navigator>
  );
};

export default AuthenticatedStack; 