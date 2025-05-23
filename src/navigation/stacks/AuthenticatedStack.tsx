import React, { useEffect } from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeIcon, PlusCircleIcon, UserIcon, ChevronLeftIcon } from 'react-native-heroicons/outline';
import { HomeIcon as HomeIconSolid, PlusCircleIcon as PlusCircleIconSolid, UserIcon as UserIconSolid } from 'react-native-heroicons/solid';

import ProductListingScreen from '../../screens/ProductListingScreen/ProductListingScreen';
import ProductDetailsScreen from '../../screens/ProductDetailsScreen/ProductDetailsScreen';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../store/authStore';
import { useApiUtils } from '../../utils/useApiUtils';

// New screens to be created
import ProfileScreen from '../../screens/ProfileScreen/ProfileScreen';
import AddProductScreen from '../../screens/AddProductScreen/AddProductScreen';
import EditProductScreen from '../../screens/EditProductScreen/EditProductScreen';

export type AuthStackParamList = {
  // Tab navigator
  TabNavigator: undefined;
  
  // Screens accessible from tabs
  ProductDetails: { 
    productId: string;
    refresh?: boolean;
    timestamp?: number;
  };
  EditProduct: { productId: string };
};

export type TabNavigatorParamList = {
  Home: undefined;
  AddProduct: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<TabNavigatorParamList>();

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

// Tab Navigator Component
const TabNavigator = () => {
  const { theme, toggleTheme, isDarkMode } = useTheme();
  const { logout } = useAuth();
  const { queryClient } = useApiUtils();
  
  // Fetch products when the user is first authenticated
  useEffect(() => {
    console.log('[TabNavigator] Component mounted, invalidating product queries');
    // Invalidate product queries to trigger a fresh fetch
    queryClient.invalidateQueries({ queryKey: ['products'] });
  }, []);
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.text + '80',
        tabBarStyle: {
          backgroundColor: theme.background,
          borderTopColor: theme.border,
          paddingBottom: 10,
          paddingTop: 5,
          height: 60,
        },
        headerStyle: {
          backgroundColor: theme.primary,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        tabBarIcon: ({ focused, color, size }) => {
          if (route.name === 'Home') {
            return focused ? (
              <HomeIconSolid color={color} size={size} />
            ) : (
              <HomeIcon color={color} size={size} />
            );
          } else if (route.name === 'AddProduct') {
            return focused ? (
              <PlusCircleIconSolid color={color} size={size} />
            ) : (
              <PlusCircleIcon color={color} size={size} />
            );
          } else if (route.name === 'Profile') {
            return focused ? (
              <UserIconSolid color={color} size={size} />
            ) : (
              <UserIcon color={color} size={size} />
            );
          }
          return null;
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
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
      <Tab.Screen 
        name="AddProduct" 
        component={AddProductScreen} 
        options={{ 
          title: 'Add Product',
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ 
          title: 'My Profile',
        }}
      />
    </Tab.Navigator>
  );
};

const AuthenticatedStack: React.FC = () => {
  const { theme } = useTheme();
  const { queryClient } = useApiUtils();
  
  // Fetch products when authenticated stack is mounted
  useEffect(() => {
    console.log('[AuthenticatedStack] Mounted - refreshing product data');
    queryClient.invalidateQueries({ queryKey: ['products'] });
  }, []);
  
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
        name="TabNavigator"
        component={TabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ProductDetails"
        component={ProductDetailsScreen}
        options={({ navigation }) => ({
          title: 'Product Details',
          headerTitleStyle: {
            fontSize: 18,
          },
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate('TabNavigator')}
              style={{ marginRight: 10 }}
            >
              <ChevronLeftIcon size={24} color="#fff" />
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen
        name="EditProduct"
        component={EditProductScreen}
        options={{ title: 'Edit Product' }}
      />
    </Stack.Navigator>
  );
};

export default AuthenticatedStack; 