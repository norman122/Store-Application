import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define theme colors
interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  cardBackground: string;
  text: string;
  border: string;
  error: string;
  success: string;
}

// Light theme
const lightTheme: ThemeColors = {
  primary: '#2563EB',     // Blue
  secondary: '#6B7280',   // Gray
  background: '#F8FAFC',  // Light gray
  cardBackground: '#FFFFFF', // White
  text: '#1E293B',        // Dark gray
  border: '#E2E8F0',      // Light gray
  error: '#EF4444',       // Red
  success: '#10B981',     // Green
};

// Dark theme
const darkTheme: ThemeColors = {
  primary: '#3B82F6',     // Blue
  secondary: '#9CA3AF',   // Gray
  background: '#1E293B',  // Dark blue/gray
  cardBackground: '#334155', // Slightly lighter dark blue
  text: '#F1F5F9',        // Light gray
  border: '#475569',      // Mid gray
  error: '#F87171',       // Light red
  success: '#34D399',     // Light green
};

// Theme context interface
interface ThemeContextType {
  theme: ThemeColors;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

// Create the context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Provider props
interface ThemeProviderProps {
  children: ReactNode;
}

// Theme provider component
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Get the device color scheme
  const colorScheme = useColorScheme();
  
  // State for the current theme mode
  const [isDarkMode, setIsDarkMode] = useState<boolean>(colorScheme === 'dark');
  
  // Effect to load theme preference from storage
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('themeMode');
        
        if (savedTheme !== null) {
          setIsDarkMode(savedTheme === 'dark');
        } else {
          // If no saved preference, use device preference
          setIsDarkMode(colorScheme === 'dark');
        }
      } catch (error) {
        console.error('Failed to load theme preference', error);
      }
    };
    
    loadThemePreference();
  }, [colorScheme]);
  
  // Function to toggle between light and dark mode
  const toggleTheme = async () => {
    try {
      const newMode = !isDarkMode;
      setIsDarkMode(newMode);
      await AsyncStorage.setItem('themeMode', newMode ? 'dark' : 'light');
    } catch (error) {
      console.error('Failed to save theme preference', error);
    }
  };
  
  // Get the current theme colors based on mode
  const theme = isDarkMode ? darkTheme : lightTheme;
  
  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Hook to use the theme context
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
}; 