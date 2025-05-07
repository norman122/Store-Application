import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';

// Define theme colors
export const lightTheme = {
  background: '#FFFFFF',
  text: '#000000',
  primary: '#6200EE',
  secondary: '#03DAC6',
  accent: '#FF5722',
  cardBackground: '#F5F5F5',
  border: '#E0E0E0',
};

export const darkTheme = {
  background: '#121212',
  text: '#FFFFFF',
  primary: '#BB86FC',
  secondary: '#03DAC6',
  accent: '#FF5722',
  cardBackground: '#1E1E1E',
  border: '#333333',
};

interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
  theme: typeof lightTheme;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize with system preference
  const [isDarkMode, setIsDarkMode] = useState<boolean>(
    Appearance.getColorScheme() === 'dark'
  );

  // Update theme when system preference changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }: { colorScheme: ColorSchemeName }) => {
      setIsDarkMode(colorScheme === 'dark');
    });

    return () => subscription.remove();
  }, []);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, theme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 