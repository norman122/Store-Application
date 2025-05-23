/**
 * Eurisko Academy React Native Assignment
 */

import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from './src/context/ThemeContext';
import Navigator from './src/navigation/Navigator';
import { QueryProvider } from './src/utils/api';

function App(): React.JSX.Element {
  return (
    <QueryProvider>
      <SafeAreaProvider>
        <ThemeProvider>
          <Navigator />
        </ThemeProvider>
      </SafeAreaProvider>
    </QueryProvider>
  );
}

export default App;
