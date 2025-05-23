import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Conditionally import maps
let MapView: any;
let Marker: any;
let mapError = false;

// Define Region type since we're not importing it directly
export type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

try {
  const ReactNativeMaps = require('react-native-maps');
  MapView = ReactNativeMaps.default;
  Marker = ReactNativeMaps.Marker;
} catch (error) {
  console.error('Failed to load react-native-maps:', error);
  mapError = true;
}

export { MapView, Marker, mapError };

/**
 * A wrapper component for MapView that handles errors gracefully
 */
export const SafeMapView = ({ 
  children, 
  style, 
  onError 
}: { 
  children: React.ReactNode, 
  style?: any, 
  onError?: () => void 
}) => {
  const [error, setError] = useState(mapError);
  
  useEffect(() => {
    if (mapError && onError) {
      onError();
    }
  }, [onError]);
  
  if (error || mapError) {
    return (
      <View style={[style, styles.mapErrorContainer]}>
        <Text style={styles.mapErrorText}>Map is unavailable</Text>
        <Text style={styles.mapErrorSubtext}>Please check your device settings</Text>
      </View>
    );
  }
  
  return <View style={style}>{children}</View>;
};

/**
 * Utility function to validate map coordinates
 */
export const isValidCoordinate = (lat?: number, lng?: number): boolean => {
  return (
    lat !== undefined && 
    lng !== undefined && 
    !isNaN(lat) && 
    !isNaN(lng) && 
    lat !== 0 && 
    lng !== 0 && 
    lat >= -90 && 
    lat <= 90 && 
    lng >= -180 && 
    lng <= 180
  );
};

const styles = StyleSheet.create({
  mapErrorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
  },
  mapErrorText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  mapErrorSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
}); 